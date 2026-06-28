// 装修前决策助手 — 页面交互

(function () {
  'use strict';

  const STORAGE_KEY = DECISION_HELPER_DATA.storageKey;
  const PLANNING_DIRTY_MESSAGE = '你的需求发生了变化，是否重新生成预留规划？重新生成可能会覆盖未保存的自动项，但尽量保留你手动新增和已填写备注的内容。';

  let state = createEmptyState();
  let initialized = false;
  let draftPromptDismissed = false;

  document.addEventListener('DOMContentLoaded', () => {
    initDecisionHelperEvents();
  });

  window.renderDecisionHelperPage = function () {
    initDecisionHelperEvents();
    state = loadState();
    renderDecisionHelper();
  };

  function initDecisionHelperEvents() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', event => {
      const start = event.target.closest('[data-decision-helper-start]');
      if (start) {
        event.preventDefault();
        if (typeof window.navigateToPage === 'function') window.navigateToPage('decision-helper');
      }
    });

    const root = document.getElementById('decision-helper-root');
    if (!root) return;

    root.addEventListener('click', event => {
      const actionEl = event.target.closest('[data-dh-action]');
      if (actionEl) {
        handleAction(actionEl.dataset.dhAction, actionEl);
        return;
      }

      const groupEl = event.target.closest('[data-dh-group]');
      if (groupEl) {
        state.diagnosisGroup = Number(groupEl.dataset.dhGroup) || 0;
        saveState(false);
        renderDecisionHelper();
        return;
      }

      const needToggle = event.target.closest('[data-dh-need-toggle]');
      if (needToggle) {
        const card = needToggle.closest('.decision-need-section');
        if (card) card.classList.toggle('is-open');
        const expanded = card?.classList.contains('is-open') ? 'true' : 'false';
        needToggle.setAttribute('aria-expanded', expanded);
      }
    });

    root.addEventListener('input', event => {
      const target = event.target;
      if (target.matches('[data-dh-field]')) updateAnswerFromInput(target);
      if (target.matches('[data-dh-note]')) updateNeedNoteFromInput(target);
      if (target.matches('[data-dh-plan-field]')) updatePointPlanFromInput(target);
      if (target.matches('[data-dh-dimension-field]')) updateDimensionFromInput(target);
    });

    root.addEventListener('change', event => {
      const target = event.target;
      if (target.matches('[data-dh-field]')) updateAnswerFromInput(target);
      if (target.matches('[data-dh-need]')) updateNeedFromInput(target);
      if (target.matches('[data-dh-plan-field]')) updatePointPlanFromInput(target);
      if (target.matches('[data-dh-dimension-field]')) updateDimensionFromInput(target);
    });
  }

  function createEmptyState() {
    return {
      step: 1,
      diagnosisGroup: 0,
      answers: {},
      needs: {},
      pointPlanItems: [],
      dimensionReferenceItems: [],
      planningTab: 'points',
      planningDirty: false,
      report: null,
      updatedAt: null,
    };
  }

  function loadState() {
    const saved = StorageUtil.get(getStorageKey(), null);
    const next = { ...createEmptyState(), ...(saved || {}) };
    next.step = Math.min(4, Math.max(1, Number(next.step) || 1));
    next.answers = next.answers || {};
    next.needs = next.needs || {};
    next.pointPlanItems = Array.isArray(next.pointPlanItems) ? next.pointPlanItems.map(normalizePointForState) : [];
    next.dimensionReferenceItems = Array.isArray(next.dimensionReferenceItems) ? next.dimensionReferenceItems.map(normalizeDimensionForState) : [];
    next.planningTab = next.planningTab === 'dimensions' ? 'dimensions' : 'points';
    next.planningDirty = Boolean(next.planningDirty);

    DECISION_HELPER_DATA.needSections.forEach(section => {
      if (!next.needs[section.id]) next.needs[section.id] = { selected: [], note: '' };
      if (!Array.isArray(next.needs[section.id].selected)) next.needs[section.id].selected = [];
      next.needs[section.id].note = next.needs[section.id].note || '';
    });
    return next;
  }

  function getStorageKey() {
    return (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.DECISION_HELPER) || STORAGE_KEY;
  }

  function saveState(showMessage) {
    state.updatedAt = new Date().toISOString();
    StorageUtil.set(getStorageKey(), state);
    if (showMessage) toast('草稿已保存');
  }

  function renderDecisionHelper() {
    const root = document.getElementById('decision-helper-root');
    if (!root) return;

    root.innerHTML = `
      <div class="decision-helper-shell">
        ${renderDraftPrompt()}
        ${renderIntro()}
        ${renderStepper()}
        <div class="decision-step-body">
          ${state.step === 1 ? renderDiagnosisStep() : ''}
          ${state.step === 2 ? renderNeedsStep() : ''}
          ${state.step === 3 ? renderPlanningStep() : ''}
          ${state.step === 4 ? renderReportStep() : ''}
        </div>
        ${renderActions()}
      </div>
    `;
  }

  function renderDraftPrompt() {
    if (!state.updatedAt || draftPromptDismissed) return '';
    return `
      <div class="decision-draft-banner">
        <div>
          <strong>检测到上次填写记录，是否继续？</strong>
          <span>最后保存：${formatDecisionDate(state.updatedAt)}</span>
        </div>
        <div class="decision-draft-actions">
          <button class="btn btn-primary btn-sm" type="button" data-dh-action="continue-draft">继续填写</button>
          <button class="btn btn-secondary btn-sm" type="button" data-dh-action="restart">重新开始</button>
        </div>
      </div>
    `;
  }

  function renderIntro() {
    return `
      <div class="decision-hero card">
        <div>
          <div class="decision-eyebrow">装修前先想清楚，再开工</div>
          <h2>装修前决策助手</h2>
          <p>从装修方式、全屋需求到水电点位和尺寸预留，帮你在开工前把容易返工的事项先列清楚。</p>
        </div>
        <div class="decision-hero-stats">
          <span>4 步</span>
          <span>本地保存</span>
          <span>可打印</span>
        </div>
      </div>
    `;
  }

  function renderStepper() {
    const steps = [
      { id: 1, title: '装修方式诊断' },
      { id: 2, title: '全屋需求确认' },
      { id: 3, title: '预留规划' },
      { id: 4, title: '结果报告' },
    ];
    return `
      <div class="decision-stepper" aria-label="填写进度">
        ${steps.map(step => `
          <button class="decision-step ${state.step === step.id ? 'active' : ''} ${state.step > step.id ? 'done' : ''}" type="button" data-dh-action="go-step" data-step="${step.id}">
            <span>步骤 ${step.id}/4</span>
            <strong>${step.title}</strong>
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderDiagnosisStep() {
    const groupIndex = Math.min(Math.max(Number(state.diagnosisGroup) || 0, 0), DECISION_HELPER_DATA.diagnosisGroups.length - 1);
    const group = DECISION_HELPER_DATA.diagnosisGroups[groupIndex];
    return `
      <div class="decision-layout">
        <aside class="decision-group-tabs">
          ${DECISION_HELPER_DATA.diagnosisGroups.map((item, index) => `
            <button class="decision-group-tab ${index === groupIndex ? 'active' : ''}" type="button" data-dh-group="${index}">
              <span>${index + 1}</span>${escapeDecisionHtml(item.title)}
            </button>
          `).join('')}
        </aside>
        <section class="card decision-form-card">
          <div class="card-header">
            <div>
              <div class="card-title">${escapeDecisionHtml(group.title)}</div>
              <div class="card-subtitle">先按组填写，不用一次铺满整屏。</div>
            </div>
            <span class="decision-mini-progress">${groupIndex + 1}/${DECISION_HELPER_DATA.diagnosisGroups.length}</span>
          </div>
          <div class="decision-fields">
            ${group.fields.map(renderField).join('')}
          </div>
          <div class="decision-group-actions">
            <button class="btn btn-secondary" type="button" data-dh-action="prev-group" ${groupIndex === 0 ? 'disabled' : ''}>上一组</button>
            <button class="btn btn-secondary" type="button" data-dh-action="next-group" ${groupIndex === DECISION_HELPER_DATA.diagnosisGroups.length - 1 ? 'disabled' : ''}>下一组</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderField(field) {
    const value = state.answers[field.id];
    if (field.type === 'number') {
      return `
        <div class="decision-field">
          <label class="form-label" for="dh-${field.id}">${escapeDecisionHtml(field.label)}</label>
          <input class="form-input" id="dh-${field.id}" type="number" min="0" inputmode="decimal" placeholder="${escapeDecisionHtml(field.placeholder || '')}" data-dh-field="${field.id}" value="${escapeDecisionHtml(value || '')}">
        </div>
      `;
    }

    const selected = Array.isArray(value) ? value : [];
    return `
      <fieldset class="decision-field">
        <legend class="form-label">${escapeDecisionHtml(field.label)}</legend>
        <div class="decision-option-grid">
          ${field.options.map(option => {
            const checked = field.type === 'radio' ? value === option : selected.includes(option);
            return `
              <label class="decision-option ${checked ? 'checked' : ''}">
                <input type="${field.type}" name="dh-${field.id}" value="${escapeDecisionHtml(option)}" data-dh-field="${field.id}" data-max="${field.max || ''}" ${checked ? 'checked' : ''}>
                <span>${escapeDecisionHtml(option)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </fieldset>
    `;
  }

  function renderNeedsStep() {
    return `
      <div class="decision-needs-grid">
        ${DECISION_HELPER_DATA.needSections.map((section, index) => {
          const need = ensureNeedSection(section.id);
          const isOpen = index < 3 || need.selected.length > 0 || need.note;
          return `
            <section class="card decision-need-section ${isOpen ? 'is-open' : ''}">
              <button class="decision-need-header" type="button" data-dh-need-toggle="${section.id}" aria-expanded="${isOpen ? 'true' : 'false'}">
                <span>${index + 1}. ${escapeDecisionHtml(section.title)}</span>
                <small>${need.selected.length} 项</small>
              </button>
              <div class="decision-need-body">
                <div class="decision-option-grid decision-option-grid-compact">
                  ${section.options.map(option => `
                    <label class="decision-option ${need.selected.includes(option) ? 'checked' : ''}">
                      <input type="checkbox" value="${escapeDecisionHtml(option)}" data-dh-need="${section.id}" ${need.selected.includes(option) ? 'checked' : ''}>
                      <span>${escapeDecisionHtml(option)}</span>
                    </label>
                  `).join('')}
                </div>
                <label class="form-label" for="need-note-${section.id}">备注</label>
                <textarea class="form-textarea decision-note" id="need-note-${section.id}" data-dh-note="${section.id}" placeholder="这里可以写尺寸、习惯、家人意见或待确认问题">${escapeDecisionHtml(need.note || '')}</textarea>
              </div>
            </section>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderPlanningStep() {
    if (!hasPlanningItems() && hasSelectedNeeds()) {
      regeneratePlanning();
      saveState(false);
    }

    const activeTab = state.planningTab === 'dimensions' ? 'dimensions' : 'points';
    return `
      <section class="decision-planning">
        <div class="card decision-planning-header">
          <div>
            <div class="decision-eyebrow">需求联动预留规划</div>
            <h2>把生活需求翻译成水电、点位和尺寸清单</h2>
            <p>下面的内容由第 2 步勾选项自动生成，你可以继续删改、备注和补充自定义事项。</p>
          </div>
          <div class="decision-planning-stats">
            <span>${state.pointPlanItems.length} 个点位</span>
            <span>${state.dimensionReferenceItems.length} 个尺寸参考</span>
            <span>${countConfirmedPlanningItems()} 个已确认</span>
          </div>
        </div>

        ${state.planningDirty ? renderPlanningDirtyPrompt() : ''}
        <p class="decision-planning-disclaimer">${escapeDecisionHtml(getPlanningDisclaimer())}</p>

        <div class="decision-planning-toolbar">
          <div class="decision-planning-tabs" role="tablist" aria-label="预留规划类型">
            <button class="${activeTab === 'points' ? 'active' : ''}" type="button" data-dh-action="set-planning-tab" data-tab="points">点位规划</button>
            <button class="${activeTab === 'dimensions' ? 'active' : ''}" type="button" data-dh-action="set-planning-tab" data-tab="dimensions">尺寸参考</button>
          </div>
          <div class="decision-planning-toolbar-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-dh-action="regenerate-planning">重新生成</button>
            ${activeTab === 'points'
              ? '<button class="btn btn-primary btn-sm" type="button" data-dh-action="add-custom-point">新增自定义点位</button>'
              : '<button class="btn btn-primary btn-sm" type="button" data-dh-action="add-custom-dimension">新增自定义尺寸参考</button>'}
          </div>
        </div>

        ${activeTab === 'points' ? renderPointPlanningList() : renderDimensionPlanningList()}
      </section>
    `;
  }

  function renderPlanningDirtyPrompt() {
    return `
      <div class="decision-planning-alert">
        <p>${PLANNING_DIRTY_MESSAGE}</p>
        <div>
          <button class="btn btn-primary btn-sm" type="button" data-dh-action="regenerate-planning">重新生成预留规划</button>
          <button class="btn btn-secondary btn-sm" type="button" data-dh-action="dismiss-planning-dirty">先保留当前清单</button>
        </div>
      </div>
    `;
  }

  function renderPointPlanningList() {
    if (!state.pointPlanItems.length) {
      return `<div class="card decision-empty-planning"><strong>还没有点位规划</strong><p>${hasSelectedNeeds() ? '当前勾选项暂未触发点位规则，你可以手动新增。' : '先回到上一步勾选全屋需求，再生成预留规划。'}</p></div>`;
    }

    return `
      <div class="decision-plan-list">
        ${state.pointPlanItems.map(item => `
          <article class="card decision-plan-card ${item.confirmed ? 'is-confirmed' : ''}">
            <div class="decision-plan-card-header">
              <div>
                <div class="decision-plan-meta">
                  <span>${escapeDecisionHtml(item.room)}</span>
                  <span>${escapeDecisionHtml(getPointTypeLabel(item.type))}</span>
                  <span>${escapeDecisionHtml(item.stage)}</span>
                  <span>来源：${escapeDecisionHtml(item.sourceNeed)}</span>
                  <span>重要度：${escapeDecisionHtml(getImportanceLabel(item.importance))}</span>
                </div>
                <label class="form-label" for="point-title-${item.id}">标题</label>
                <input class="form-input decision-plan-title-input" id="point-title-${item.id}" data-dh-plan-field="title" data-item-id="${escapeDecisionHtml(item.id)}" value="${escapeDecisionHtml(item.title)}">
              </div>
              <button class="btn btn-danger btn-sm" type="button" data-dh-action="delete-point" data-item-id="${escapeDecisionHtml(item.id)}">删除</button>
            </div>

            <div class="decision-plan-edit-grid">
              ${renderTextInput('空间', 'room', item.id, item.room, 'plan')}
              ${renderSelectInput('类型', 'type', item.id, item.type, getPointTypes().map(type => ({ value: type, label: getPointTypeLabel(type) })), 'plan')}
              ${renderTextInput('数量', 'quantity', item.id, item.quantity, 'plan')}
              ${renderSelectInput('确认阶段', 'stage', item.id, item.stage, getPlanningStages().map(stage => ({ value: stage, label: stage })), 'plan')}
              ${renderSelectInput('重要程度', 'importance', item.id, item.importance, Object.entries(getImportanceLabels()).map(([value, label]) => ({ value, label })), 'plan')}
            </div>

            <label class="form-label" for="point-suggestion-${item.id}">建议</label>
            <textarea class="form-textarea decision-plan-textarea" id="point-suggestion-${item.id}" data-dh-plan-field="suggestion" data-item-id="${escapeDecisionHtml(item.id)}">${escapeDecisionHtml(item.suggestion || '')}</textarea>

            <label class="form-label" for="point-note-${item.id}">备注</label>
            <textarea class="form-textarea decision-plan-textarea" id="point-note-${item.id}" data-dh-plan-field="userNote" data-item-id="${escapeDecisionHtml(item.id)}" placeholder="例如型号、位置、待问施工方的问题">${escapeDecisionHtml(item.userNote || '')}</textarea>

            <label class="decision-confirm-row">
              <input type="checkbox" data-dh-plan-field="confirmed" data-item-id="${escapeDecisionHtml(item.id)}" ${item.confirmed ? 'checked' : ''}>
              <span>已确认</span>
            </label>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderDimensionPlanningList() {
    if (!state.dimensionReferenceItems.length) {
      return `<div class="card decision-empty-planning"><strong>还没有尺寸参考</strong><p>${hasSelectedNeeds() ? '当前勾选项暂未触发尺寸参考，你可以手动新增。' : '先回到上一步勾选全屋需求，再生成预留规划。'}</p></div>`;
    }

    return `
      <div class="decision-plan-list">
        ${state.dimensionReferenceItems.map(item => `
          <article class="card decision-plan-card ${item.confirmed ? 'is-confirmed' : ''}">
            <div class="decision-plan-card-header">
              <div>
                <div class="decision-plan-meta">
                  <span>${escapeDecisionHtml(item.room)}</span>
                  <span>${escapeDecisionHtml(item.stage)}</span>
                  <span>来源：${escapeDecisionHtml(item.sourceNeed)}</span>
                </div>
                <label class="form-label" for="dimension-title-${item.id}">标题</label>
                <input class="form-input decision-plan-title-input" id="dimension-title-${item.id}" data-dh-dimension-field="title" data-item-id="${escapeDecisionHtml(item.id)}" value="${escapeDecisionHtml(item.title)}">
              </div>
              <button class="btn btn-danger btn-sm" type="button" data-dh-action="delete-dimension" data-item-id="${escapeDecisionHtml(item.id)}">删除</button>
            </div>

            <div class="decision-plan-edit-grid">
              ${renderTextInput('空间', 'room', item.id, item.room, 'dimension')}
              ${renderSelectInput('确认阶段', 'stage', item.id, item.stage, getPlanningStages().map(stage => ({ value: stage, label: stage })), 'dimension')}
            </div>

            <label class="form-label" for="dimension-reference-${item.id}">参考内容</label>
            <textarea class="form-textarea decision-plan-textarea" id="dimension-reference-${item.id}" data-dh-dimension-field="reference" data-item-id="${escapeDecisionHtml(item.id)}">${escapeDecisionHtml(item.reference || '')}</textarea>

            <label class="form-label" for="dimension-warning-${item.id}">注意事项</label>
            <textarea class="form-textarea decision-plan-textarea" id="dimension-warning-${item.id}" data-dh-dimension-field="warning" data-item-id="${escapeDecisionHtml(item.id)}">${escapeDecisionHtml(item.warning || '')}</textarea>

            <label class="form-label" for="dimension-note-${item.id}">备注</label>
            <textarea class="form-textarea decision-plan-textarea" id="dimension-note-${item.id}" data-dh-dimension-field="userNote" data-item-id="${escapeDecisionHtml(item.id)}" placeholder="例如待确认型号、现场限制、柜体方案">${escapeDecisionHtml(item.userNote || '')}</textarea>

            <label class="decision-confirm-row">
              <input type="checkbox" data-dh-dimension-field="confirmed" data-item-id="${escapeDecisionHtml(item.id)}" ${item.confirmed ? 'checked' : ''}>
              <span>已确认</span>
            </label>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderReportStep() {
    if (!state.report || !Array.isArray(state.report.pointPlanItems) || !Array.isArray(state.report.dimensionReferenceItems)) {
      state.report = buildReport();
      saveState(false);
    }
    const report = state.report;
    const recommendation = report.recommendation;
    const descriptions = DECISION_HELPER_DATA.methodDescriptions[recommendation.top.key];
    const nextActions = DECISION_HELPER_DATA.nextActions[recommendation.top.key] || [];

    return `
      <article class="card decision-report" id="decision-report">
        <header class="decision-report-header">
          <div>
            <div class="decision-eyebrow">装修前需求确认报告</div>
            <h2>根据你的填写，我们更建议优先考虑：${recommendation.top.name}</h2>
            <p>${escapeDecisionHtml(recommendation.summary)}</p>
          </div>
          <div class="decision-report-badges">
            <span>复杂度：${recommendation.complexityLevel}</span>
            <span>参与压力：${recommendation.pressureLevel}</span>
            <span>设计需求：${recommendation.designNeedLevel}</span>
          </div>
        </header>

        <section class="decision-report-section">
          <h3>基础信息摘要</h3>
          <div class="decision-summary-grid">
            ${renderSummaryItem('房屋类型', report.answers.houseType)}
            ${renderSummaryItem('面积', report.answers.area ? `${report.answers.area}㎡` : '')}
            ${renderSummaryItem('常住人数', report.answers.familySize)}
            ${renderSummaryItem('预算倾向', report.answers.budgetLevel)}
            ${renderSummaryItem('时间精力', report.answers.weeklyTime)}
            ${renderSummaryItem('设计需求', report.answers.designExpectation)}
          </div>
        </section>

        <section class="decision-report-section">
          <h3>装修方式推荐</h3>
          <div class="decision-method-cards">
            <div class="decision-method-card primary"><span>最推荐</span><strong>${recommendation.top.name}</strong><small>${recommendation.top.score} 分</small></div>
            <div class="decision-method-card"><span>备选方案</span><strong>${recommendation.alternative.name}</strong><small>${recommendation.alternative.score} 分</small></div>
            <div class="decision-method-card muted"><span>不太建议</span><strong>${recommendation.notRecommended.map(item => item.name).join(' / ')}</strong></div>
          </div>
          <p class="decision-method-desc"><strong>适合人群：</strong>${escapeDecisionHtml(descriptions.fit)}</p>
          <p class="decision-method-desc"><strong>优势：</strong>${escapeDecisionHtml(descriptions.pros)}</p>
        </section>

        <section class="decision-report-section">
          <h3>推荐理由</h3>
          ${renderList(recommendation.reasons)}
        </section>

        <section class="decision-report-section">
          <h3>各装修方式得分</h3>
          <div class="decision-score-list">
            ${recommendation.ranked.map(item => renderScoreBar(item, recommendation.ranked)).join('')}
          </div>
        </section>

        <section class="decision-report-section">
          <h3>主要风险提醒</h3>
          ${renderList(recommendation.risks)}
        </section>

        <section class="decision-report-section">
          <h3>全屋需求摘要</h3>
          ${renderNeedsSummary(report.needs)}
        </section>

        <section class="decision-report-section">
          <h3>全屋点位规划表</h3>
          ${renderPointPlanReportTable(report.pointPlanItems)}
        </section>

        <section class="decision-report-section">
          <h3>硬装尺寸/预留尺寸参考表</h3>
          ${renderDimensionReportTable(report.dimensionReferenceItems)}
        </section>

        ${renderStageReportSection('水电前必须确认事项', report, ['水电前'])}
        ${renderStageReportSection('橱柜/定制柜前必须确认事项', report, ['橱柜设计前', '定制柜复尺前'])}
        ${renderStageReportSection('设计前必须确认事项', report, ['设计前'])}

        <section class="decision-report-section">
          <h3>重点预留提醒</h3>
          ${report.reminders.length ? renderList(report.reminders) : '<p class="decision-muted">暂时没有触发特别提醒，后续确定设备型号时可以再补充。</p>'}
        </section>

        <section class="decision-report-section">
          <h3>下一步行动清单</h3>
          ${renderList(nextActions)}
        </section>

        <p class="decision-disclaimer">${DECISION_HELPER_DATA.disclaimer}</p>
        <p class="decision-planning-disclaimer">${escapeDecisionHtml(getPlanningDisclaimer())}</p>
        <p class="decision-share-tip">建议把这份报告发给家人、设计师、工长或装修公司，装修前先统一需求。</p>
      </article>
    `;
  }

  function renderSummaryItem(label, value) {
    return `<div class="decision-summary-item"><span>${label}</span><strong>${escapeDecisionHtml(value || '未填写')}</strong></div>`;
  }

  function renderScoreBar(item, ranked) {
    const max = Math.max(1, ...ranked.map(candidate => Math.max(0, candidate.score)));
    const width = Math.max(4, Math.round(Math.max(0, item.score) / max * 100));
    return `
      <div class="decision-score-row">
        <span>${item.name}</span>
        <div class="decision-score-track"><div class="decision-score-fill" style="width:${width}%"></div></div>
        <strong>${item.score} 分</strong>
      </div>
    `;
  }

  function renderNeedsSummary(needs) {
    const rows = DECISION_HELPER_DATA.needSections
      .map(section => ({ section, need: needs[section.id] || { selected: [], note: '' } }))
      .filter(item => item.need.selected.length || item.need.note);
    if (!rows.length) return '<p class="decision-muted">还没有填写全屋需求。</p>';
    return `
      <div class="decision-needs-summary">
        ${rows.map(({ section, need }) => `
          <div>
            <strong>${escapeDecisionHtml(section.title)}</strong>
            <p>${need.selected.length ? need.selected.map(escapeDecisionHtml).join('、') : '未勾选具体项'}</p>
            ${need.note ? `<small>备注：${escapeDecisionHtml(need.note)}</small>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderPointPlanReportTable(items = []) {
    if (!items.length) return '<p class="decision-muted">暂无点位规划。</p>';
    return renderGroupedReportTables(items, item => `
      <tr>
        <td>${escapeDecisionHtml(item.room)}</td>
        <td>${escapeDecisionHtml(getPointTypeLabel(item.type))}</td>
        <td>${escapeDecisionHtml(item.title)}</td>
        <td>${escapeDecisionHtml(item.quantity || '-')}</td>
        <td>${escapeDecisionHtml(item.stage)}</td>
        <td>${escapeDecisionHtml(item.userNote || '-')}</td>
        <td>${item.confirmed ? '已确认' : '未确认'}</td>
      </tr>
    `, ['空间', '类型', '标题', '数量', '确认阶段', '用户备注', '是否确认']);
  }

  function renderDimensionReportTable(items = []) {
    if (!items.length) return '<p class="decision-muted">暂无尺寸参考。</p>';
    return renderGroupedReportTables(items, item => `
      <tr>
        <td>${escapeDecisionHtml(item.room)}</td>
        <td>${escapeDecisionHtml(item.title)}</td>
        <td>${escapeDecisionHtml(item.reference || '-')}</td>
        <td>${escapeDecisionHtml(item.warning || '-')}</td>
        <td>${escapeDecisionHtml(item.stage)}</td>
        <td>${escapeDecisionHtml(item.userNote || '-')}</td>
        <td>${item.confirmed ? '已确认' : '未确认'}</td>
      </tr>
    `, ['空间', '标题', '参考内容', '注意事项', '确认阶段', '用户备注', '是否确认']);
  }

  function renderGroupedReportTables(items, renderRow, headers) {
    const groups = groupByRoom(items);
    return `
      <div class="decision-report-table-list">
        ${groups.map(([room, rows]) => `
          <div class="decision-report-table-group">
            <h4>${escapeDecisionHtml(room)}</h4>
            <div class="decision-table-scroll">
              <table class="decision-plan-table">
                <thead><tr>${headers.map(header => `<th>${escapeDecisionHtml(header)}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(renderRow).join('')}</tbody>
              </table>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderStageReportSection(title, report, stages) {
    const rows = [
      ...(report.pointPlanItems || []).map(item => ({ ...item, kind: getPointTypeLabel(item.type), text: `${item.room}｜${getPointTypeLabel(item.type)}｜${item.title}${item.quantity ? `（数量：${item.quantity}）` : ''}` })),
      ...(report.dimensionReferenceItems || []).map(item => ({ ...item, kind: '尺寸参考', text: `${item.room}｜尺寸参考｜${item.title}` })),
    ].filter(item => stages.includes(item.stage));

    return `
      <section class="decision-report-section">
        <h3>${escapeDecisionHtml(title)}</h3>
        ${rows.length ? `
          <div class="decision-stage-checklist">
            ${rows.map(item => `
              <div>
                <strong>${escapeDecisionHtml(item.text)}</strong>
                <span>来源：${escapeDecisionHtml(item.sourceNeed || '手动新增')} · ${item.confirmed ? '已确认' : '未确认'}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p class="decision-muted">暂无对应阶段事项。</p>'}
      </section>
    `;
  }

  function renderList(items) {
    return `<ul class="decision-list">${items.map(item => `<li>${escapeDecisionHtml(item)}</li>`).join('')}</ul>`;
  }

  function renderActions() {
    const prevDisabled = state.step <= 1;
    return `
      <div class="decision-helper-actions">
        <button class="btn btn-secondary" type="button" data-dh-action="prev-step" ${prevDisabled ? 'disabled' : ''}>上一步</button>
        <button class="btn btn-secondary" type="button" data-dh-action="save">保存草稿</button>
        ${state.step < 3 ? '<button class="btn btn-primary" type="button" data-dh-action="next-step">下一步</button>' : ''}
        ${state.step === 3 ? '<button class="btn btn-primary" type="button" data-dh-action="generate-report">生成报告</button>' : ''}
        ${state.step === 4 ? '<button class="btn btn-secondary" type="button" data-dh-action="copy-report">复制报告</button><button class="btn btn-secondary" type="button" data-dh-action="print-report">打印/导出 PDF</button><button class="btn btn-danger" type="button" data-dh-action="restart">重新填写</button>' : ''}
      </div>
    `;
  }

  function handleAction(action, element) {
    switch (action) {
      case 'continue-draft':
        draftPromptDismissed = true;
        renderDecisionHelper();
        break;
      case 'go-step':
        state.step = Math.min(4, Math.max(1, Number(element.dataset.step) || state.step));
        if (state.step === 3 && !hasPlanningItems()) regeneratePlanning();
        if (state.step === 4) state.report = buildReport();
        saveState(false);
        renderDecisionHelper();
        break;
      case 'prev-step':
        state.step = Math.max(1, state.step - 1);
        saveState(false);
        renderDecisionHelper();
        break;
      case 'next-step':
        if (state.step === 2 && !hasPlanningItems()) regeneratePlanning();
        state.step = Math.min(4, state.step + 1);
        saveState(false);
        renderDecisionHelper();
        break;
      case 'prev-group':
        state.diagnosisGroup = Math.max(0, state.diagnosisGroup - 1);
        saveState(false);
        renderDecisionHelper();
        break;
      case 'next-group':
        state.diagnosisGroup = Math.min(DECISION_HELPER_DATA.diagnosisGroups.length - 1, state.diagnosisGroup + 1);
        saveState(false);
        renderDecisionHelper();
        break;
      case 'set-planning-tab':
        state.planningTab = element.dataset.tab === 'dimensions' ? 'dimensions' : 'points';
        saveState(false);
        renderDecisionHelper();
        break;
      case 'regenerate-planning':
        regeneratePlanning();
        saveState(true);
        renderDecisionHelper();
        break;
      case 'dismiss-planning-dirty':
        state.planningDirty = false;
        saveState(false);
        renderDecisionHelper();
        break;
      case 'add-custom-point':
        state.pointPlanItems.push(createCustomPointItem());
        state.report = null;
        state.planningTab = 'points';
        saveState(true);
        renderDecisionHelper();
        break;
      case 'add-custom-dimension':
        state.dimensionReferenceItems.push(createCustomDimensionItem());
        state.report = null;
        state.planningTab = 'dimensions';
        saveState(true);
        renderDecisionHelper();
        break;
      case 'delete-point':
        state.pointPlanItems = state.pointPlanItems.filter(item => item.id !== element.dataset.itemId);
        state.report = null;
        saveState(false);
        renderDecisionHelper();
        break;
      case 'delete-dimension':
        state.dimensionReferenceItems = state.dimensionReferenceItems.filter(item => item.id !== element.dataset.itemId);
        state.report = null;
        saveState(false);
        renderDecisionHelper();
        break;
      case 'save':
        saveState(true);
        break;
      case 'generate-report':
        if (state.planningDirty) {
          toast('请先确认是否重新生成预留规划', 'error');
          return;
        }
        state.report = buildReport();
        state.step = 4;
        saveState(false);
        toast('报告已生成');
        renderDecisionHelper();
        break;
      case 'copy-report':
        copyReport();
        break;
      case 'print-report':
        window.print();
        break;
      case 'restart':
        restartDecisionHelper();
        break;
    }
  }

  function updateAnswerFromInput(input) {
    const fieldId = input.dataset.dhField;
    if (!fieldId) return;

    if (input.type === 'checkbox') {
      const field = findDiagnosisField(fieldId);
      let selected = Array.isArray(state.answers[fieldId]) ? [...state.answers[fieldId]] : [];
      if (input.checked) {
        if (fieldId === 'complexSystems' && input.value === '无') selected = [];
        if (fieldId === 'complexSystems' && input.value !== '无') selected = selected.filter(item => item !== '无');
        if (!selected.includes(input.value)) selected.push(input.value);
        if (field?.max && selected.length > field.max) {
          selected = selected.filter(item => item !== input.value);
          input.checked = false;
          toast(`最多选择 ${field.max} 项`, 'error');
        }
      } else {
        selected = selected.filter(item => item !== input.value);
      }
      state.answers[fieldId] = selected;
    } else {
      state.answers[fieldId] = input.value;
    }
    state.report = null;
    saveState(false);
    renderDecisionHelper();
  }

  function updateNeedFromInput(input) {
    const sectionId = input.dataset.dhNeed;
    const need = ensureNeedSection(sectionId);
    if (input.checked) {
      if (!need.selected.includes(input.value)) need.selected.push(input.value);
    } else {
      need.selected = need.selected.filter(item => item !== input.value);
    }
    state.report = null;
    state.planningDirty = hasPlanningItems();
    saveState(false);
    renderDecisionHelper();
  }

  function updateNeedNoteFromInput(input) {
    const sectionId = input.dataset.dhNote;
    ensureNeedSection(sectionId).note = input.value;
    state.report = null;
    saveState(false);
  }

  function updatePointPlanFromInput(input) {
    const item = state.pointPlanItems.find(candidate => candidate.id === input.dataset.itemId);
    if (!item) return;
    const field = input.dataset.dhPlanField;
    item[field] = input.type === 'checkbox' ? Boolean(input.checked) : input.value;
    if (field !== 'confirmed') item.manual = item.manual || item.sourceNeed === '手动新增';
    state.report = null;
    saveState(false);
  }

  function updateDimensionFromInput(input) {
    const item = state.dimensionReferenceItems.find(candidate => candidate.id === input.dataset.itemId);
    if (!item) return;
    const field = input.dataset.dhDimensionField;
    item[field] = input.type === 'checkbox' ? Boolean(input.checked) : input.value;
    if (field !== 'confirmed') item.manual = item.manual || item.sourceNeed === '手动新增';
    state.report = null;
    saveState(false);
  }

  function ensureNeedSection(sectionId) {
    if (!state.needs[sectionId]) state.needs[sectionId] = { selected: [], note: '' };
    if (!Array.isArray(state.needs[sectionId].selected)) state.needs[sectionId].selected = [];
    return state.needs[sectionId];
  }

  function findDiagnosisField(fieldId) {
    for (const group of DECISION_HELPER_DATA.diagnosisGroups) {
      const found = group.fields.find(field => field.id === fieldId);
      if (found) return found;
    }
    return null;
  }

  function regeneratePlanning() {
    const generated = typeof generateLinkedPlanning === 'function'
      ? generateLinkedPlanning(state.needs)
      : { pointPlanItems: [], dimensionReferenceItems: [] };
    const merged = typeof mergeLinkedPlanning === 'function'
      ? mergeLinkedPlanning(state.pointPlanItems, state.dimensionReferenceItems, generated)
      : generated;
    state.pointPlanItems = (merged.pointPlanItems || []).map(normalizePointForState);
    state.dimensionReferenceItems = (merged.dimensionReferenceItems || []).map(normalizeDimensionForState);
    state.planningDirty = false;
    state.report = null;
  }

  function buildReport() {
    if (!hasPlanningItems() && hasSelectedNeeds()) regeneratePlanning();
    const recommendation = calculateDecisionRecommendation(state.answers);
    const reminders = generateNeedReminders(state.needs);
    const pointPlanItems = state.pointPlanItems.map(item => ({ ...item }));
    const dimensionReferenceItems = state.dimensionReferenceItems.map(item => ({ ...item }));
    const stageReminders = typeof buildStagePlanningReminders === 'function'
      ? buildStagePlanningReminders(pointPlanItems, dimensionReferenceItems)
      : [];
    return {
      title: '装修前需求确认报告',
      generatedAt: new Date().toISOString(),
      answers: { ...state.answers },
      needs: JSON.parse(JSON.stringify(state.needs || {})),
      pointPlanItems,
      dimensionReferenceItems,
      stageReminders,
      recommendation,
      reminders,
    };
  }

  async function copyReport() {
    const text = formatReportText(state.report || buildReport());
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      toast('报告已复制');
    } catch (error) {
      toast('复制失败，可以手动选中报告内容复制', 'error');
    }
  }

  function formatReportText(report) {
    const recommendation = report.recommendation;
    const needsText = DECISION_HELPER_DATA.needSections
      .map(section => ({ section, need: report.needs[section.id] || { selected: [], note: '' } }))
      .filter(item => item.need.selected.length || item.need.note)
      .map(({ section, need }) => `- ${section.title}：${need.selected.join('、') || '未勾选'}${need.note ? `（备注：${need.note}）` : ''}`)
      .join('\n') || '- 暂未填写';

    return [
      '装修前需求确认报告',
      '',
      `最推荐方案：${recommendation.top.name}（${recommendation.top.score} 分）`,
      `备选方案：${recommendation.alternative.name}（${recommendation.alternative.score} 分）`,
      `不太建议：${recommendation.notRecommended.map(item => item.name).join(' / ')}`,
      '',
      '推荐理由：',
      ...recommendation.reasons.map(item => `- ${item}`),
      '',
      '各方案得分：',
      ...recommendation.ranked.map(item => `- ${item.name}：${item.score} 分`),
      '',
      '主要风险提醒：',
      ...recommendation.risks.map(item => `- ${item}`),
      '',
      '全屋需求摘要：',
      needsText,
      '',
      '全屋点位规划表：',
      ...formatPointPlanText(report.pointPlanItems || []),
      '',
      '硬装尺寸/预留尺寸参考表：',
      ...formatDimensionText(report.dimensionReferenceItems || []),
      '',
      '水电前必须确认事项：',
      ...formatStageText(report, ['水电前']),
      '',
      '橱柜/定制柜前必须确认事项：',
      ...formatStageText(report, ['橱柜设计前', '定制柜复尺前']),
      '',
      '设计前必须确认事项：',
      ...formatStageText(report, ['设计前']),
      '',
      '重点预留提醒：',
      ...(report.reminders?.length ? report.reminders.map(item => `- ${item}`) : ['- 暂无特别提醒']),
      '',
      '下一步行动清单：',
      ...(DECISION_HELPER_DATA.nextActions[recommendation.top.key] || []).map(item => `- ${item}`),
      '',
      DECISION_HELPER_DATA.disclaimer,
      getPlanningDisclaimer(),
    ].join('\n');
  }

  function formatPointPlanText(items) {
    if (!items.length) return ['- 暂无点位规划'];
    return items.map(item => `- ${item.room}｜${getPointTypeLabel(item.type)}｜${item.title}｜数量：${item.quantity || '-'}｜阶段：${item.stage}｜备注：${item.userNote || '-'}｜${item.confirmed ? '已确认' : '未确认'}`);
  }

  function formatDimensionText(items) {
    if (!items.length) return ['- 暂无尺寸参考'];
    return items.map(item => `- ${item.room}｜${item.title}｜${item.reference || '-'}｜注意：${item.warning || '-'}｜阶段：${item.stage}｜备注：${item.userNote || '-'}｜${item.confirmed ? '已确认' : '未确认'}`);
  }

  function formatStageText(report, stages) {
    const rows = [
      ...(report.pointPlanItems || []).map(item => ({ ...item, text: `${item.room}｜${getPointTypeLabel(item.type)}｜${item.title}` })),
      ...(report.dimensionReferenceItems || []).map(item => ({ ...item, text: `${item.room}｜尺寸参考｜${item.title}` })),
    ].filter(item => stages.includes(item.stage));
    return rows.length ? rows.map(item => `- ${item.text}（${item.confirmed ? '已确认' : '未确认'}）`) : ['- 暂无'];
  }

  function restartDecisionHelper() {
    const run = () => {
      StorageUtil.remove(getStorageKey());
      state = createEmptyState();
      draftPromptDismissed = true;
      renderDecisionHelper();
      toast('已重新开始');
    };
    if (confirm('确定要重新填写吗？只会清除决策助手草稿，不影响其他装修数据。')) run();
  }

  function renderTextInput(label, field, id, value, scope) {
    const attr = scope === 'dimension' ? 'data-dh-dimension-field' : 'data-dh-plan-field';
    return `
      <label>
        <span class="form-label">${escapeDecisionHtml(label)}</span>
        <input class="form-input" ${attr}="${escapeDecisionHtml(field)}" data-item-id="${escapeDecisionHtml(id)}" value="${escapeDecisionHtml(value || '')}">
      </label>
    `;
  }

  function renderSelectInput(label, field, id, value, options, scope) {
    const attr = scope === 'dimension' ? 'data-dh-dimension-field' : 'data-dh-plan-field';
    return `
      <label>
        <span class="form-label">${escapeDecisionHtml(label)}</span>
        <select class="form-select" ${attr}="${escapeDecisionHtml(field)}" data-item-id="${escapeDecisionHtml(id)}">
          ${options.map(option => `<option value="${escapeDecisionHtml(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeDecisionHtml(option.label)}</option>`).join('')}
        </select>
      </label>
    `;
  }

  function createCustomPointItem() {
    const id = createCustomId('custom-point');
    return {
      id,
      room: '未指定',
      sourceNeed: '手动新增',
      type: 'socket',
      title: '自定义点位',
      suggestion: '',
      quantity: '1',
      stage: '水电前',
      importance: 'medium',
      userNote: '',
      confirmed: false,
      manual: true,
    };
  }

  function createCustomDimensionItem() {
    const id = createCustomId('custom-dimension');
    return {
      id,
      room: '未指定',
      sourceNeed: '手动新增',
      title: '自定义尺寸参考',
      reference: '',
      warning: '',
      stage: '设计前',
      userNote: '',
      confirmed: false,
      manual: true,
    };
  }

  function normalizePointForState(item = {}) {
    const types = getPointTypes();
    const stages = getPlanningStages();
    return {
      id: item.id || createCustomId('point'),
      room: item.room || '未指定',
      sourceNeed: item.sourceNeed || '手动新增',
      type: types.includes(item.type) ? item.type : 'other',
      title: item.title || '未命名点位',
      suggestion: item.suggestion || '',
      quantity: item.quantity == null ? '' : String(item.quantity),
      stage: stages.includes(item.stage) ? item.stage : '水电前',
      importance: ['high', 'medium', 'low'].includes(item.importance) ? item.importance : 'medium',
      userNote: item.userNote || '',
      confirmed: Boolean(item.confirmed),
      autoKey: item.autoKey || '',
      manual: Boolean(item.manual),
    };
  }

  function normalizeDimensionForState(item = {}) {
    const stages = getPlanningStages();
    return {
      id: item.id || createCustomId('dimension'),
      room: item.room || '未指定',
      sourceNeed: item.sourceNeed || '手动新增',
      title: item.title || '未命名尺寸参考',
      reference: item.reference || '',
      warning: item.warning || '',
      stage: stages.includes(item.stage) ? item.stage : '设计前',
      userNote: item.userNote || '',
      confirmed: Boolean(item.confirmed),
      autoKey: item.autoKey || '',
      manual: Boolean(item.manual),
    };
  }

  function createCustomId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function hasPlanningItems() {
    return state.pointPlanItems.length > 0 || state.dimensionReferenceItems.length > 0;
  }

  function hasSelectedNeeds() {
    return Object.values(state.needs || {}).some(need => (need?.selected || []).length > 0);
  }

  function countConfirmedPlanningItems() {
    return [...state.pointPlanItems, ...state.dimensionReferenceItems].filter(item => item.confirmed).length;
  }

  function groupByRoom(items) {
    const map = new Map();
    items.forEach(item => {
      const room = item.room || '未指定';
      if (!map.has(room)) map.set(room, []);
      map.get(room).push(item);
    });
    return [...map.entries()];
  }

  function getPointTypes() {
    return typeof DECISION_POINT_TYPES !== 'undefined'
      ? DECISION_POINT_TYPES
      : ['socket', 'switch', 'waterIn', 'waterOut', 'network', 'lighting', 'appliance', 'cabinet', 'other'];
  }

  function getPlanningStages() {
    return typeof DECISION_PLANNING_STAGES !== 'undefined'
      ? DECISION_PLANNING_STAGES
      : ['设计前', '水电前', '瓦工前', '木工前', '橱柜设计前', '定制柜复尺前', '安装前'];
  }

  function getImportanceLabels() {
    return typeof DECISION_IMPORTANCE_LABELS !== 'undefined'
      ? DECISION_IMPORTANCE_LABELS
      : { high: '高', medium: '中', low: '低' };
  }

  function getPointTypeLabel(type) {
    const labels = typeof DECISION_POINT_TYPE_LABELS !== 'undefined' ? DECISION_POINT_TYPE_LABELS : {};
    return labels[type] || '其他';
  }

  function getImportanceLabel(value) {
    return getImportanceLabels()[value] || '中';
  }

  function getPlanningDisclaimer() {
    return typeof DECISION_LINKED_PLANNING_DISCLAIMER !== 'undefined'
      ? DECISION_LINKED_PLANNING_DISCLAIMER
      : '以下点位和尺寸为前期规划参考，不代表唯一标准。实际位置和尺寸需要结合户型、家电型号、柜体设计和现场施工确认。';
  }

  function toast(message, type = 'success') {
    if (typeof window.showToast === 'function') window.showToast(message, type);
  }

  function formatDecisionDate(dateText) {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return '刚刚';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function escapeDecisionHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }
})();
