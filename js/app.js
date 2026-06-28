// 装修小白自装助手 — 主应用逻辑
// ============================================

(function () {
  'use strict';

  // ========== State ==========
  let currentPage = 'dashboard';
  let editModeActive = false;
  let currentWorkerType = null;
  let currentEditingWorkerId = null;
  let budgetPieChart = null;
  let budgetBarChart = null;
  let dashboardBudgetChart = null;
  let mobileBudgetFilter = 'all';
  let mobileEditingBudgetId = null;
  let mobileSelectedStageId = null;
  let mobileWorkerSearch = '';
  let mobileWorkerStageFilter = 'all';
  let mobileConfirmAction = null;

  // ========== Init ==========
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initMobileNavigation();
    initBudgetPage();
    initWorkerPage();
    initExportImport();
    initDataSafety();
    renderCurrentPage();
  });

  // Author watermark toggle
  window.toggleAuthorCard = function () {
    const card = document.getElementById('author-card');
    if (card) card.classList.toggle('visible');
  };

  // ========== Navigation ==========
  function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        navigateTo(page);
      });
    });
  }

  function navigateTo(page) {
    currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('[data-mobile-page]').forEach(item => {
      const isActive = item.dataset.mobilePage === page;
      item.classList.toggle('active', isActive);
      if (isActive) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    // Update page sections
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.toggle('active', section.id === `page-${page}`);
    });

    // Update header
    const headers = {
      dashboard: { title: '📊 仪表盘', subtitle: '装修进度一览' },
      workflow:  { title: '📋 装修流程', subtitle: '9大阶段全流程管理' },
      calendar:  { title: '📅 排期日历', subtitle: '安排工种进场、避开禁装日、记录每日施工与验收节点' },
      'decision-helper': { title: '🧭 装修前决策助手', subtitle: '先确认需求，再判断适合哪种装修方式' },
      budget:    { title: '💰 预算管理', subtitle: '规划预算，记录支出' },
      workers:   { title: '👷 工人管理', subtitle: '比价对比，沟通记录' },
    };
    const h = headers[page] || headers.dashboard;
    document.getElementById('page-title').textContent = h.title;
    document.getElementById('page-subtitle').textContent = h.subtitle;

    const pageActions = document.getElementById('page-actions');
    if (page === 'workflow' || page === 'workers') {
      pageActions.innerHTML = `
        <div class="edit-mode-toggle">
          <label for="edit-mode-switch">编辑模式</label>
          <label class="switch">
            <input type="checkbox" id="edit-mode-switch" ${editModeActive ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      `;
      document.getElementById('edit-mode-switch').addEventListener('change', (e) => {
        editModeActive = e.target.checked;
        document.body.classList.toggle('edit-mode-active', editModeActive);
        if (currentPage === 'workflow') renderWorkflow();
        if (currentPage === 'workers') renderWorkersPage();
      });
      document.body.classList.toggle('edit-mode-active', editModeActive);
    } else {
      pageActions.innerHTML = '';
      document.body.classList.remove('edit-mode-active');
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('active');
    closeMobileSheet('mobile-more-sheet');

    renderCurrentPage();
  }

  window.navigateToPage = navigateTo;

  function renderCurrentPage() {
    switch (currentPage) {
      case 'dashboard': renderDashboard(); break;
      case 'workflow':  renderWorkflow();  break;
      case 'decision-helper': if (typeof window.renderDecisionHelperPage === 'function') window.renderDecisionHelperPage(); break;
      case 'budget':    renderBudgetPage(); break;
      case 'workers':   renderWorkersPage(); break;
      case 'calendar':  if (typeof window.renderCalendarPage === 'function') window.renderCalendarPage(); break;
    }
    updateWorkflowBadge();
  }

  // ========== Mobile Menu ==========
  function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    const sidebar = document.getElementById('sidebar');

    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // ========== Workflow Badge ==========
  function updateWorkflowBadge() {
    const statuses = StorageUtil.get(STORAGE_KEYS.STAGE_STATUS, {});
    const completed = getStages().filter(s => statuses[s.id] === 'completed').length;
    const badge = document.getElementById('workflow-badge');
    if (badge) badge.textContent = `${completed}/9`;
  }

  // ========== Toast ==========
  window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `${icons[type] || ''} ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ========== Modal ==========
  window.openModal = function (id) {
    document.getElementById(id).classList.add('active');
    document.body.classList.add('modal-open');
  };

  window.closeModal = function (id) {
    document.getElementById(id).classList.remove('active');
    syncModalOpenState();
  };

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ========== Star Rating ==========
  document.querySelectorAll('.star-rating').forEach(container => {
    container.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        container.dataset.rating = value;
        container.querySelectorAll('.star').forEach(s => {
          s.classList.toggle('active', parseInt(s.dataset.value) <= value);
        });
      });
    });
  });

  // ======================================================
  //                    DASHBOARD PAGE
  // ======================================================
  function renderDashboard() {
    renderDashboardStats();
    renderDashboardProgress();
    renderDashboardBudgetChart();
    renderDashboardRecentExpenses();
  }

  function renderDashboardStats() {
    const statuses = StorageUtil.get(STORAGE_KEYS.STAGE_STATUS, {});
    const completed = getStages().filter(s => statuses[s.id] === 'completed').length;
    const inProgress = getStages().filter(s => statuses[s.id] === 'in-progress').length;

    const houseInfo = StorageUtil.get(STORAGE_KEYS.HOUSE_INFO, {});
    const totalBudget = houseInfo.totalBudget || 0;
    // Use BUDGET_V2 for actual spending
    const budgetItems = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const totalSpent = budgetItems.reduce((sum, i) => sum + (parseFloat(i.actual) || 0), 0);
    const totalPlanned = budgetItems.reduce((sum, i) => sum + (parseFloat(i.budget) || 0), 0);

    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);

    const taskStatuses = StorageUtil.get(STORAGE_KEYS.TASK_STATUS, {});
    const allTasks = getStages().reduce((all, s) => [...all, ...s.tasks], []);
    const completedTasks = allTasks.filter(t => taskStatuses[t.id]).length;

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-card-top">
          <div class="stat-card-label">装修进度</div>
          <div class="stat-card-icon">📋</div>
        </div>
        <div class="stat-card-value">${completed}/9</div>
        <div class="stat-card-sub">${inProgress > 0 ? inProgress + ' 个阶段进行中' : completed === 9 ? '🎉 全部完成！' : '继续加油'}</div>
      </div>

      <div class="stat-card teal">
        <div class="stat-card-top">
          <div class="stat-card-label">任务完成</div>
          <div class="stat-card-icon">✅</div>
        </div>
        <div class="stat-card-value">${completedTasks}/${allTasks.length}</div>
        <div class="stat-card-sub">${allTasks.length > 0 ? Math.round(completedTasks / allTasks.length * 100) : 0}% 已完成</div>
      </div>

      <div class="stat-card amber">
        <div class="stat-card-top">
          <div class="stat-card-label">实际已花费</div>
          <div class="stat-card-icon">💰</div>
        </div>
        <div class="stat-card-value">${formatMoney(totalSpent)}</div>
        <div class="stat-card-sub">${totalPlanned > 0 ? '已规划 ' + formatMoney(totalPlanned) + '，剩余 ' + formatMoney(totalPlanned - totalSpent) : totalBudget > 0 ? '总预算 ' + formatMoney(totalBudget) : '去预算管理填入数据'}</div>
      </div>

      <div class="stat-card rose">
        <div class="stat-card-top">
          <div class="stat-card-label">已联系工人</div>
          <div class="stat-card-icon">👷</div>
        </div>
        <div class="stat-card-value">${workers.length}</div>
        <div class="stat-card-sub">${workers.filter(w => w.selected).length} 人已选定</div>
      </div>
    `;
  }

  function renderDashboardProgress() {
    const statuses = StorageUtil.get(STORAGE_KEYS.STAGE_STATUS, {});
    const container = document.getElementById('dashboard-progress');

    let html = '';
    getStages().forEach(stage => {
      const status = statuses[stage.id] || 'not-started';
      const statusLabels = { 'not-started': '未开始', 'in-progress': '进行中', 'completed': '已完成' };
      const statusColors = {
        'not-started': 'var(--text-muted)',
        'in-progress': 'var(--accent-blue)',
        'completed': 'var(--accent-green)'
      };
      const percent = status === 'completed' ? 100 : status === 'in-progress' ? 50 : 0;

      html += `
        <div class="progress-bar-container">
          <div class="progress-bar-header">
            <span class="progress-bar-label">${stage.icon} ${stage.name}</span>
            <span class="progress-bar-value" style="color: ${statusColors[status]}">${statusLabels[status]}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%; background: ${status === 'completed' ? 'var(--gradient-green)' : 'var(--gradient-blue)'}"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderDashboardBudgetChart() {
    const container = document.getElementById('dashboard-budget-chart-container');
    if (!container) return;

    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);

    // Group BUDGET_V2 actual spend by category
    const BV2_CAT_NAMES = {
      demolition: '①拆改/设计',
      plumbing:   '②水电改造',
      waterproof: '②防水工程',
      tiling:     '②瓦工',
      carpentry:  '②木工',
      painting:   '②油工',
      doors:      '③门窗设备',
      custom:     '④定制柜',
      sanitary:   '⑤厨卫五金',
      lighting:   '⑥灯具家电',
      soft:       '⑦软装家具',
    };
    const catColors = [
      '#f97316','#3b82f6','#06b6d4','#8b5cf6','#a855f7','#6366f1','#0ea5e9','#14b8a6','#f59e0b','#ec4899','#22c55e'
    ];
    const catKeys = Object.keys(BV2_CAT_NAMES);
    const catBudgets = {};
    catKeys.forEach(k => { catBudgets[k] = 0; });
    items.forEach(item => {
      const v = parseFloat(item.actual) || parseFloat(item.budget) || 0;
      if (catBudgets[item.category] !== undefined) catBudgets[item.category] += v;
    });

    const labels = catKeys.map(k => BV2_CAT_NAMES[k]);
    const data = catKeys.map(k => catBudgets[k]);
    const hasData = data.some(v => v > 0);

    if (dashboardBudgetChart) {
      dashboardBudgetChart.destroy();
      dashboardBudgetChart = null;
    }

    if (typeof Chart === 'undefined') {
      container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:var(--text-muted);gap:8px;">
        <div style="font-size:2rem">⚠️</div>
        <div style="font-size:var(--font-size-sm)">图表库未加载，请连接网络</div>
      </div>`;
      return;
    }

    if (!hasData) {
      // Show placeholder when no data
      container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:var(--text-muted);gap:8px;">
        <div style="font-size:2rem">📊</div>
        <div style="font-size:var(--font-size-sm)">在预算管理页填入数据后显示</div>
      </div>`;
      return;
    }

    // Recreate canvas to prevent sizing and rendering issues
    container.innerHTML = '<canvas id="dashboard-budget-chart"></canvas>';
    const ctx = document.getElementById('dashboard-budget-chart');

    dashboardBudgetChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: catColors,
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: 'rgba(255,255,255,0.3)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              padding: 12,
              font: { size: 11, family: 'Noto Sans SC' },
              usePointStyle: true,
              pointStyleWidth: 8,
              filter: (item) => data[item.index] > 0,
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#f0f2f5',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: function (ctx) {
                return ` ${ctx.label}: ${formatMoney(ctx.raw)}`;
              }
            }
          }
        }
      }
    });
  }

  function renderDashboardRecentExpenses() {
    const container = document.getElementById('dashboard-recent-expenses');
    // Show recent items from BUDGET_V2 that have actual spend recorded
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const BV2_CAT_NAMES = {
      demolition: '①拆改/设计',
      plumbing: '②水电改造', waterproof: '②防水', tiling: '②瓦工', carpentry: '②木工', painting: '②油工',
      doors: '③门窗设备', custom: '④定制柜', sanitary: '⑤厨卫五金', lighting: '⑥灯具家电', soft: '⑦软装家具',
    };
    const withActual = items.filter(i => parseFloat(i.actual) > 0);
    const recent = withActual.slice(-5).reverse();

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🧾</div>
          <div class="empty-state-text">还没有实际支出记录，去预算管理页面填入「实际支出」后显示</div>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(e => {
      const catName = BV2_CAT_NAMES[e.category] || e.category || '';
      return `
        <div class="expense-item">
          <div class="expense-item-info">
            <div class="expense-item-name">${escapeHtml(e.name || '')}</div>
            <div class="expense-item-meta">${catName}${e.room ? ' · ' + escapeHtml(e.room) : ''}</div>
          </div>
          <div class="expense-item-amount">${formatMoney(e.actual)}</div>
        </div>
      `;
    }).join('');
  }

  // ======================================================
  //                    WORKFLOW PAGE
  // ======================================================
  
  // ========== Edit Mode Helpers ==========
  function getStages() {
    let saved = StorageUtil.get(STORAGE_KEYS.CUSTOM_STAGES, null);
    if (!saved) {
      // Deep copy from data.js
      saved = JSON.parse(JSON.stringify(typeof RENOVATION_STAGES !== 'undefined' ? RENOVATION_STAGES : []));
      StorageUtil.set(STORAGE_KEYS.CUSTOM_STAGES, saved);
    }
    return saved;
  }
  
  function saveStages(stages) {
    StorageUtil.set(STORAGE_KEYS.CUSTOM_STAGES, stages);
    if (currentPage === 'workflow') renderWorkflow();
    if (currentPage === 'workers') renderWorkersPage();
    if (currentPage === 'budget') renderBudgetPage();
    if (typeof updateWorkflowBadge === 'function') updateWorkflowBadge();
  }

  function renderWorkflow() {
    const statuses = StorageUtil.get(STORAGE_KEYS.STAGE_STATUS, {});
    const taskStatuses = StorageUtil.get(STORAGE_KEYS.TASK_STATUS, {});
    const shoppingStatuses = StorageUtil.get(STORAGE_KEYS.SHOPPING_STATUS, {});
    const prepStatuses = StorageUtil.get(STORAGE_KEYS.PREP_STATUS, {});
    const container = document.getElementById('stages-timeline');
    const stages = getStages();
    if (isMobileViewport() && !stages.some(stage => stage.id === mobileSelectedStageId)) {
      mobileSelectedStageId = getDefaultMobileStageId(stages, statuses);
    }

    // Check which stage cards are currently expanded and which tabs are active
    const expandedStages = new Set();
    const activeTabs = {}; // { stageId: tabName }
    if (container) {
      container.querySelectorAll('.stage-card').forEach(card => {
        const stageId = card.dataset.stage;
        if (stageId) {
          if (card.classList.contains('expanded')) {
            expandedStages.add(stageId);
          }
          const activePanel = card.querySelector('.stage-tab-panel.active');
          if (activePanel) {
            const idParts = activePanel.id.split('-');
            const tabName = idParts[idParts.length - 1]; // 'tasks' or 'warnings' or 'shopping' or 'prep'
            activeTabs[stageId] = tabName;
          }
        }
      });
    }

    container.innerHTML = stages.map((stage, stageIndex) => {
      const status = statuses[stage.id] || 'not-started';
      const statusLabels = { 'not-started': '未开始', 'in-progress': '进行中', 'completed': '已完成' };
      const completedTasks = (stage.tasks||[]).filter(t => taskStatuses[t.id]).length;
      const isExpanded = expandedStages.has(stage.id) || (isMobileViewport() && stage.id === mobileSelectedStageId);
      const activeTab = activeTabs[stage.id] || 'tasks';

      const editStageBtn = editModeActive ? `<div class="edit-actions"><button class="btn-icon" onclick="event.stopPropagation(); openEditWorkflowModal('stage', '${stage.id}')">✏️修改时间/阶段</button><button class="btn-icon delete" onclick="event.stopPropagation(); deleteWorkflowStage('${stage.id}')">🗑️</button></div>` : '';

      const dragHandle = editModeActive ? `
        <span class="drag-handle stage-drag-handle" title="拖动排序" 
              onmousedown="this.closest('.stage-card').setAttribute('draggable', 'true')"
              onmouseup="this.closest('.stage-card').setAttribute('draggable', 'false')"
              onclick="event.stopPropagation();">⠿</span>
      ` : '';

      return `
        <div class="stage-card status-${status} ${isExpanded ? 'expanded' : ''} ${stage.id === mobileSelectedStageId ? 'mobile-selected' : ''}" id="stage-${stage.id}" data-stage="${stage.id}"
             ${editModeActive ? `data-coll="stages" ondragstart="onStageDragStart(event)" ondragover="onStageDragOver(event)" ondragend="onStageDragEnd(event)"` : ''}>
          <div class="stage-card-header" onclick="toggleStage('${stage.id}')">
            ${dragHandle}
            <div class="stage-number">${stage.order || (stageIndex + 1)}</div>
            <div class="stage-icon">${stage.icon}</div>
            <div class="stage-info">
              <div class="stage-name">${escapeHtml(stage.name)}</div>
              <div class="stage-meta">
                <span>⏱️ ${escapeHtml(stage.duration || '')}</span>
                <span>✅ ${completedTasks}/${(stage.tasks||[]).length} 任务</span>
              </div>
            </div>
            ${editStageBtn}
            <div class="stage-status-badge ${status === 'not-started' ? 'not-started' : status === 'in-progress' ? 'in-progress' : 'completed'}">
              ${statusLabels[status]}
            </div>
            <div class="stage-toggle">▼</div>
          </div>
          <div class="stage-card-body">
            <div class="stage-card-content">
              <!-- Status Selector -->
              <div style="margin-bottom: var(--space-lg);">
                <label class="form-label" style="margin-bottom: var(--space-sm); display: block;">阶段状态</label>
                <div class="stage-status-selector">
                  <button class="status-btn ${status === 'not-started' ? 'active-not-started' : ''}" 
                          onclick="setStageStatus('${stage.id}', 'not-started')">⬜ 未开始</button>
                  <button class="status-btn ${status === 'in-progress' ? 'active-in-progress' : ''}" 
                          onclick="setStageStatus('${stage.id}', 'in-progress')">🔵 进行中</button>
                  <button class="status-btn ${status === 'completed' ? 'active-completed' : ''}" 
                          onclick="setStageStatus('${stage.id}', 'completed')">✅ 已完成</button>
                </div>
              </div>

              <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-lg);">${escapeHtml(stage.description || '')}</p>

              <!-- Tabs -->
              <div class="stage-tabs">
                <button class="stage-tab ${activeTab === 'tasks' ? 'active' : ''}" onclick="switchStageTab('${stage.id}', 'tasks', this)">✅ 任务清单</button>
                <button class="stage-tab ${activeTab === 'warnings' ? 'active' : ''}" onclick="switchStageTab('${stage.id}', 'warnings', this)">⚠️ 注意事项</button>
                <button class="stage-tab ${activeTab === 'shopping' ? 'active' : ''}" onclick="switchStageTab('${stage.id}', 'shopping', this)">🛒 采购清单</button>
                <button class="stage-tab ${activeTab === 'prep' ? 'active' : ''}" onclick="switchStageTab('${stage.id}', 'prep', this)">📝 提前准备</button>
              </div>

              <!-- Tab Panels -->
              <div class="stage-tab-panel ${activeTab === 'tasks' ? 'active' : ''}" id="tab-${stage.id}-tasks">
                <div class="task-list drag-list" id="draglist-tasks-${stage.id}">
                  ${(stage.tasks||[]).map(task => `
                    <div class="task-item item-with-actions ${taskStatuses[task.id] ? 'completed' : ''}" id="task-${task.id}"
                         ${editModeActive ? `draggable="true" data-id="${task.id}" data-stage="${stage.id}" data-coll="tasks" ondragstart="onDragStart(event)" ondragover="onDragOver(event)" ondragend="onDragEnd(event)"` : ''}>
                      ${editModeActive ? `<span class="drag-handle" title="拖动排序">⠿</span>` : ''}
                      <div style="display: flex; gap: var(--space-sm); align-items: flex-start; flex: 1;">
                        <input type="checkbox" class="task-checkbox" 
                               ${taskStatuses[task.id] ? 'checked' : ''} 
                               onchange="toggleTask('${task.id}', this.checked)">
                        <div>
                          <div class="task-text">${escapeHtml(task.text)}</div>
                          ${task.detail ? `<div class="task-detail">${escapeHtml(task.detail)}</div>` : ''}
                        </div>
                      </div>
                      ${editModeActive ? `<div class="edit-actions"><button class="btn-icon" onclick="openEditWorkflowModal('task', '${stage.id}', '${task.id}')">✏️</button><button class="btn-icon delete" onclick="deleteWorkflowItem('tasks', '${stage.id}', '${task.id}')">🗑️</button></div>` : ''}
                    </div>
                  `).join('')}
                </div>
                ${editModeActive ? `<button class="add-item-btn" onclick="openEditWorkflowModal('task', '${stage.id}')">➕ 添加任务</button>` : ''}
              </div>

              <div class="stage-tab-panel ${activeTab === 'warnings' ? 'active' : ''}" id="tab-${stage.id}-warnings">
                <div class="warning-list drag-list" id="draglist-warnings-${stage.id}">
                  ${(stage.warnings||[]).map(w => `
                    <div class="warning-item item-with-actions"
                         ${editModeActive ? `draggable="true" data-id="${w.id}" data-stage="${stage.id}" data-coll="warnings" ondragstart="onDragStart(event)" ondragover="onDragOver(event)" ondragend="onDragEnd(event)"` : ''}>
                      ${editModeActive ? `<span class="drag-handle" title="拖动排序">⠿</span>` : ''}
                      <div style="flex: 1;">
                        <div class="warning-title">⚠️ ${escapeHtml(w.title)}</div>
                        <div class="warning-detail">${escapeHtml(w.detail)}</div>
                      </div>
                      ${editModeActive ? `<div class="edit-actions"><button class="btn-icon" onclick="openEditWorkflowModal('warning', '${stage.id}', '${w.id}')">✏️</button><button class="btn-icon delete" onclick="deleteWorkflowItem('warnings', '${stage.id}', '${w.id}')">🗑️</button></div>` : ''}
                    </div>
                  `).join('')}
                </div>
                ${editModeActive ? `<button class="add-item-btn" onclick="openEditWorkflowModal('warning', '${stage.id}')">➕ 添加避坑指南</button>` : ''}
              </div>

              <div class="stage-tab-panel ${activeTab === 'shopping' ? 'active' : ''}" id="tab-${stage.id}-shopping">
                <div class="shopping-grid">
                  ${(stage.shopping||[]).map(item => `
                    <div class="shopping-item item-with-actions ${shoppingStatuses[item.id] ? 'completed' : ''}" id="shopping-${item.id}">
                      <div style="display: flex; gap: var(--space-sm); align-items: flex-start; flex: 1;">
                        <input type="checkbox" class="task-checkbox" 
                               ${shoppingStatuses[item.id] ? 'checked' : ''} 
                               onchange="toggleShoppingItem('${item.id}', this.checked)">
                        <div style="flex: 1;">
                          <div class="shopping-item-header">
                            <div class="shopping-item-name">${escapeHtml(item.name)}</div>
                            <div class="shopping-item-category">${escapeHtml(item.category || '')}</div>
                          </div>
                          <div class="shopping-item-price">¥${item.priceMin} - ¥${item.priceMax} / ${item.unit}</div>
                          ${item.note ? `<div class="shopping-item-note">${escapeHtml(item.note)}</div>` : ''}
                        </div>
                      </div>
                      ${editModeActive ? `<div class="edit-actions" style="margin-top:-8px; margin-right:-8px;"><button class="btn-icon" onclick="openEditWorkflowModal('shopping', '${stage.id}', '${item.id}')">✏️</button><button class="btn-icon delete" onclick="deleteWorkflowItem('shopping', '${stage.id}', '${item.id}')">🗑️</button></div>` : ''}
                    </div>
                  `).join('')}
                </div>
                ${editModeActive ? `<button class="add-item-btn" onclick="openEditWorkflowModal('shopping', '${stage.id}')">➕ 添加采购物品</button>` : ''}
              </div>

              <div class="stage-tab-panel ${activeTab === 'prep' ? 'active' : ''}" id="tab-${stage.id}-prep">
                <div class="prep-list drag-list" id="draglist-prep-${stage.id}">
                  ${(stage.preparations||[]).map(p => `
                    <div class="prep-item item-with-actions ${prepStatuses[p.id] ? 'completed' : ''}" id="prep-${p.id}"
                         ${editModeActive ? `draggable="true" data-id="${p.id}" data-stage="${stage.id}" data-coll="preparations" ondragstart="onDragStart(event)" ondragover="onDragOver(event)" ondragend="onDragEnd(event)"` : ''}>
                      ${editModeActive ? `<span class="drag-handle" title="拖动排序">⠿</span>` : ''}
                      <div style="display:flex; align-items:flex-start; flex:1; gap: var(--space-sm);">
                        <input type="checkbox" class="task-checkbox" 
                               ${prepStatuses[p.id] ? 'checked' : ''} 
                               onchange="togglePrepItem('${p.id}', this.checked)">
                        <div style="display:flex; align-items:flex-start; flex:1;">
                          <span class="prep-icon">📌</span>
                          <span>${escapeHtml(p.text)}</span>
                        </div>
                      </div>
                      ${editModeActive ? `<div class="edit-actions"><button class="btn-icon" onclick="openEditWorkflowModal('prep', '${stage.id}', '${p.id}')">✏️</button><button class="btn-icon delete" onclick="deleteWorkflowItem('preparations', '${stage.id}', '${p.id}')">🗑️</button></div>` : ''}
                    </div>
                  `).join('')}
                </div>
                ${editModeActive ? `<button class="add-item-btn" onclick="openEditWorkflowModal('prep', '${stage.id}')">➕ 添加前期准备</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('') + (editModeActive ? `<button class="btn btn-primary btn-add-stage" onclick="openEditWorkflowModal('stage', null)">+ 添加新阶段</button>` : '');
    renderMobileStageQuickNav(stages, statuses);
  }

  function getDefaultMobileStageId(stages, statuses) {
    const inProgress = stages.find(stage => statuses[stage.id] === 'in-progress');
    if (inProgress) return inProgress.id;
    const unfinished = stages.find(stage => statuses[stage.id] !== 'completed');
    return unfinished?.id || stages[0]?.id || null;
  }

  function renderMobileStageQuickNav(stages, statuses) {
    const container = document.getElementById('mobile-stage-quick-nav');
    if (!container) return;
    const labels = { 'not-started': '未开始', 'in-progress': '进行中', completed: '已完成' };
    container.innerHTML = stages.map((stage, index) => {
      const status = statuses[stage.id] || 'not-started';
      return `<button class="mobile-stage-chip ${stage.id === mobileSelectedStageId ? 'active' : ''}" type="button" onclick="selectMobileStage('${stage.id}')" aria-label="第${index + 1}阶段 ${escapeHtml(stage.name)}，${labels[status]}">${stage.icon} ${index + 1}. ${escapeHtml(stage.name)}</button>`;
    }).join('');
  }

  window.selectMobileStage = function (stageId) {
    mobileSelectedStageId = stageId;
    renderWorkflow();
    const pageContent = document.querySelector('.page-content');
    if (pageContent) pageContent.scrollTop = 0;
  };

  // ========== Drag-and-Drop Sorting ==========
  let _dragSrcEl = null;
  let _dragSrcId = null;
  let _dragSrcStage = null;
  let _dragSrcColl = null;

  window.onDragStart = function (e) {
    _dragSrcEl    = e.currentTarget;
    _dragSrcId    = _dragSrcEl.dataset.id;
    _dragSrcStage = _dragSrcEl.dataset.stage;
    _dragSrcColl  = _dragSrcEl.dataset.coll;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', _dragSrcId);
    setTimeout(() => _dragSrcEl.classList.add('dragging'), 0);
  };

  window.onDragOver = function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget;
    // Only allow reorder within same stage and collection
    if (!target || target === _dragSrcEl) return;
    if (target.dataset.stage !== _dragSrcStage || target.dataset.coll !== _dragSrcColl) return;

    const list = target.parentNode;
    const children = [...list.children].filter(c => c.dataset && c.dataset.id);
    const srcIdx  = children.indexOf(_dragSrcEl);
    const tgtIdx  = children.indexOf(target);
    if (srcIdx === -1 || tgtIdx === -1) return;

    // Visual reorder in DOM (no save yet)
    if (srcIdx < tgtIdx) {
      list.insertBefore(_dragSrcEl, target.nextSibling);
    } else {
      list.insertBefore(_dragSrcEl, target);
    }
  };

  window.onDragEnd = function (e) {
    if (_dragSrcEl) _dragSrcEl.classList.remove('dragging');

    // Read final DOM order and persist to storage
    if (!_dragSrcStage || !_dragSrcColl) return;
    const list = document.querySelector(`[data-stage="${_dragSrcStage}"][data-coll="${_dragSrcColl}"]`);
    if (!list) return;
    const listContainer = list.parentNode;
    const domOrder = [...listContainer.querySelectorAll(`[data-stage="${_dragSrcStage}"][data-coll="${_dragSrcColl}"]`)].map(el => el.dataset.id);

    const stages = getStages();
    const stage  = stages.find(s => s.id === _dragSrcStage);
    if (stage && stage[_dragSrcColl]) {
      const oldArr = stage[_dragSrcColl];
      stage[_dragSrcColl] = domOrder.map(id => oldArr.find(i => i.id === id)).filter(Boolean);
      StorageUtil.set(STORAGE_KEYS.CUSTOM_STAGES, stages);
    }

    _dragSrcEl = _dragSrcId = _dragSrcStage = _dragSrcColl = null;
  };

  let _dragStageEl = null;
  let _dragStageId = null;

  window.onStageDragStart = function (e) {
    _dragStageEl = e.currentTarget;
    _dragStageId = _dragStageEl.dataset.stage;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', _dragStageId);
    setTimeout(() => _dragStageEl.classList.add('dragging'), 0);
  };

  window.onStageDragOver = function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget;
    if (!target || target === _dragStageEl) return;
    if (!target.classList.contains('stage-card')) return;

    const list = target.parentNode; // #stages-timeline
    const children = [...list.children].filter(c => c.classList.contains('stage-card'));
    const srcIdx  = children.indexOf(_dragStageEl);
    const tgtIdx  = children.indexOf(target);
    if (srcIdx === -1 || tgtIdx === -1) return;

    if (srcIdx < tgtIdx) {
      list.insertBefore(_dragStageEl, target.nextSibling);
    } else {
      list.insertBefore(_dragStageEl, target);
    }
  };

  window.onStageDragEnd = function (e) {
    if (_dragStageEl) {
      _dragStageEl.classList.remove('dragging');
      _dragStageEl.setAttribute('draggable', 'false');
    }

    const list = document.getElementById('stages-timeline');
    if (!list) return;
    const domOrder = [...list.querySelectorAll('.stage-card')].map(el => el.dataset.stage);

    const stages = getStages();
    const newStages = domOrder.map(id => stages.find(s => s.id === id)).filter(Boolean);
    newStages.forEach((s, idx) => {
      s.order = idx + 1;
    });

    saveStages(newStages);

    _dragStageEl = _dragStageId = null;
  };

  // Stage interaction functions (global)
  window.toggleStage = function (stageId) {
    const card = document.getElementById(`stage-${stageId}`);
    card.classList.toggle('expanded');
  };

  window.setStageStatus = function (stageId, status) {
    const statuses = StorageUtil.get(STORAGE_KEYS.STAGE_STATUS, {});
    statuses[stageId] = status;
    StorageUtil.set(STORAGE_KEYS.STAGE_STATUS, statuses);
    renderWorkflow();
    updateWorkflowBadge();
    showToast(`阶段状态已更新为「${status === 'not-started' ? '未开始' : status === 'in-progress' ? '进行中' : '已完成'}」`);
  };

  window.switchStageTab = function (stageId, tab, btn) {
    // Update tab buttons
    btn.closest('.stage-tabs').querySelectorAll('.stage-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Update tab panels
    const panels = ['tasks', 'warnings', 'shopping', 'prep'];
    panels.forEach(p => {
      const panel = document.getElementById(`tab-${stageId}-${p}`);
      if (panel) panel.classList.toggle('active', p === tab);
    });
  };

  window.toggleTask = function (taskId, checked) {
    const taskStatuses = StorageUtil.get(STORAGE_KEYS.TASK_STATUS, {});
    taskStatuses[taskId] = checked;
    StorageUtil.set(STORAGE_KEYS.TASK_STATUS, taskStatuses);

    const taskEl = document.getElementById(`task-${taskId}`);
    if (taskEl) taskEl.classList.toggle('completed', checked);
  };

  window.toggleShoppingItem = function (itemId, checked) {
    const shoppingStatuses = StorageUtil.get(STORAGE_KEYS.SHOPPING_STATUS, {});
    shoppingStatuses[itemId] = checked;
    StorageUtil.set(STORAGE_KEYS.SHOPPING_STATUS, shoppingStatuses);

    const el = document.getElementById(`shopping-${itemId}`);
    if (el) el.classList.toggle('completed', checked);
  };

  window.togglePrepItem = function (itemId, checked) {
    const prepStatuses = StorageUtil.get(STORAGE_KEYS.PREP_STATUS, {});
    prepStatuses[itemId] = checked;
    StorageUtil.set(STORAGE_KEYS.PREP_STATUS, prepStatuses);

    const el = document.getElementById(`prep-${itemId}`);
    if (el) el.classList.toggle('completed', checked);
  };



  // ==================== Workflow Edit Modals & Logic ====================
  window.openEditWorkflowModal = function (type, stageId, itemId = null) {
    const modal = document.getElementById('modal-edit-workflow');
    const body = document.getElementById('edit-workflow-body');
    const title = document.getElementById('edit-workflow-title');
    
    const stages = getStages();
    const stage = stageId ? stages.find(s => s.id === stageId) : null;
    
    const saveBtn = document.getElementById('btn-save-workflow');
    saveBtn.onclick = () => saveWorkflowAction(type, stageId, itemId);
    
    let html = '';
    
    if (type === 'stage') {
      title.textContent = stageId ? '编辑阶段' : '添加新阶段';
      html = `
        <div class="form-group">
          <label class="form-label">阶段名称</label>
          <input type="text" class="form-input" id="wf-edit-name" value="${stage ? stage.name : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">预计耗时</label>
          <input type="text" class="form-input" id="wf-edit-duration" value="${stage ? (stage.duration||'') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">图标 (Emoji)</label>
          <input type="text" class="form-input" id="wf-edit-icon" value="${stage ? stage.icon : '📋'}">
        </div>
        <div class="form-group">
          <label class="form-label">阶段描述</label>
          <textarea class="form-textarea" id="wf-edit-desc">${stage ? (stage.description||'') : ''}</textarea>
        </div>
      `;
    } else if (type === 'task') {
      const item = itemId ? stage.tasks.find(i => i.id === itemId) : null;
      title.textContent = itemId ? '编辑任务' : '添加任务';
      html = `
        <div class="form-group">
          <label class="form-label">任务名称</label>
          <input type="text" class="form-input" id="wf-edit-text" value="${item ? item.text : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">详细说明</label>
          <textarea class="form-textarea" id="wf-edit-detail">${item ? (item.detail||'') : ''}</textarea>
        </div>
      `;
    } else if (type === 'warning') {
      const item = itemId ? stage.warnings.find(i => i.id === itemId) : null;
      title.textContent = itemId ? '编辑避坑指南' : '添加避坑指南';
      html = `
        <div class="form-group">
          <label class="form-label">提醒标题</label>
          <input type="text" class="form-input" id="wf-edit-title" value="${item ? item.title : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">详细说明</label>
          <textarea class="form-textarea" id="wf-edit-detail">${item ? (item.detail||'') : ''}</textarea>
        </div>
      `;
    } else if (type === 'shopping') {
      const item = itemId ? stage.shopping.find(i => i.id === itemId) : null;
      title.textContent = itemId ? '编辑采购物品' : '添加采购物品';
      html = `
        <div class="form-group">
          <label class="form-label">物品名称</label>
          <input type="text" class="form-input" id="wf-edit-name" value="${item ? item.name : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">分类</label>
          <input type="text" class="form-input" id="wf-edit-category" value="${item ? (item.category||'') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">价格区间 (最小值)</label>
          <input type="number" class="form-input" id="wf-edit-min" value="${item ? (item.priceMin||0) : 0}">
        </div>
        <div class="form-group">
          <label class="form-label">价格区间 (最大值)</label>
          <input type="number" class="form-input" id="wf-edit-max" value="${item ? (item.priceMax||0) : 0}">
        </div>
        <div class="form-group">
          <label class="form-label">单位 (如：㎡, 个)</label>
          <input type="text" class="form-input" id="wf-edit-unit" value="${item ? (item.unit||'') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea class="form-textarea" id="wf-edit-note">${item ? (item.note||'') : ''}</textarea>
        </div>
      `;
    } else if (type === 'prep') {
      const item = itemId ? stage.preparations.find(i => i.id === itemId) : null;
      title.textContent = itemId ? '编辑前期准备' : '添加前期准备';
      html = `
        <div class="form-group">
          <label class="form-label">准备事项</label>
          <input type="text" class="form-input" id="wf-edit-text" value="${item ? item.text : ''}">
        </div>
      `;
    } else if (type === 'workerType') {
      const item = itemId && stage ? stage.workerTypes.find(i => i.id === itemId) : null;
      title.textContent = itemId ? '编辑工种' : '添加工种';
      
      const stageOptions = stages.map(s => `<option value="${s.id}" ${stage && stage.id === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('');
      
      html = `
        <div class="form-group">
          <label class="form-label">所属阶段</label>
          <select class="form-select" id="wf-edit-stage-id" ${itemId ? 'disabled' : ''}>
            ${stageOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">工种名称</label>
          <input type="text" class="form-input" id="wf-edit-name" value="${item ? item.name : ''}" placeholder="例如：泥瓦工">
        </div>
        <div class="form-group">
          <label class="form-label">计费方式</label>
          <input type="text" class="form-input" id="wf-edit-pricetype" value="${item ? item.priceType : ''}" placeholder="例如：按面积计费">
        </div>
        <div class="form-group">
          <label class="form-label">价格区间 (最低)</label>
          <input type="number" class="form-input" id="wf-edit-min" value="${item ? (item.priceMin||0) : 0}">
        </div>
        <div class="form-group">
          <label class="form-label">价格区间 (最高)</label>
          <input type="number" class="form-input" id="wf-edit-max" value="${item ? (item.priceMax||0) : 0}">
        </div>
        <div class="form-group">
          <label class="form-label">单位 (例如：元/㎡, 元/天)</label>
          <input type="text" class="form-input" id="wf-edit-unit" value="${item ? (item.unit||'') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">备注 (工作内容说明)</label>
          <textarea class="form-textarea" id="wf-edit-note">${item ? (item.note||'') : ''}</textarea>
        </div>
      `;
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
  };

  function saveWorkflowAction(type, stageId, itemId) {
    const stages = getStages();
    let stage = stageId ? stages.find(s => s.id === stageId) : null;
    if (type === 'workerType' && !stage) {
      const selectedStageId = document.getElementById('wf-edit-stage-id').value;
      stage = stages.find(s => s.id === selectedStageId);
    }
    
    if (type === 'stage') {
      if (!stage) {
        stage = {
          id: 'stage-' + generateId(),
          order: stages.length + 1,
          tasks: [], warnings: [], shopping: [], preparations: [], workerTypes: []
        };
        stages.push(stage);
      }
      stage.name = document.getElementById('wf-edit-name').value;
      stage.icon = document.getElementById('wf-edit-icon').value || '📋';
      stage.duration = document.getElementById('wf-edit-duration').value;
      stage.description = document.getElementById('wf-edit-desc').value;
    } else {
      let coll = '';
      if (type === 'task') coll = 'tasks';
      if (type === 'warning') coll = 'warnings';
      if (type === 'shopping') coll = 'shopping';
      if (type === 'prep') coll = 'preparations';
      if (type === 'workerType') coll = 'workerTypes';
      
      let item = itemId ? stage[coll].find(i => i.id === itemId) : null;
      if (!item) {
        item = { id: type + '-' + generateId() };
        stage[coll].push(item);
      }
      
      if (type === 'task') {
        item.text = document.getElementById('wf-edit-text').value;
        item.detail = document.getElementById('wf-edit-detail').value;
      } else if (type === 'warning') {
        item.title = document.getElementById('wf-edit-title').value;
        item.detail = document.getElementById('wf-edit-detail').value;
      } else if (type === 'shopping') {
        item.name = document.getElementById('wf-edit-name').value;
        item.category = document.getElementById('wf-edit-category').value;
        item.priceMin = Number(document.getElementById('wf-edit-min').value);
        item.priceMax = Number(document.getElementById('wf-edit-max').value);
        item.unit = document.getElementById('wf-edit-unit').value;
        item.note = document.getElementById('wf-edit-note').value;
      } else if (type === 'prep') {
        item.text = document.getElementById('wf-edit-text').value;
      } else if (type === 'workerType') {
        item.name = document.getElementById('wf-edit-name').value;
        item.priceType = document.getElementById('wf-edit-pricetype').value;
        item.priceMin = Number(document.getElementById('wf-edit-min').value);
        item.priceMax = Number(document.getElementById('wf-edit-max').value);
        item.unit = document.getElementById('wf-edit-unit').value;
        item.note = document.getElementById('wf-edit-note').value;
      }
    }
    
    saveStages(stages);
    closeModal('modal-edit-workflow');
    showToast('保存成功');
  }

  window.deleteWorkflowItem = function (coll, stageId, itemId) {
    if (!confirm('确定要删除吗？')) return;
    const stages = getStages();
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      stage[coll] = stage[coll].filter(i => i.id !== itemId);
      saveStages(stages);
      showToast('删除成功');
    }
  };

  window.deleteWorkflowStage = function (stageId) {
    if (!confirm('确定要删除整个阶段吗？')) return;
    let stages = getStages();
    stages = stages.filter(s => s.id !== stageId);
    stages.forEach((s, idx) => s.order = idx + 1);
    saveStages(stages);
    showToast('阶段已删除');
  };



  const BV2_CATS = [
    { id: 'demolition', name: '①前期拆改/设计监理', color: '#f97316', group: null },
    { id: 'plumbing',   name: '②-A 水电改造',       color: '#3b82f6', group: '②基装施工' },
    { id: 'waterproof', name: '②-B 防水工程',        color: '#06b6d4', group: '②基装施工' },
    { id: 'tiling',     name: '②-C 瓦工（泥瓦）',   color: '#8b5cf6', group: '②基装施工' },
    { id: 'carpentry',  name: '②-D 木工',            color: '#a855f7', group: '②基装施工' },
    { id: 'painting',   name: '②-E 油工（涂料）',   color: '#6366f1', group: '②基装施工' },
    { id: 'doors',      name: '③门窗暖通设备',       color: '#0ea5e9', group: null },
    { id: 'custom',     name: '④全屋定制柜',          color: '#14b8a6', group: null },
    { id: 'sanitary',   name: '⑤厨卫洁具五金',        color: '#f59e0b', group: null },
    { id: 'lighting',   name: '⑥灯具家电',            color: '#ec4899', group: null },
    { id: 'soft',       name: '⑦软装家具',            color: '#22c55e', group: null },
  ];

  // 费用类型
  const COST_TYPES = [
    { id: '', name: '— 请选择 —' },
    { id: 'main-material', name: '主材' },
    { id: 'sub-material',  name: '辅材' },
    { id: 'labor',         name: '工费' },
    { id: 'package',       name: '包工包料' },
    { id: 'misc',          name: '杂项' },
  ];
  const COST_TYPE_NAME = {};
  COST_TYPES.forEach(t => { COST_TYPE_NAME[t.id] = t.name; });

  // 数据迁移：旧 'hardwork' → 'tiling'
  (function migrateHardwork() {
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    let changed = false;
    items.forEach(item => {
      if (item.category === 'hardwork') { item.category = 'tiling'; changed = true; }
      if (item.costType === undefined || item.costType === null) { item.costType = ''; changed = true; }
    });
    if (changed) StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items);
  })();

  // ======================================================
  //                    BUDGET PAGE (Excel-style)
  // ======================================================
  function initBudgetPage() {
    document.getElementById('house-area').addEventListener('input', debounce(onHouseInfoChange, 500));
    document.getElementById('total-budget-input').addEventListener('input', debounce(onHouseInfoChange, 500));
    document.getElementById('mobile-budget-add')?.addEventListener('click', () => openMobileBudgetEditor());
    document.getElementById('btn-save-bv2')?.addEventListener('click', saveMobileBudgetItem);
    document.getElementById('mobile-delete-bv2')?.addEventListener('click', deleteMobileBudgetItem);
    document.getElementById('mobile-budget-advanced-toggle')?.addEventListener('click', toggleMobileBudgetAdvanced);

    // Load house info
    const hi = StorageUtil.get(STORAGE_KEYS.HOUSE_INFO, {});
    if (hi.area) document.getElementById('house-area').value = hi.area;
    if (hi.totalBudget) document.getElementById('total-budget-input').value = hi.totalBudget;
  }

  function onHouseInfoChange() {
    const hi = StorageUtil.get(STORAGE_KEYS.HOUSE_INFO, {});
    hi.area = Number(document.getElementById('house-area').value) || 0;
    hi.totalBudget = Number(document.getElementById('total-budget-input').value) || 0;
    StorageUtil.set(STORAGE_KEYS.HOUSE_INFO, hi);
    renderBudgetPage();
  }

  function renderBudgetPage() {
    renderTierSelector();
    renderBudgetSummary();
    renderBudgetSpreadsheet();
    renderMobileBudgetList();
    renderBudgetCharts();
  }

  function renderTierSelector() {
    const container = document.getElementById('tier-selector');
    if (!container) return;
    const hi = StorageUtil.get(STORAGE_KEYS.HOUSE_INFO, {});
    container.innerHTML = Object.entries(BUDGET_TEMPLATES).map(([key, tier]) => `
      <button class="tier-option ${hi.tier === key ? 'active' : ''}" onclick="selectTier('${key}')">
        <div class="tier-name">${tier.name}</div>
        <div class="tier-price">${formatMoney(tier.pricePerSqm)}/㎡</div>
        <div class="tier-desc">${tier.description}</div>
        ${hi.area ? `<div class="tier-price" style="margin-top:4px;font-size:var(--font-size-base);">预估 ${formatMoney(tier.pricePerSqm * hi.area)}</div>` : ''}
      </button>
    `).join('');
  }

  window.selectTier = function (key) {
    const hi = StorageUtil.get(STORAGE_KEYS.HOUSE_INFO, {});
    hi.tier = key;
    if (hi.area) {
      hi.totalBudget = BUDGET_TEMPLATES[key].pricePerSqm * hi.area;
      document.getElementById('total-budget-input').value = hi.totalBudget;
    }
    StorageUtil.set(STORAGE_KEYS.HOUSE_INFO, hi);
    renderBudgetPage();
    showToast(`已选择「${BUDGET_TEMPLATES[key].name}」`);
  };

  function renderBudgetSummary() {
    const hi = StorageUtil.get(STORAGE_KEYS.HOUSE_INFO, {});
    const totalBudget = hi.totalBudget || 0;
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const planned = items.reduce((s, i) => s + (parseNum(i.budget)), 0);
    const actual  = items.reduce((s, i) => s + (parseNum(i.actual)), 0);
    const remaining = totalBudget - actual;
    const pct = totalBudget > 0 ? Math.min(100, Math.round(actual / totalBudget * 100)) : 0;

    const bar = document.getElementById('budget-summary-bar');
    if (!bar) return;
    bar.innerHTML = `
      <div class="budget-summary-item">
        <div class="budget-summary-label">总预算</div>
        <div class="budget-summary-value total">${formatMoney(totalBudget)}</div>
      </div>
      <div class="budget-summary-divider"></div>
      <div class="budget-summary-item">
        <div class="budget-summary-label">已规划</div>
        <div class="budget-summary-value total">${formatMoney(planned)}</div>
      </div>
      <div class="budget-summary-divider"></div>
      <div class="budget-summary-item">
        <div class="budget-summary-label">实际支出</div>
        <div class="budget-summary-value spent">${formatMoney(actual)}</div>
      </div>
      <div class="budget-summary-divider"></div>
      <div class="budget-summary-item">
        <div class="budget-summary-label">${remaining >= 0 ? '剩余预算' : '已超支'}</div>
        <div class="budget-summary-value ${remaining >= 0 ? 'remaining' : 'over'}">${formatMoney(Math.abs(remaining))}</div>
      </div>
      <div class="budget-progress-wrap">
        <div class="budget-progress-bar" style="width:${pct}%; background: ${pct > 100 ? 'var(--accent-rose)' : pct > 80 ? 'var(--accent-amber)' : 'var(--gradient-blue)'}"></div>
        <span class="budget-progress-pct">${pct}%</span>
      </div>
    `;
  }

  function parseNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

  // ===== Spreadsheet Renderer =====
  function renderBudgetSpreadsheet() {
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const tbody = document.getElementById('bv2-tbody');
    const tfoot = document.getElementById('bv2-tfoot');
    if (!tbody) return;

    const catMap = {};
    BV2_CATS.forEach(c => { catMap[c.id] = c; });

    // Group by category preserving order
    const grouped = {};
    BV2_CATS.forEach(c => { grouped[c.id] = []; });
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    let grandBudget = 0, grandActual = 0;
    let rowNum = 1;
    let html = '';
    let lastGroup = null; // track group headers for ②基装施工

    // For 基装 group subtotal
    let jiZhuangBudget = 0, jiZhuangActual = 0;
    const jiZhuangIds = new Set(BV2_CATS.filter(c => c.group === '②基装施工').map(c => c.id));

    BV2_CATS.forEach(cat => {
      const rows = grouped[cat.id];
      if (!rows || rows.length === 0) return;

      // Insert group header for 基装施工
      if (cat.group && cat.group !== lastGroup) {
        lastGroup = cat.group;
        html += `
          <tr class="bv2-group-header">
            <td colspan="16"><div class="bv2-group-label">🏗️ ${cat.group}（含水电/防水/瓦工/木工/油工）</div></td>
          </tr>
        `;
      }

      let catBudget = 0, catActual = 0;

      rows.forEach((item, idx) => {
        const budget = parseNum(item.budget);
        const actual = parseNum(item.actual);
        const diff   = actual - budget;
        catBudget += budget; catActual += actual;
        grandBudget += budget; grandActual += actual;
        if (jiZhuangIds.has(cat.id)) { jiZhuangBudget += budget; jiZhuangActual += actual; }

        const diffHtml = actual > 0
          ? `<span class="${diff > 0 ? 'diff-over' : 'diff-under'}">${diff > 0 ? '+' : ''}${formatMoney(diff)}</span>`
          : '<span class="text-muted">—</span>';

        const costTypeHtml = `<select class="xl-cost-type" onchange="onXlSelect('${item.id}','costType',this.value)">
          ${COST_TYPES.map(t => `<option value="${t.id}" ${item.costType === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>`;

        html += `
          <tr class="bv2-row" data-id="${item.id}">
            <td class="row-num-cell">${rowNum++}</td>
            ${idx === 0 ? `<td class="bv2-cat-cell" rowspan="${rows.length}" style="--cat-color:${cat.color};">
              <div class="bv2-cat-inner"><span class="bv2-cat-dot"></span>${cat.name}</div>
            </td>` : ''}
            <td class="xl-cell cost-type-cell">${costTypeHtml}</td>
            <td class="xl-cell"><div class="xl-editable" contenteditable="true" data-field="room" data-id="${item.id}" onblur="onXlBlur(this)" onkeydown="onXlKey(event,this)">${escapeHtml(item.room || '')}</div></td>
            <td class="xl-cell name-cell">
              <div class="xl-name-wrap">
                <div class="xl-editable" contenteditable="true" data-field="name" data-id="${item.id}" onblur="onXlBlur(this)" onkeydown="onXlKey(event,this)">${escapeHtml(item.name || '')}</div>
                <select class="xl-priority-sel" onchange="onXlSelect('${item.id}','priority',this.value)">
                  <option value="must"     ${item.priority==='must'     ? 'selected':''}>🔴刚需</option>
                  <option value="optional" ${item.priority==='optional' ? 'selected':''}>🟡可减配</option>
                  <option value="nice"     ${item.priority==='nice'     ? 'selected':''}>🟢锦上添花</option>
                </select>
              </div>
            </td>
            <td class="xl-cell"><div class="xl-editable" contenteditable="true" data-field="brand" data-id="${item.id}" onblur="onXlBlur(this)" onkeydown="onXlKey(event,this)">${escapeHtml(item.brand || '')}</div></td>
            <td class="xl-cell unit-cell"><div class="xl-editable" contenteditable="true" data-field="unit" data-id="${item.id}" onblur="onXlBlur(this)" onkeydown="onXlKey(event,this)">${escapeHtml(item.unit || '')}</div></td>
            <td class="xl-cell num-cell"><input class="xl-num" type="number" value="${item.qty || ''}" placeholder="0" data-field="qty" data-id="${item.id}" onchange="onXlNumChange(this)" onfocus="this.select()"></td>
            <td class="xl-cell num-cell"><input class="xl-num" type="number" value="${item.unitPrice || ''}" placeholder="0" data-field="unitPrice" data-id="${item.id}" onchange="onXlNumChange(this)" onfocus="this.select()"></td>
            <td class="xl-cell num-cell budget-cell"><input class="xl-num budget-num" type="number" value="${item.budget || ''}" placeholder="自动" data-field="budget" data-id="${item.id}" onchange="onXlNumChange(this)" onfocus="this.select()"></td>
            <td class="xl-cell num-cell"><input class="xl-num actual-num" type="number" value="${item.actual || ''}" placeholder="0" data-field="actual" data-id="${item.id}" onchange="onXlNumChange(this)" onfocus="this.select()"></td>
            <td class="xl-cell num-cell diff-cell">${diffHtml}</td>
            <td class="xl-cell craft-cell"><div class="xl-editable xl-craft" contenteditable="true" data-field="craft" data-id="${item.id}" onblur="onXlBlur(this)" onkeydown="onXlKey(event,this)" title="${escapeHtml(item.craft || '')}">${escapeHtml(item.craft || '')}</div></td>
            <td class="xl-cell note-cell"><div class="xl-editable" contenteditable="true" data-field="note" data-id="${item.id}" onblur="onXlBlur(this)" onkeydown="onXlKey(event,this)">${escapeHtml(item.note || '')}</div></td>
            <td class="action-cell"><button class="xl-del-btn" onclick="deleteBv2Item('${item.id}')" title="删除此行">✕</button></td>
          </tr>
        `;
      });

      // Category subtotal
      const catDiff = catActual - catBudget;
      html += `
        <tr class="bv2-subtotal">
          <td></td>
          <td class="subtotal-label" colspan="9">${cat.name} 小计</td>
          <td class="num-cell subtotal-num">${formatMoney(catBudget)}</td>
          <td class="num-cell subtotal-num">${formatMoney(catActual)}</td>
          <td class="num-cell">${catActual > 0 ? `<span class="${catDiff > 0 ? 'diff-over' : 'diff-under'}">${catDiff > 0 ? '+' : ''}${formatMoney(catDiff)}</span>` : '—'}</td>
          <td colspan="3"></td>
        </tr>
      `;

      // Add row button for this category
      html += `
        <tr class="bv2-add-row">
          <td colspan="16">
            <button class="xl-add-row-btn" onclick="addBv2Row('${cat.id}')">＋ 在「${cat.name}」添加一行</button>
          </td>
        </tr>
      `;
    });

    // Grand total
    const grandDiff = grandActual - grandBudget;
    tfoot.innerHTML = `
      <tr class="bv2-grand-total">
        <td colspan="10" class="grand-total-label">📊 全部合计</td>
        <td class="num-cell grand-total-num">${formatMoney(grandBudget)}</td>
        <td class="num-cell grand-total-num">${formatMoney(grandActual)}</td>
        <td class="num-cell">${grandActual > 0 ? `<span class="${grandDiff > 0 ? 'diff-over' : 'diff-under'}">${grandDiff > 0 ? '+' : ''}${formatMoney(grandDiff)}</span>` : '—'}</td>
        <td colspan="3"></td>
      </tr>
    `;

    // Append the "Add to new category" button section
    html += `
      <tr class="bv2-add-cat-row">
        <td colspan="16">
          <div class="bv2-add-cat-bar">
            ${BV2_CATS.map(c => `<button class="xl-add-cat-btn" style="--cat-c:${c.color};" onclick="addBv2Row('${c.id}')">＋ ${c.name}</button>`).join('')}
          </div>
        </td>
      </tr>
    `;

    tbody.innerHTML = html;
  }

  function renderMobileBudgetList() {
    const filters = document.getElementById('mobile-budget-filters');
    const list = document.getElementById('mobile-budget-list');
    if (!filters || !list) return;

    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);

    // Build filter chips: 全部 + each category, with 基装 sub-categories shown as group
    const chipHtml = [
      `<button class="mobile-filter-chip ${mobileBudgetFilter === 'all' ? 'active' : ''}" type="button" onclick="setMobileBudgetFilter('all')">全部 ${items.length}</button>`,
      ...BV2_CATS.map(cat => {
        const count = items.filter(item => item.category === cat.id).length;
        // Short label: strip leading circled number + dash + letter prefix
        const shortName = cat.name.replace(/^[①②③④⑤⑥⑦]-[A-E]\s*/, '').replace(/^[①②③④⑤⑥⑦]\s*/, '');
        return `<button class="mobile-filter-chip ${mobileBudgetFilter === cat.id ? 'active' : ''}" type="button" style="--chip-c:${cat.color};" onclick="setMobileBudgetFilter('${cat.id}')">${shortName} ${count}</button>`;
      }),
    ].join('');
    filters.innerHTML = chipHtml;

    const visibleItems = mobileBudgetFilter === 'all'
      ? items
      : items.filter(item => item.category === mobileBudgetFilter);

    if (visibleItems.length === 0) {
      const emptyDefaultCat = mobileBudgetFilter === 'all' ? 'plumbing' : mobileBudgetFilter;
      list.innerHTML = `
        <div class="mobile-empty-state">
          <div style="font-size:2rem;margin-bottom:6px;">🧾</div>
          <div>${items.length ? '这个分类还没有预算项目' : '还没有预算项目'}</div>
          <button class="btn btn-primary" type="button" style="margin-top:12px;" onclick="openMobileBudgetEditor(null, '${emptyDefaultCat}')">＋ 添加第一项</button>
        </div>
      `;
      return;
    }

    const priorityLabels = { must: '🔴 刚需', optional: '🟡 可减配', nice: '🟢 锦上添花' };
    list.innerHTML = visibleItems.map(item => {
      const cat = BV2_CATS.find(candidate => candidate.id === item.category) || BV2_CATS[0];
      const budget = parseNum(item.budget);
      const actual = parseNum(item.actual);
      const diff = actual - budget;
      return `
        <button class="mobile-budget-card" type="button" style="--category-color:${cat.color};" onclick="openMobileBudgetEditor('${item.id}')">
          <div class="mobile-budget-card-header">
            <div>
              <div class="mobile-budget-card-name">${escapeHtml(item.name || '未命名项目')}</div>
              <div class="mobile-budget-card-meta">${escapeHtml(cat.name)}${item.room ? ` · ${escapeHtml(item.room)}` : ''}</div>
            </div>
            <span class="tag">${priorityLabels[item.priority] || priorityLabels.must}</span>
          </div>
          <div class="mobile-budget-card-values">
            <div><div class="mobile-budget-card-label">预算</div><div class="mobile-budget-card-value">${formatMoney(budget)}</div></div>
            <div><div class="mobile-budget-card-label">实际</div><div class="mobile-budget-card-value">${formatMoney(actual)}</div></div>
            <div><div class="mobile-budget-card-label">差额</div><div class="mobile-budget-card-value ${diff > 0 ? 'diff-over' : 'diff-under'}">${actual > 0 ? `${diff > 0 ? '+' : ''}${formatMoney(diff)}` : '—'}</div></div>
          </div>
        </button>
      `;
    }).join('');
  }

  window.setMobileBudgetFilter = function (category) {
    mobileBudgetFilter = category;
    renderMobileBudgetList();
  };

  window.openMobileBudgetEditor = function (itemId = null, category = null) {
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const item = itemId ? items.find(candidate => candidate.id === itemId) : null;
    mobileEditingBudgetId = item?.id || null;

    // Resolve default category (avoid legacy 'hardwork')
    const defaultCat = mobileBudgetFilter === 'all' || mobileBudgetFilter === 'hardwork' ? 'plumbing' : mobileBudgetFilter;
    const values = item || {
      category: category || defaultCat,
      costType: '',
      room: '', name: '', brand: '', unit: '', qty: 0, unitPrice: 0,
      budget: 0, actual: 0, priority: 'must', craft: '', note: '',
    };

    document.getElementById('bv2-modal-title').textContent = item ? '编辑预算项目' : '添加预算项目';
    document.getElementById('bv2-cat').value = values.category || 'plumbing';
    const costTypeEl = document.getElementById('bv2-cost-type');
    if (costTypeEl) costTypeEl.value = values.costType || '';
    document.getElementById('bv2-room').value = values.room || '';
    document.getElementById('bv2-name').value = values.name || '';
    document.getElementById('bv2-brand').value = values.brand || '';
    document.getElementById('bv2-unit').value = values.unit || '';
    document.getElementById('bv2-qty').value = values.qty || '';
    document.getElementById('bv2-unit-price').value = values.unitPrice || '';
    document.getElementById('bv2-budget').value = values.budget || '';
    document.getElementById('bv2-actual').value = values.actual || '';
    document.getElementById('bv2-priority').value = values.priority || 'must';
    document.getElementById('bv2-craft').value = values.craft || '';
    document.getElementById('bv2-note').value = values.note || '';

    const advanced = document.querySelector('.mobile-budget-advanced');
    const hasAdvanced = !!(values.brand || values.craft || values.note || values.priority !== 'must');
    advanced?.classList.toggle('expanded', hasAdvanced && isMobileViewport());
    const advancedToggle = document.getElementById('mobile-budget-advanced-toggle');
    advancedToggle?.setAttribute('aria-expanded', hasAdvanced && isMobileViewport() ? 'true' : 'false');
    if (advancedToggle) advancedToggle.textContent = hasAdvanced && isMobileViewport() ? '－ 收起详细信息' : '＋ 品牌、工艺与备注';

    const deleteButton = document.getElementById('mobile-delete-bv2');
    if (deleteButton) deleteButton.hidden = !item;
    openModal('modal-budget-v2');
    setTimeout(() => document.getElementById('bv2-name')?.focus(), 0);
  };

  window.calcBv2Budget = function () {
    const qty = parseNum(document.getElementById('bv2-qty').value);
    const unitPrice = parseNum(document.getElementById('bv2-unit-price').value);
    if (qty > 0 && unitPrice > 0) {
      document.getElementById('bv2-budget').value = Math.round(qty * unitPrice * 100) / 100;
    }
  };

  function toggleMobileBudgetAdvanced() {
    const advanced = document.querySelector('.mobile-budget-advanced');
    const button = document.getElementById('mobile-budget-advanced-toggle');
    if (!advanced || !button) return;
    const expanded = advanced.classList.toggle('expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? '－ 收起详细信息' : '＋ 品牌、工艺与备注';
  }

  function saveMobileBudgetItem() {
    const name = document.getElementById('bv2-name').value.trim();
    if (!name) {
      showToast('请输入项目名称', 'error');
      document.getElementById('bv2-name').focus();
      return;
    }

    const qty = parseNum(document.getElementById('bv2-qty').value);
    const unitPrice = parseNum(document.getElementById('bv2-unit-price').value);
    const enteredBudget = document.getElementById('bv2-budget').value;
    const costTypeEl = document.getElementById('bv2-cost-type');
    const nextItem = {
      id: mobileEditingBudgetId || generateId(),
      category: document.getElementById('bv2-cat').value,
      costType: costTypeEl ? costTypeEl.value : '',
      room: document.getElementById('bv2-room').value.trim(),
      name,
      brand: document.getElementById('bv2-brand').value.trim(),
      unit: document.getElementById('bv2-unit').value.trim(),
      qty,
      unitPrice,
      budget: enteredBudget === '' && qty > 0 && unitPrice > 0 ? Math.round(qty * unitPrice * 100) / 100 : parseNum(enteredBudget),
      actual: parseNum(document.getElementById('bv2-actual').value),
      priority: document.getElementById('bv2-priority').value,
      craft: document.getElementById('bv2-craft').value.trim(),
      note: document.getElementById('bv2-note').value.trim(),
    };

    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const index = items.findIndex(item => item.id === mobileEditingBudgetId);
    if (index >= 0) items[index] = nextItem;
    else items.push(nextItem);

    if (!StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items)) {
      showToast('保存失败，请检查浏览器存储空间', 'error');
      return;
    }

    mobileEditingBudgetId = null;
    closeModal('modal-budget-v2');
    renderBudgetPage();
    showToast(index >= 0 ? '预算项目已更新' : '预算项目已添加');
  }

  function deleteMobileBudgetItem() {
    if (!mobileEditingBudgetId) return;
    const deleteAction = () => {
      const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []).filter(item => item.id !== mobileEditingBudgetId);
      if (!StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items)) {
        showToast('删除失败，请稍后重试', 'error');
        return;
      }
      mobileEditingBudgetId = null;
      closeModal('modal-budget-v2');
      renderBudgetPage();
      showToast('预算项目已删除');
    };
    if (!openMobileConfirm('删除预算项目', '删除后无法恢复，确定继续吗？', '确认删除', deleteAction) && confirm('确定要删除这个预算项目吗？')) {
      deleteAction();
    }
  }

  // === Cell edit handlers ===
  window.onXlBlur = function (el) {
    const id = el.dataset.id;
    const field = el.dataset.field;
    const value = el.textContent.trim();
    saveBv2Field(id, field, value);
  };

  window.onXlKey = function (e, el) {
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const cells = [...document.querySelectorAll('.xl-editable, .xl-num')];
      const idx = cells.indexOf(el);
      if (idx >= 0 && idx < cells.length - 1) cells[idx + 1].focus();
    }
  };

  window.onXlNumChange = function (input) {
    const id = input.dataset.id;
    const field = input.dataset.field;
    const value = parseFloat(input.value) || 0;
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item[field] = value;
    // Auto-calc budget from qty x unit price
    if (field === 'qty' || field === 'unitPrice') {
      const q = parseNum(item.qty), u = parseNum(item.unitPrice);
      if (q > 0 && u > 0) {
        item.budget = Math.round(q * u * 100) / 100;
      }
    }
    StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items);
    renderBudgetSpreadsheet();
    renderBudgetSummary();
    renderBudgetCharts();
  };

  window.onXlSelect = function (id, field, value) {
    saveBv2Field(id, field, value, false);
  };

  function saveBv2Field(id, field, value, rerender = true) {
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item[field] = value;
    StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items);
    if (rerender) {
      renderBudgetSpreadsheet();
      renderBudgetSummary();
      renderBudgetCharts();
    }
  }

  window.addBv2Row = function (catId) {
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const newId = generateId();
    items.push({
      id: newId,
      category: catId,
      costType: '',
      room: '',
      name: '',
      brand: '',
      unit: '',
      qty: 0,
      unitPrice: 0,
      budget: 0,
      actual: 0,
      priority: 'must',
      craft: '',
      note: '',
    });
    StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items);
    renderBudgetSpreadsheet();
    renderBudgetSummary();
    // Focus the name cell of the new row by its unique ID to prevent page jump to bottom
    setTimeout(() => {
      const target = document.querySelector(`.xl-editable[data-field="name"][data-id="${newId}"]`);
      if (target) {
        target.focus();
        // Move cursor to end
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    }, 60);
  };

  window.deleteBv2Item = function (id) {
    let items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    items = items.filter(i => i.id !== id);
    StorageUtil.set(STORAGE_KEYS.BUDGET_V2, items);
    renderBudgetPage();
    showToast('已删除');
  };

  function renderBudgetCharts() {
    if (isMobileViewport()) {
      if (budgetPieChart) { budgetPieChart.destroy(); budgetPieChart = null; }
      if (budgetBarChart) { budgetBarChart.destroy(); budgetBarChart = null; }
      return;
    }
    renderBudgetPieChart();
    renderBudgetBarChart();
  }

  function renderBudgetPieChart() {
    const container = document.getElementById('budget-pie-chart-container');
    if (!container) return;

    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const catTotals = {};
    BV2_CATS.forEach(c => { catTotals[c.id] = 0; });
    items.forEach(item => { catTotals[item.category] = (catTotals[item.category] || 0) + parseNum(item.budget); });
    const labels = BV2_CATS.map(c => c.name);
    const data   = BV2_CATS.map(c => catTotals[c.id]);
    const colors = BV2_CATS.map(c => c.color);

    if (budgetPieChart) {
      budgetPieChart.destroy();
      budgetPieChart = null;
    }

    if (typeof Chart === 'undefined') {
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-muted);">图表库未加载，请连接网络</div>`;
      return;
    }

    container.innerHTML = '<canvas id="budget-pie-chart"></canvas>';
    const ctx = document.getElementById('budget-pie-chart');

    budgetPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: true, cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 10, font: { size: 11, family: 'Noto Sans SC' }, usePointStyle: true } },
          tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f0f2f5', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 8, callbacks: { label: ctx => ` ${ctx.label}: ${formatMoney(ctx.raw)}` } }
        }
      }
    });
  }

  function renderBudgetBarChart() {
    const container = document.getElementById('budget-bar-chart-container');
    if (!container) return;

    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    const budgets = {}, actuals = {};
    BV2_CATS.forEach(c => { budgets[c.id] = 0; actuals[c.id] = 0; });
    items.forEach(item => {
      budgets[item.category] = (budgets[item.category] || 0) + parseNum(item.budget);
      actuals[item.category] = (actuals[item.category] || 0) + parseNum(item.actual);
    });
    const labels = BV2_CATS.map(c => c.name.replace(/^[①②③④⑤⑥⑦]/, '').trim());

    if (budgetBarChart) {
      budgetBarChart.destroy();
      budgetBarChart = null;
    }

    if (typeof Chart === 'undefined') {
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-muted);">图表库未加载，请连接网络</div>`;
      return;
    }

    container.innerHTML = '<canvas id="budget-bar-chart"></canvas>';
    const ctx = document.getElementById('budget-bar-chart');

    budgetBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '预算', data: BV2_CATS.map(c => budgets[c.id]), backgroundColor: 'rgba(59,130,246,0.55)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 6 },
          { label: '实际', data: BV2_CATS.map(c => actuals[c.id]), backgroundColor: 'rgba(245,158,11,0.55)', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10, family: 'Noto Sans SC' }, maxRotation: 40 } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => formatMoney(v) } }
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'Noto Sans SC' }, usePointStyle: true } },
          tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f0f2f5', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 8, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatMoney(ctx.raw)}` } }
        }
      }
    });
  }

  function populateStageSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = getStages().map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');
  }


  

  // ======================================================
  //                    EXCEL IMPORT / EXPORT
  // ======================================================

  const EXCEL_HEADERS = {
    room: '房间',
    category: '分类',
    costType: '费用类型',
    name: '项目名称',
    priority: '优先级',
    brand: '品牌型号',
    unit: '单位',
    qty: '工程量',
    unitPrice: '单价',
    budget: '预算总价',
    actual: '实际支出',
    craft: '施工工艺及验收',
    note: '备注'
  };

  const PRIORITY_MAP = {
    'must': '🔴刚需不可省',
    'optional': '🟡可减配',
    'nice': '🟢锦上添花'
  };

  const REVERSE_PRIORITY_MAP = {
    '🔴刚需不可省': 'must',
    '🟡可减配': 'optional',
    '🟢锦上添花': 'nice',
    '刚需': 'must',
    '可减配': 'optional',
    '锦上添花': 'nice'
  };

  const COST_TYPE_MAP = {
    '': '',
    'main-material': '主材',
    'sub-material': '辅材',
    'labor': '工费',
    'package': '包工包料',
    'misc': '杂项'
  };
  const REVERSE_COST_TYPE_MAP = {};
  Object.entries(COST_TYPE_MAP).forEach(([k,v]) => { REVERSE_COST_TYPE_MAP[v] = k; });

  window.exportBudgetExcel = function() {
    const items = StorageUtil.get(STORAGE_KEYS.BUDGET_V2, []);
    
    // Map data to Excel format
    const excelData = items.map(item => {
      const cat = BV2_CATS.find(c => c.id === item.category);
      return {
        [EXCEL_HEADERS.category]: cat ? cat.name : item.category,
        [EXCEL_HEADERS.costType]: COST_TYPE_MAP[item.costType] || (item.costType ? item.costType : ''),
        [EXCEL_HEADERS.room]: item.room || '',
        [EXCEL_HEADERS.name]: item.name || '',
        [EXCEL_HEADERS.priority]: PRIORITY_MAP[item.priority] || '',
        [EXCEL_HEADERS.brand]: item.brand || '',
        [EXCEL_HEADERS.unit]: item.unit || '',
        [EXCEL_HEADERS.qty]: item.qty || 0,
        [EXCEL_HEADERS.unitPrice]: item.unitPrice || 0,
        [EXCEL_HEADERS.budget]: item.budget || 0,
        [EXCEL_HEADERS.actual]: item.actual || 0,
        [EXCEL_HEADERS.craft]: item.craft || '',
        [EXCEL_HEADERS.note]: item.note || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Adjust column widths
    const wscols = [
      {wch: 18}, // category
      {wch: 10}, // costType
      {wch: 10}, // room
      {wch: 25}, // name
      {wch: 14}, // priority
      {wch: 20}, // brand
      {wch: 8},  // unit
      {wch: 10}, // qty
      {wch: 10}, // unitPrice
      {wch: 12}, // budget
      {wch: 12}, // actual
      {wch: 30}, // craft
      {wch: 20}  // note
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "预算明细");
    XLSX.writeFile(workbook, "装修预算明细表.xlsx");
    showToast("已导出装修预算明细表.xlsx");
  };

  window.importBudgetExcel = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!jsonData || jsonData.length === 0) {
          showToast("表格为空或格式不正确", "error");
          return;
        }

        const newItems = [];
        jsonData.forEach(row => {
          // Parse values by matching header names
          const catName = row[EXCEL_HEADERS.category] || '';
          let catId = 'demolition'; // default
          const foundCat = BV2_CATS.find(c => c.name === catName || catName.includes(c.id) || c.name.includes(catName.substring(0, 2)));
          if (foundCat) catId = foundCat.id;

          const priorityName = row[EXCEL_HEADERS.priority] || '';
          let priority = 'must';
          for (let key in REVERSE_PRIORITY_MAP) {
            if (priorityName.includes(key)) {
              priority = REVERSE_PRIORITY_MAP[key];
              break;
            }
          }

          const costTypeName = String(row[EXCEL_HEADERS.costType] || '');
          const costTypeId = REVERSE_COST_TYPE_MAP[costTypeName] || '';

          newItems.push({
            id: generateId(),
            category: catId,
            costType: costTypeId,
            room: String(row[EXCEL_HEADERS.room] || ''),
            name: String(row[EXCEL_HEADERS.name] || ''),
            priority: priority,
            brand: String(row[EXCEL_HEADERS.brand] || ''),
            unit: String(row[EXCEL_HEADERS.unit] || ''),
            qty: parseFloat(row[EXCEL_HEADERS.qty]) || 0,
            unitPrice: parseFloat(row[EXCEL_HEADERS.unitPrice]) || 0,
            budget: parseFloat(row[EXCEL_HEADERS.budget]) || 0,
            actual: parseFloat(row[EXCEL_HEADERS.actual]) || 0,
            craft: String(row[EXCEL_HEADERS.craft] || ''),
            note: String(row[EXCEL_HEADERS.note] || '')
          });
        });

        if (confirm(`成功读取 ${newItems.length} 条预算记录。导入将覆盖当前的预算明细，确定要继续吗？`)) {
          StorageUtil.set(STORAGE_KEYS.BUDGET_V2, newItems);
          renderBudgetPage();
          showToast(`成功导入 ${newItems.length} 条记录`);
        }
      } catch (err) {
        console.error(err);
        showToast("读取 Excel 失败，请检查文件格式", "error");
      }
      
      // Reset input so the same file can be imported again
      event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // ======================================================
  //                    WORKERS PAGE
  // ======================================================
  function initWorkerPage() {
    document.getElementById('btn-save-worker').addEventListener('click', saveWorker);
    document.getElementById('btn-save-call').addEventListener('click', saveCallRecord);
    document.getElementById('mobile-worker-search')?.addEventListener('input', event => {
      mobileWorkerSearch = event.target.value.trim().toLowerCase();
      renderWorkerTypeList();
    });
    document.getElementById('mobile-worker-stage-filter')?.addEventListener('change', event => {
      mobileWorkerStageFilter = event.target.value;
      renderWorkerTypeList();
    });
  }

  function renderWorkersPage() {
    renderMobileWorkerStageOptions();
    renderWorkerTypeList();
    if (currentWorkerType) {
      renderWorkerDetailPanel(currentWorkerType);
    }
  }

  function renderWorkerTypeList() {
    const container = document.getElementById('worker-type-list');

    // Collect all worker types from all stages
    const allWorkerTypes = [];
    getStages().forEach(stage => {
      if (stage.workerTypes) {
        stage.workerTypes.forEach(wt => {
          allWorkerTypes.push({ ...wt, stageId: stage.id, stageName: stage.name, stageIcon: stage.icon });
        });
      }
    });

    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);

    const visibleWorkerTypes = filterMobileWorkerTypes(allWorkerTypes);
    let html = visibleWorkerTypes.map(wt => {
      const count = workers.filter(w => w.typeId === wt.id).length;
      const editBtns = editModeActive ? `
        <div class="edit-actions" style="position:absolute; top:8px; right:8px;">
          <button class="btn-icon" onclick="event.stopPropagation(); openEditWorkflowModal('workerType', '${wt.stageId}', '${wt.id}')">✏️</button>
          <button class="btn-icon delete" onclick="event.stopPropagation(); deleteWorkflowItem('workerTypes', '${wt.stageId}', '${wt.id}')">🗑️</button>
        </div>
      ` : '';

      return `
        <button class="worker-type-item ${currentWorkerType === wt.id ? 'active' : ''}" 
                onclick="selectWorkerType('${wt.id}')" style="position:relative;">
          ${editBtns}
          <div class="worker-type-name">${wt.stageIcon} ${wt.name}</div>
          <div class="worker-type-price">${wt.priceType}：¥${wt.priceMin}-${wt.priceMax}/${wt.unit}</div>
          <div class="worker-type-note">${wt.note || ''} ${count > 0 ? `· 已录入 ${count} 人` : ''}</div>
        </button>
      `;
    }).join('');
    
    if (visibleWorkerTypes.length === 0) {
      html = '<div class="mobile-empty-state">没有找到匹配的工种，请换个关键词或阶段。</div>';
    }

    if (editModeActive) {
      html += `<button class="add-item-btn" onclick="openEditWorkflowModal('workerType', null, null)">➕ 添加新工种</button>`;
    }

    container.innerHTML = html;
  }

  function renderMobileWorkerStageOptions() {
    const select = document.getElementById('mobile-worker-stage-filter');
    if (!select) return;
    select.innerHTML = ['<option value="all">全部阶段</option>']
      .concat(getStages().map(stage => `<option value="${stage.id}">${stage.icon} ${escapeHtml(stage.name)}</option>`))
      .join('');
    select.value = mobileWorkerStageFilter;
  }

  function filterMobileWorkerTypes(workerTypes) {
    if (!isMobileViewport()) return workerTypes;
    return workerTypes.filter(workerType => {
      const matchesStage = mobileWorkerStageFilter === 'all' || workerType.stageId === mobileWorkerStageFilter;
      const haystack = `${workerType.name} ${workerType.priceType} ${workerType.stageName || ''}`.toLowerCase();
      return matchesStage && (!mobileWorkerSearch || haystack.includes(mobileWorkerSearch));
    });
  }


  window.toggleCallRecords = function (toggleEl) {
    const body = toggleEl.nextElementSibling;
    const arrow = toggleEl.querySelector('.call-toggle-arrow');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  };

  window.selectWorkerType = function (typeId) {
    currentWorkerType = typeId;
    renderWorkerTypeList();
    renderWorkerDetailPanel(typeId);
    if (isMobileViewport()) {
      document.getElementById('page-workers')?.classList.add('mobile-detail-open');
      const pageContent = document.querySelector('.page-content');
      if (pageContent) pageContent.scrollTop = 0;
    }
  };

  window.closeMobileWorkerDetail = function () {
    document.getElementById('page-workers')?.classList.remove('mobile-detail-open');
    const pageContent = document.querySelector('.page-content');
    if (pageContent) pageContent.scrollTop = 0;
  };


  function renderWorkerDetailPanel(typeId) {
    const container = document.getElementById('worker-detail-panel');
    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
    const callRecords = StorageUtil.get(STORAGE_KEYS.CALL_RECORDS, []);
    const typeWorkers = workers.filter(w => w.typeId === typeId);

    // Find worker type info
    let workerTypeInfo = null;
    getStages().forEach(stage => {
      if (stage.workerTypes) {
        const found = stage.workerTypes.find(wt => wt.id === typeId);
        if (found) workerTypeInfo = { ...found, stageName: stage.name };
      }
    });

    if (!workerTypeInfo) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">未找到工种信息</div></div>';
      return;
    }

    // Market price reference card
    let html = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">📊 ${workerTypeInfo.name} — 市场价参考</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-md);">
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--text-muted);">计价方式</div>
            <div style="font-size: var(--font-size-sm); color: var(--text-primary); font-weight: 600;">${workerTypeInfo.priceType}</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--text-muted);">市场价区间</div>
            <div style="font-size: var(--font-size-sm); color: var(--accent-teal); font-weight: 600;">¥${workerTypeInfo.priceMin} - ¥${workerTypeInfo.priceMax} / ${workerTypeInfo.unit}</div>
          </div>
          ${workerTypeInfo.note ? `
          <div style="grid-column: 1 / -1;">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted);">备注</div>
            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">${escapeHtml(workerTypeInfo.note)}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    // Worker list
    html += `
      <div class="worker-list-section">
        <div class="worker-list-header">
          <div class="worker-list-title">👷 已录入工人 (${typeWorkers.length})</div>
          <button class="btn btn-primary btn-sm" onclick="openAddWorkerModal('${typeId}')">+ 添加工人</button>
        </div>
        <div class="worker-entries">
    `;

    if (typeWorkers.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">还没有录入工人信息，点击上方按钮添加</div>
        </div>
      `;
    } else {
      typeWorkers.forEach(worker => {
        const workerCalls = callRecords.filter(c => c.workerId === worker.id);
        const stars = '★'.repeat(worker.rating || 0) + '☆'.repeat(5 - (worker.rating || 0));
        const isContacted = !!worker.contacted;

        // Build editable or static fields depending on editModeActive
        const nameField = editModeActive
          ? `<input class="worker-inline-input worker-inline-name" value="${escapeHtml(worker.name)}" placeholder="姓名" onblur="saveWorkerField('${worker.id}','name',this.value)">`
          : `${escapeHtml(worker.name)}`;

        const phoneField = editModeActive
          ? `<input class="worker-inline-input" value="${escapeHtml(worker.phone || '')}" placeholder="电话" onblur="saveWorkerField('${worker.id}','phone',this.value)">`
          : `<span>${escapeHtml(worker.phone || '未填写')}</span>`;

        const sourceField = editModeActive
          ? `<input class="worker-inline-input" value="${escapeHtml(worker.source || '')}" placeholder="来源" onblur="saveWorkerField('${worker.id}','source',this.value)">`
          : `<span>${escapeHtml(worker.source || '未填写')}</span>`;

        const quoteField = editModeActive
          ? `<input class="worker-inline-input" type="number" value="${worker.quote || ''}" placeholder="报价" onblur="saveWorkerField('${worker.id}','quote',this.value)">`
          : `<span class="worker-entry-quote">${worker.quote ? formatMoney(worker.quote) : '未报价'}</span>`;

        const notesField = editModeActive
          ? `<textarea class="worker-inline-textarea" placeholder="备注" onblur="saveWorkerField('${worker.id}','notes',this.value)">${escapeHtml(worker.notes || '')}</textarea>`
          : (worker.notes ? `<div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-sm);">📝 ${escapeHtml(worker.notes)}</div>` : '');

        const ratingField = editModeActive
          ? `<div class="worker-inline-stars" data-worker-id="${worker.id}">${[1,2,3,4,5].map(i => `<span class="inline-star ${i <= (worker.rating||0) ? 'active' : ''}" onclick="saveWorkerStarRating('${worker.id}',${i},this)">★</span>`).join('')}</div>`
          : `<span style="color: var(--accent-amber);">${stars}</span>`;

        html += `
          <div class="worker-entry ${isContacted ? 'worker-contacted' : ''}">
            <div class="worker-entry-header">
              <div class="worker-entry-name">
                ${nameField}
                ${worker.selected ? '<span class="worker-entry-selected">✅ 已选定</span>' : ''}
              </div>
              <div class="worker-entry-actions">
                <label class="contacted-toggle" title="标记是否已联系">
                  <input type="checkbox" ${isContacted ? 'checked' : ''} onchange="toggleWorkerContacted('${worker.id}', this.checked)">
                  <span class="contacted-label ${isContacted ? 'contacted-yes' : 'contacted-no'}">${isContacted ? '✅ 已联系' : '📵 未联系'}</span>
                </label>
                <button class="btn btn-sm ${worker.selected ? 'btn-secondary' : 'btn-success'}" 
                        onclick="toggleWorkerSelected('${worker.id}')">
                  ${worker.selected ? '取消选定' : '选定此人'}
                </button>
                <button class="btn btn-sm btn-secondary" onclick="openAddCallModal('${worker.id}')">📞 记录沟通</button>
                <button class="btn btn-sm btn-danger" onclick="deleteWorker('${worker.id}')">删除</button>
              </div>
            </div>
            <div class="worker-entry-details">
              <div class="worker-detail-item">📱 电话：${phoneField}</div>
              <div class="worker-detail-item">📍 来源：${sourceField}</div>
              <div class="worker-detail-item">⭐ 评分：${ratingField}</div>
              <div class="worker-detail-item">💰 报价：${quoteField}</div>
            </div>
            ${notesField}
            
            ${workerCalls.length > 0 ? `
              <div class="call-records-toggle" onclick="toggleCallRecords(this)" style="
                display: flex; align-items: center; gap: 6px;
                font-size: var(--font-size-xs); color: var(--accent-blue);
                margin-top: var(--space-sm);
                cursor: pointer; user-select: none;
                padding: 4px 8px; border-radius: var(--radius-sm);
                background: var(--accent-blue-soft);
                width: fit-content;
                transition: background var(--transition-fast);
              " onmouseenter="this.style.background='rgba(59,130,246,0.25)'" onmouseleave="this.style.background='var(--accent-blue-soft)'">
                <span class="call-toggle-arrow" style="display:inline-block; transition: transform 0.2s ease;">▶</span>
                📞 沟通记录 (${workerCalls.length})
              </div>
              <div class="call-records-body" style="display:none; margin-top: var(--space-xs);">
                ${workerCalls.map(call => `
                  <div class="call-record">
                    <div class="call-record-header">
                      <div class="call-record-date">📅 ${formatDate(call.date)}</div>
                      <button class="expense-item-delete" onclick="deleteCallRecord('${call.id}')" title="删除">🗑️</button>
                    </div>
                    <div class="call-record-content" style="white-space: pre-wrap;">
                      ${escapeHtml(call.content || '')}
                      ${call.quote ? `<br>💰 报价：${formatMoney(call.quote)}` : ''}
                      ${call.conditions ? `<br>📋 条件：${escapeHtml(call.conditions)}` : ''}
                      ${call.attitude ? `<br>😊 态度：${'★'.repeat(call.attitude)}${'☆'.repeat(5 - call.attitude)}` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

          </div>
        `;
      });
    }

    html += '</div></div>';

    // Comparison table (if multiple workers)
    if (typeWorkers.length >= 2) {
      html += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">📊 比价对比</div>
          </div>
          <div class="comparison-table-container">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>工人</th>
                  <th>报价</th>
                  <th>来源</th>
                  <th>评分</th>
                  <th>沟通次数</th>
                  <th>已联系</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
      `;

      const minQuote = Math.min(...typeWorkers.filter(w => w.quote > 0).map(w => w.quote));

      typeWorkers.forEach(worker => {
        const workerCalls = callRecords.filter(c => c.workerId === worker.id);
        const isLowest = worker.quote > 0 && worker.quote === minQuote;

        html += `
          <tr>
            <td><strong>${escapeHtml(worker.name)}</strong></td>
            <td class="${isLowest ? 'lowest-price' : ''}">${worker.quote ? formatMoney(worker.quote) : '-'}${isLowest ? ' 👑' : ''}</td>
            <td>${escapeHtml(worker.source || '-')}</td>
            <td style="color: var(--accent-amber);">${'★'.repeat(worker.rating || 0)}${'☆'.repeat(5 - (worker.rating || 0))}</td>
            <td>${workerCalls.length}</td>
            <td>${worker.contacted ? '<span class="tag tag-teal">✅ 已联系</span>' : '<span class="tag">未联系</span>'}</td>
            <td>${worker.selected ? '<span class="tag tag-green">已选定</span>' : '<span class="tag tag-blue">待定</span>'}</td>
          </tr>
        `;
      });

      html += '</tbody></table></div></div>';
    }

    container.innerHTML = html;
  }

  window.openAddWorkerModal = function (typeId) {
    currentEditingWorkerId = null;
    document.getElementById('worker-name').value = '';
    document.getElementById('worker-phone').value = '';
    document.getElementById('worker-source').value = '';
    document.getElementById('worker-quote').value = '';
    document.getElementById('worker-notes').value = '';
    resetStarRating('worker-rating');
    // Store typeId for saving
    document.getElementById('modal-add-worker').dataset.typeId = typeId;
    openModal('modal-add-worker');
  };

  function saveWorker() {
    const typeId = document.getElementById('modal-add-worker').dataset.typeId;
    const name = document.getElementById('worker-name').value.trim();
    const phone = document.getElementById('worker-phone').value.trim();
    const source = document.getElementById('worker-source').value.trim();
    const quote = Number(document.getElementById('worker-quote').value) || 0;
    const notes = document.getElementById('worker-notes').value.trim();
    const rating = Number(document.getElementById('worker-rating').dataset.rating) || 0;

    if (!name) {
      showToast('请输入工人姓名', 'error');
      return;
    }

    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
    workers.push({
      id: generateId(),
      typeId,
      name,
      phone,
      source,
      quote,
      notes,
      rating,
      selected: false,
    });
    StorageUtil.set(STORAGE_KEYS.WORKERS, workers);
    closeModal('modal-add-worker');
    renderWorkersPage();
    showToast(`工人「${name}」已添加`);
  }

  window.toggleWorkerSelected = function (workerId) {
    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      worker.selected = !worker.selected;
      StorageUtil.set(STORAGE_KEYS.WORKERS, workers);
      renderWorkerDetailPanel(currentWorkerType);
      showToast(worker.selected ? `已选定「${worker.name}」` : `已取消选定「${worker.name}」`);
    }
  };

  window.toggleWorkerContacted = function (workerId, value) {
    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      worker.contacted = value;
      StorageUtil.set(STORAGE_KEYS.WORKERS, workers);
      // Update label text/class without full re-render to avoid losing focus
      const card = document.querySelector(`input[onchange*="'${workerId}'"]`);
      if (card) {
        const label = card.nextElementSibling;
        if (label) {
          label.textContent = value ? '✅ 已联系' : '📵 未联系';
          label.className = 'contacted-label ' + (value ? 'contacted-yes' : 'contacted-no');
        }
        const entry = card.closest('.worker-entry');
        if (entry) entry.classList.toggle('worker-contacted', value);
      }
      showToast(value ? `已标记「${worker.name}」为已联系` : `已取消「${worker.name}」联系标记`);
    }
  };

  window.saveWorkerField = function (workerId, field, value) {
    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    if (field === 'quote') {
      worker[field] = Number(value) || 0;
    } else {
      worker[field] = value;
    }
    StorageUtil.set(STORAGE_KEYS.WORKERS, workers);
    // Re-render to reflect changes (e.g. quote formatting, comparison table)
    renderWorkerDetailPanel(currentWorkerType);
    renderWorkerTypeList();
  };

  window.saveWorkerStarRating = function (workerId, rating, clickedStar) {
    // Update visual
    const container = clickedStar.parentElement;
    container.querySelectorAll('.inline-star').forEach((s, i) => {
      s.classList.toggle('active', i < rating);
    });
    // Save
    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      worker.rating = rating;
      StorageUtil.set(STORAGE_KEYS.WORKERS, workers);
    }
  };

  window.deleteWorker = function (workerId) {
    const deleteAction = () => {
      const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []).filter(worker => worker.id !== workerId);
      const calls = StorageUtil.get(STORAGE_KEYS.CALL_RECORDS, []).filter(call => call.workerId !== workerId);
      if (!StorageUtil.set(STORAGE_KEYS.WORKERS, workers) || !StorageUtil.set(STORAGE_KEYS.CALL_RECORDS, calls)) {
        showToast('删除失败，请稍后重试', 'error');
        return;
      }
      renderWorkersPage();
      showToast('工人信息已删除');
    };
    if (!openMobileConfirm('删除工人信息', '相关沟通记录也会一起删除，且无法恢复。', '确认删除', deleteAction) && confirm('确定要删除这个工人的信息吗？相关沟通记录也会一起删除。')) {
      deleteAction();
    }
  };

  // Call Records
  window.openAddCallModal = function (workerId) {
    document.getElementById('call-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('call-content').value = '';
    document.getElementById('call-quote').value = '';
    document.getElementById('call-conditions').value = '';
    resetStarRating('call-attitude');
    document.getElementById('modal-add-call').dataset.workerId = workerId;
    openModal('modal-add-call');
  };

  function saveCallRecord() {
    const workerId = document.getElementById('modal-add-call').dataset.workerId;
    const date = document.getElementById('call-date').value;
    const content = document.getElementById('call-content').value.trim();
    const quote = Number(document.getElementById('call-quote').value) || 0;
    const conditions = document.getElementById('call-conditions').value.trim();
    const attitude = Number(document.getElementById('call-attitude').dataset.rating) || 0;

    if (!content) {
      showToast('请输入沟通内容', 'error');
      return;
    }

    const calls = StorageUtil.get(STORAGE_KEYS.CALL_RECORDS, []);
    calls.push({
      id: generateId(),
      workerId,
      date,
      content,
      quote,
      conditions,
      attitude,
    });
    StorageUtil.set(STORAGE_KEYS.CALL_RECORDS, calls);

    // Update worker's latest quote if provided
    if (quote > 0) {
      const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
      const worker = workers.find(w => w.id === workerId);
      if (worker) {
        worker.quote = quote;
        StorageUtil.set(STORAGE_KEYS.WORKERS, workers);
      }
    }

    closeModal('modal-add-call');
    renderWorkerDetailPanel(currentWorkerType);
    showToast('沟通记录已保存');
  }

  window.deleteCallRecord = function (callId) {
    let calls = StorageUtil.get(STORAGE_KEYS.CALL_RECORDS, []);
    calls = calls.filter(c => c.id !== callId);
    StorageUtil.set(STORAGE_KEYS.CALL_RECORDS, calls);
    renderWorkerDetailPanel(currentWorkerType);
    showToast('沟通记录已删除');
  };

  // ======================================================
  //                    EXPORT / IMPORT
  // ======================================================
  function initExportImport() {
    document.getElementById('btn-backup-data').addEventListener('click', exportData);
    document.getElementById('btn-banner-backup').addEventListener('click', exportData);
    document.getElementById('btn-reminder-backup').addEventListener('click', exportData);
    document.getElementById('btn-import-data').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', importData);
  }

  function initDataSafety() {
    const host = document.getElementById('official-site-host');
    if (host) host.textContent = location.host || '本地预览地址';

    document.getElementById('btn-clear-data').addEventListener('click', () => {
      openModal('modal-clear-data');
    });

    document.getElementById('btn-backup-before-clear').addEventListener('click', () => {
      exportData();
      showToast('备份已开始下载，请确认文件保存后再清除', 'info');
    });

    document.getElementById('btn-confirm-clear').addEventListener('click', () => {
      StorageUtil.clearAll();
      resetUiAfterDataClear();
      closeModal('modal-clear-data');
      renderCurrentPage();
      showToast('当前浏览器中的装修数据已全部清除', 'info');
    });

    document.getElementById('btn-dismiss-backup-reminder').addEventListener('click', () => {
      StorageUtil.dismissBackupReminder();
      document.getElementById('backup-reminder').hidden = true;
      showToast('将在30天后再次提醒', 'info');
    });

    const reminder = document.getElementById('backup-reminder');
    if (reminder && StorageUtil.needsBackupReminder()) reminder.hidden = false;
  }

  function resetUiAfterDataClear() {
    currentWorkerType = null;
    currentEditingWorkerId = null;
    document.getElementById('house-area').value = '';
    document.getElementById('total-budget-input').value = '';
    const reminder = document.getElementById('backup-reminder');
    if (reminder) reminder.hidden = true;
  }

  function exportData() {
    const data = StorageUtil.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `装修数据备份_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    StorageUtil.markBackupCreated(data.exportedAt);
    const reminder = document.getElementById('backup-reminder');
    if (reminder) reminder.hidden = true;
    showToast('完整备份已下载，请妥善保存');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('导入失败：备份文件不能超过10MB', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);
        const result = StorageUtil.importAll(data);
        StorageUtil.markBackupCreated(data.exportedAt || new Date().toISOString());
        renderCurrentPage();
        const source = result.legacy ? '旧版备份' : `V${result.schemaVersion}备份`;
        showToast(`${source}导入成功，共恢复${result.importedKeys.length}类数据`);
      } catch (err) {
        showToast(`导入失败：${err.message || '文件格式不正确'}`, 'error');
      }
    };
    reader.onerror = function () {
      showToast('导入失败：无法读取备份文件', 'error');
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  }

  // ======================================================
  //                    UTILITIES
  // ======================================================
  function populateStageSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = getStages().map(s =>
      `<option value="${s.id}">${s.icon} ${s.name}</option>`
    ).join('');
  }

  function resetStarRating(containerId) {
    const container = document.getElementById(containerId);
    container.dataset.rating = '0';
    container.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
