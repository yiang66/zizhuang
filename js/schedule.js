// 装修小白自装助手 — 排期日历模块 (js/schedule.js)

(function () {
  // Constants & Data
  const TASK_COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b', '#f97316', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];

  const SCHEDULE_TEMPLATES = {
    full: [
      { name: '拆旧清理', workDays: 3, isNoisy: true, needsAcceptance: false, color: '#f97316' },
      { name: '水电改造', workDays: 8, isNoisy: true, needsAcceptance: true, color: '#3b82f6' },
      { name: '防水工程', workDays: 3, isNoisy: false, needsAcceptance: true, color: '#14b8a6' },
      { name: '泥瓦工程', workDays: 15, isNoisy: false, needsAcceptance: true, color: '#8b5cf6' },
      { name: '木工工程', workDays: 10, isNoisy: true, needsAcceptance: false, color: '#ec4899' },
      { name: '油漆工程', workDays: 12, isNoisy: false, needsAcceptance: false, color: '#22c55e' },
      { name: '安装门窗', workDays: 5, isNoisy: true, needsAcceptance: true, color: '#f59e0b' },
      { name: '地板安装', workDays: 4, isNoisy: true, needsAcceptance: true, color: '#06b6d4' },
      { name: '橱柜安装', workDays: 2, isNoisy: false, needsAcceptance: false, color: '#6366f1' },
      { name: '卫浴安装', workDays: 2, isNoisy: false, needsAcceptance: true, color: '#ef4444' },
      { name: '灯具安装', workDays: 2, isNoisy: false, needsAcceptance: false, color: '#8b5cf6' },
      { name: '软装进场', workDays: 5, isNoisy: false, needsAcceptance: false, color: '#ec4899' },
      { name: '保洁收尾', workDays: 2, isNoisy: false, needsAcceptance: false, color: '#22c55e' }
    ],
    hardwork: [
      { name: '拆旧清理', workDays: 3, isNoisy: true, needsAcceptance: false, color: '#f97316' },
      { name: '水电改造', workDays: 8, isNoisy: true, needsAcceptance: true, color: '#3b82f6' },
      { name: '防水工程', workDays: 3, isNoisy: false, needsAcceptance: true, color: '#14b8a6' },
      { name: '泥瓦工程', workDays: 15, isNoisy: false, needsAcceptance: true, color: '#8b5cf6' },
      { name: '木工工程', workDays: 10, isNoisy: true, needsAcceptance: false, color: '#ec4899' },
      { name: '油漆工程', workDays: 12, isNoisy: false, needsAcceptance: false, color: '#22c55e' },
      { name: '安装门窗', workDays: 5, isNoisy: true, needsAcceptance: true, color: '#f59e0b' },
      { name: '地板安装', workDays: 4, isNoisy: true, needsAcceptance: true, color: '#06b6d4' },
      { name: '橱柜安装', workDays: 2, isNoisy: false, needsAcceptance: false, color: '#6366f1' },
      { name: '卫浴安装', workDays: 2, isNoisy: false, needsAcceptance: true, color: '#ef4444' }
    ],
    partial: [
      { name: '拆旧清理', workDays: 3, isNoisy: true, needsAcceptance: false, color: '#f97316' },
      { name: '水电改造', workDays: 8, isNoisy: true, needsAcceptance: true, color: '#3b82f6' },
      { name: '防水工程', workDays: 3, isNoisy: false, needsAcceptance: true, color: '#14b8a6' },
      { name: '泥瓦工程', workDays: 15, isNoisy: false, needsAcceptance: true, color: '#8b5cf6' }
    ]
  };

  const TASK_MATERIALS = {
    '水电改造': ['水管', '电线', '底盒 & 阻燃管'],
    '防水工程': ['防水涂料', '堵漏王'],
    '泥瓦工程': ['瓷砖', '水泥 & 沙子', '地漏'],
    '木工工程': ['石膏板', '轻钢龙骨', '木工板'],
    '油漆工程': ['腻子粉', '乳胶漆', '底漆'],
    '安装门窗': ['入户门', '断桥铝窗户'],
    '地板安装': ['木地板', '防潮垫'],
    '橱柜安装': ['定制橱柜', '石英石台面', '水槽'],
    '卫浴安装': ['马桶 & 花洒', '浴室柜 & 龙头'],
    '灯具安装': ['主灯 & 射灯', '开关面板']
  };

  const ACCEPTANCE_CHECKLISTS = {
    '水电改造': ["管线排布横平竖直", "强弱电交接锡箔防干扰", "打压试验（0.8Mpa 30分钟无掉压）", "线盒穿线平齐且使用接线端子"],
    '防水工程': ["闭水试验蓄水高度不低于20mm", "闭水试验时间满48小时", "楼下天花板无渗漏阴湿", "涂刷层无透底、开裂、起鼓"],
    '泥瓦工程': ["瓷砖表面平整，平整度误差在2mm以内", "墙地砖无空鼓（空鼓率小于5%）", "坡度合理，无倒泛水与积水", "留缝均匀一致，十字卡缝平直"],
    '安装门窗': ["框扇平整，开关顺畅无咬合异响", "密封打胶饱满均匀，无渗水隐患", "五金配件牢固可靠，安装平整"],
    '地板安装': ["表面平整，踩踏无明显响声", "接缝严密，伸缩缝预留合理", "踢脚线安装平整，无缝隙"],
    '卫浴安装': ["打胶密封顺畅，无漏水", "排水管道通畅无堵塞", "冷热水管位置左热右冷"],
    'generic': ["工艺平整度符合要求", "隐蔽工程及主材安装已核实", "现场清理干净，垃圾已带走"]
  };

  const DEFAULT_SETTINGS = {
    satNoWork: true,
    sunNoWork: true,
    weekendAllowQuiet: false,
    autoMaterial: true,
    autoAcceptance: true
  };

  // State
  let calCurrentYear, calCurrentMonth, calSelectedDate;

  // Initialize State
  const today = new Date();
  calCurrentYear = today.getFullYear();
  calCurrentMonth = today.getMonth() + 1;
  calSelectedDate = dateToStr(today);

  // Storage wrappers
  function getScheduleTasks() { return StorageUtil.get(STORAGE_KEYS.SCHEDULE_TASKS, []); }
  function saveScheduleTasks(tasks) { StorageUtil.set(STORAGE_KEYS.SCHEDULE_TASKS, tasks); }
  function getNoWorkDays() { return StorageUtil.get(STORAGE_KEYS.NO_WORK_DAYS, []); }
  function saveNoWorkDays(days) { StorageUtil.set(STORAGE_KEYS.NO_WORK_DAYS, days); }
  function getDailyLogs() { return StorageUtil.get(STORAGE_KEYS.DAILY_LOGS, []); }
  function saveDailyLogs(logs) { StorageUtil.set(STORAGE_KEYS.DAILY_LOGS, logs); }
  function getMaterialReminders() { return StorageUtil.get(STORAGE_KEYS.MATERIAL_REMINDERS, []); }
  function saveMaterialReminders(mats) { StorageUtil.set(STORAGE_KEYS.MATERIAL_REMINDERS, mats); }
  function getAcceptanceNodes() { return StorageUtil.get(STORAGE_KEYS.ACCEPTANCE_NODES, []); }
  function saveAcceptanceNodes(nodes) { StorageUtil.set(STORAGE_KEYS.ACCEPTANCE_NODES, nodes); }
  function getIssueRecords() { return StorageUtil.get(STORAGE_KEYS.ISSUE_RECORDS, []); }
  function saveIssueRecords(issues) { StorageUtil.set(STORAGE_KEYS.ISSUE_RECORDS, issues); }
  function getScheduleSettings() { return Object.assign({}, DEFAULT_SETTINGS, StorageUtil.get(STORAGE_KEYS.SCHEDULE_SETTINGS, {})); }
  function saveScheduleSettings(settings) { StorageUtil.set(STORAGE_KEYS.SCHEDULE_SETTINGS, settings); }

  // Date Utilities
  function strToDate(str) {
    if (!str) return new Date();
    const parts = str.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function dateToStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${r}`;
  }

  function addDays(dateStr, n) {
    const d = strToDate(dateStr);
    d.setDate(d.getDate() + n);
    return dateToStr(d);
  }

  function getWeekdayName(dateStr) {
    const d = strToDate(dateStr);
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return names[d.getDay()];
  }

  function getTodayStr() {
    return dateToStr(new Date());
  }

  function isWeekendNoWork(dateStr, settings) {
    const d = strToDate(dateStr);
    const day = d.getDay();
    if (day === 6 && settings.satNoWork) return true;
    if (day === 0 && settings.sunNoWork) return true;
    return false;
  }

  function isNoWorkDay(dateStr, noWorkDays, settings) {
    const customNwd = noWorkDays.find(n => n.date === dateStr);
    if (customNwd) return true;
    return isWeekendNoWork(dateStr, settings);
  }

  function canWorkOnDay(dateStr, isNoisy, noWorkDays, settings) {
    const customNwd = noWorkDays.find(n => n.date === dateStr);
    if (customNwd) {
      if (!isNoisy && customNwd.allowQuiet) return true;
      return false;
    }
    const d = strToDate(dateStr);
    const day = d.getDay();
    const isSat = day === 6;
    const isSun = day === 0;
    if ((isSat && settings.satNoWork) || (isSun && settings.sunNoWork)) {
      if (!isNoisy && settings.weekendAllowQuiet) return true;
      return false;
    }
    return true;
  }

  function calcEndDate(startDate, workDays, noWorkDays, settings, isNoisy = false) {
    let currentDateStr = startDate;
    let remainingWorkDays = workDays;
    let isFirst = true;
    while (remainingWorkDays > 0) {
      if (!isFirst) {
        currentDateStr = addDays(currentDateStr, 1);
      }
      isFirst = false;
      if (canWorkOnDay(currentDateStr, isNoisy, noWorkDays, settings)) {
        remainingWorkDays--;
      }
    }
    return currentDateStr;
  }

  function calcNextStartDate(prevEndDate, noWorkDays, settings, isNoisy = false) {
    let nextDateStr = addDays(prevEndDate, 1);
    while (!canWorkOnDay(nextDateStr, isNoisy, noWorkDays, settings)) {
      nextDateStr = addDays(nextDateStr, 1);
    }
    return nextDateStr;
  }

  function calcPrevWorkDate(startDate, daysBefore, noWorkDays, settings) {
    let currentDateStr = startDate;
    let remainingDays = daysBefore;
    while (remainingDays > 0) {
      currentDateStr = addDays(currentDateStr, -1);
      if (canWorkOnDay(currentDateStr, false, noWorkDays, settings)) {
        remainingDays--;
      }
    }
    return currentDateStr;
  }

  // Helpers for view styles
  function getStatusColor(status) {
    switch (status) {
      case 'not-started': return '#94a3b8';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#22c55e';
      case 'delayed': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'not-started': return '未开始';
      case 'in-progress': return '施工中';
      case 'completed': return '已完工';
      case 'delayed': return '异常延期';
      default: return '未开始';
    }
  }

  function getMatStatusColor(status) {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'purchased': return '#60a5fa';
      case 'shipping': return '#f59e0b';
      case 'arrived': return '#22c55e';
      case 'issue': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  function getMatStatusText(status) {
    switch (status) {
      case 'pending': return '待购买';
      case 'purchased': return '已购买';
      case 'shipping': return '运输中';
      case 'arrived': return '已到场';
      case 'issue': return '异常';
      default: return '待购买';
    }
  }

  function getAccResultColor(result) {
    switch (result) {
      case 'not-checked': return '#94a3b8';
      case 'passed': return '#22c55e';
      case 'failed': return '#ef4444';
      case 'conditional': return '#fbbf24';
      default: return '#94a3b8';
    }
  }

  function getAccResultText(result) {
    switch (result) {
      case 'not-checked': return '未验收';
      case 'passed': return '通过 ✅';
      case 'failed': return '未通过 ❌';
      case 'conditional': return '有条件通过 ⚡';
      default: return '未验收';
    }
  }

  function getIssueStatusColor(status) {
    switch (status) {
      case 'pending': return '#ef4444';
      case 'processing': return '#fbbf24';
      case 'resolved': return '#22c55e';
      default: return '#94a3b8';
    }
  }

  function getIssueStatusText(status) {
    switch (status) {
      case 'pending': return '待处理';
      case 'processing': return '处理中';
      case 'resolved': return '已解决';
      default: return '待处理';
    }
  }

  function getNoWorkDaysCountInMonth(year, month, noWorkDays, settings) {
    let count = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      if (isNoWorkDay(dateStr, noWorkDays, settings)) {
        count++;
      }
    }
    return count;
  }

  // Get Calendar Days array
  function getMonthCalDays(year, month) {
    const cells = [];
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const currentMonthDays = new Date(year, month, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 1 ? 12 : month - 1;
      const y = month === 1 ? year - 1 : year;
      cells.push({
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= currentMonthDays; i++) {
      cells.push({
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        isCurrentMonth: true
      });
    }

    const totalCells = cells.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const m = month === 12 ? 1 : month + 1;
      const y = month === 12 ? year + 1 : year;
      cells.push({
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        isCurrentMonth: false
      });
    }
    return cells;
  }

  // Sequential shift of not-started tasks, preserving manual start date gaps
  function adjustScheduleAfterNoWorkDaysChange() {
    const tasks = getScheduleTasks();
    if (tasks.length === 0) return;

    const settings = getScheduleSettings();
    const noWorkDays = getNoWorkDays();

    // Sort tasks by current startDate
    tasks.sort((a, b) => a.startDate.localeCompare(b.startDate));

    let prevEndDate = null;
    tasks.forEach((t) => {
      if (t.status === 'not-started') {
        if (prevEndDate) {
          const earliestStart = calcNextStartDate(prevEndDate, noWorkDays, settings, t.isNoisy);
          // If current startDate is earlier than earliestStart, push it forward to earliestStart
          if (t.startDate < earliestStart) {
            t.startDate = earliestStart;
          } else {
            // Otherwise, keep the current startDate but make sure it starts on a valid working day
            while (!canWorkOnDay(t.startDate, t.isNoisy, noWorkDays, settings)) {
              t.startDate = addDays(t.startDate, 1);
            }
          }
        } else {
          // For the first task in the list, just make sure it starts on a working day
          while (!canWorkOnDay(t.startDate, t.isNoisy, noWorkDays, settings)) {
            t.startDate = addDays(t.startDate, 1);
          }
        }
        t.endDate = calcEndDate(t.startDate, t.estimatedWorkDays, noWorkDays, settings, t.isNoisy);
        t.updatedAt = new Date().toISOString();

        // Sync material reminders
        const materials = getMaterialReminders();
        const taskMats = materials.filter(m => m.relatedTaskId === t.id);
        taskMats.forEach(m => {
          m.remindDate = calcPrevWorkDate(t.startDate, 5, noWorkDays, settings);
          m.expectedArrivalDate = t.startDate;
          m.updatedAt = new Date().toISOString();
        });
        saveMaterialReminders(materials);

        // Sync acceptance node
        const acceptances = getAcceptanceNodes();
        const acc = acceptances.find(a => a.relatedTaskId === t.id);
        if (acc) {
          acc.date = t.endDate;
          acc.updatedAt = new Date().toISOString();
        }
        saveAcceptanceNodes(acceptances);
      }
      prevEndDate = t.endDate;
    });
    saveScheduleTasks(tasks);
  }

  // Page Rendering Entry Point
  window.renderCalendarPage = function () {
    const tasks = getScheduleTasks();
    const container = document.getElementById('page-calendar');
    if (!container) return;

    // 确保遮罩层存在（仅创建一次）
    if (!document.getElementById('cal-panel-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'cal-panel-overlay';
      overlay.className = 'cal-panel-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.addEventListener('click', () => window.closeDayPanel());
      container.appendChild(overlay);
    }

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="cal-empty-state">
          <div class="cal-empty-icon">📅</div>
          <div class="cal-empty-title">你的装修排期还空空如也</div>
          <div class="cal-empty-desc">自装助手支持根据开工日期，一键自动计算并生成「硬装+主材安装」排期，同时自动计算并避开周末与禁装日。你也可以手动添加自己的第一条工序。</div>
          <div class="cal-empty-actions">
            <button class="btn btn-primary" onclick="openGenerateModal()">📊 一键生成排期</button>
            <button class="btn btn-secondary" onclick="openTaskModal()">＋ 手动新增工序</button>
            <button class="btn btn-secondary" onclick="openNoWorkDayModal()">🚫 设禁装日</button>
          </div>
        </div>
      `;
      return;
    }

    // 判断是否为移动端（用于按钮文字简化）
    const isMobile = window.innerWidth <= 600;

    // Load full layout if tasks exist
    container.innerHTML = `
      <div class="cal-stats-grid" id="cal-stats-grid"></div>
      
      <div class="cal-layout">
        <div class="cal-left">
          <div class="cal-controls">
            <div class="cal-nav-group">
              <button class="btn btn-secondary btn-sm" onclick="changeMonth(-1)" type="button" aria-label="上个月">◀</button>
              <button class="btn btn-secondary btn-sm" onclick="goToday()" type="button">今天</button>
              <button class="btn btn-secondary btn-sm" onclick="changeMonth(1)" type="button" aria-label="下个月">▶</button>
              <span class="cal-month-title" id="cal-month-title"></span>
            </div>
            <div class="cal-action-group">
              <button class="btn btn-primary btn-sm" onclick="openGenerateModal()" type="button">${isMobile ? '📊 排期设置' : '📊 生成/设置排期'}</button>
              <button class="btn btn-secondary btn-sm" onclick="openTaskModal()" type="button">${isMobile ? '＋ 工序' : '＋ 新增工序'}</button>
              <button class="btn btn-secondary btn-sm" onclick="openNoWorkDayModal()" type="button">${isMobile ? '🚫 禁装日' : '🚫 设禁装日'}</button>
            </div>
          </div>
          <div class="cal-weekday-headers">
            <div class="cal-weekend-header">日</div>
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div class="cal-weekend-header">六</div>
          </div>
          <div class="cal-grid" id="calendar-grid"></div>
          <div class="cal-legend">
            <span class="cal-legend-item"><span class="legend-color-dot" style="background:#6366f1"></span>工序进行中</span>
            <span class="cal-legend-item">🔔 材料提醒</span>
            <span class="cal-legend-item">✅ 验收节点</span>
            <span class="cal-legend-item">⚠️ 现场问题</span>
            <span class="cal-legend-item">📝 施工日志</span>
          </div>
          <div class="cal-notice">⚠️ 禁装日仅供参考，请以当地当年通告和小区物业规定为准。</div>
        </div>
        
        <div class="day-panel" id="cal-day-panel"></div>
      </div>
    `;

    renderStats();
    renderCalendarGrid();
    selectCalendarDay(calSelectedDate || getTodayStr());
    // 绑定底部面板触摸手势（移动端）
    initPanelSwipeClose();
  };

  function refreshCalendarView() {
    renderCalendarPage();
  }
  window.refreshCalendarView = refreshCalendarView;

  // Stats Card Renderer
  function renderStats() {
    const tasks = getScheduleTasks();
    const noWorkDays = getNoWorkDays();
    const settings = getScheduleSettings();
    const materials = getMaterialReminders();
    const acceptances = getAcceptanceNodes();
    const issues = getIssueRecords();

    // 1. 在建工序
    const activeTasks = tasks.filter(t => t.status === 'in-progress').length;
    // 2. 未解决问题
    const activeIssues = issues.filter(i => i.status !== 'resolved').length;
    // 3. 待购材料
    const pendingMats = materials.filter(m => m.status === 'pending' || m.status === 'shipping').length;
    // 4. 本月禁装日
    const noWorkDaysCount = getNoWorkDaysCountInMonth(calCurrentYear, calCurrentMonth, noWorkDays, settings);
    // 5. 待验收节点
    const pendingAccs = acceptances.filter(a => a.result === 'not-checked').length;

    const statsGrid = document.getElementById('cal-stats-grid');
    if (!statsGrid) return;

    statsGrid.innerHTML = `
      <div class="cal-stat-card">
        <div class="cal-stat-label">施工中工序</div>
        <div class="cal-stat-value">${activeTasks} 项正在施工</div>
      </div>
      <div class="cal-stat-card ${activeIssues > 0 ? 'cal-stat-card--issue' : ''}">
        <div class="cal-stat-label">未解决问题</div>
        <div class="cal-stat-value">${activeIssues} 个施工问题</div>
      </div>
      <div class="cal-stat-card">
        <div class="cal-stat-label">待购/途备料</div>
        <div class="cal-stat-value">${pendingMats} 批材料提醒</div>
      </div>
      <div class="cal-stat-card">
        <div class="cal-stat-label">本月禁装日</div>
        <div class="cal-stat-value">${noWorkDaysCount} 天停工/限噪</div>
      </div>
      <div class="cal-stat-card ${pendingAccs > 0 ? 'cal-stat-card--warn' : ''}">
        <div class="cal-stat-label">待验收节点</div>
        <div class="cal-stat-value">${pendingAccs} 个待验收</div>
      </div>
    `;
  }

  // Calendar Grid Renderer
  function renderCalendarGrid() {
    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) {
      titleEl.textContent = `${calCurrentYear}年${calCurrentMonth}月`;
    }

    const gridEl = document.getElementById('calendar-grid');
    if (!gridEl) return;

    const cells = getMonthCalDays(calCurrentYear, calCurrentMonth);
    const tasks = getScheduleTasks();
    const noWorkDays = getNoWorkDays();
    const settings = getScheduleSettings();
    const materials = getMaterialReminders();
    const acceptances = getAcceptanceNodes();
    const issues = getIssueRecords();
    const logs = getDailyLogs();
    const todayStr = getTodayStr();

    gridEl.innerHTML = cells.map(cell => {
      const isSelected = cell.dateStr === calSelectedDate;
      const isToday = cell.dateStr === todayStr;
      const isNwd = isNoWorkDay(cell.dateStr, noWorkDays, settings);
      const customNwd = noWorkDays.find(n => n.date === cell.dateStr);

      let dayClasses = ['cal-day'];
      if (!cell.isCurrentMonth) dayClasses.push('cal-day--other-month');
      if (isToday) dayClasses.push('cal-day--today');
      if (isNwd) dayClasses.push('cal-day--nowork');
      if (isSelected) dayClasses.push('cal-day--selected');

      // Find tasks active on this day
      const dayTasks = tasks.filter(t => t.startDate <= cell.dateStr && t.endDate >= cell.dateStr);

      // Badges
      const hasMat = materials.some(m => m.remindDate === cell.dateStr || m.expectedArrivalDate === cell.dateStr);
      const hasAcc = acceptances.some(a => a.date === cell.dateStr);
      const hasIssue = issues.some(i => i.date === cell.dateStr && i.status !== 'resolved');
      const hasLog = logs.some(l => l.date === cell.dateStr);

      // Label for no-work day
      let nwdLabelHtml = '';
      if (customNwd) {
        nwdLabelHtml = `<div class="cal-nowork-label" title="${customNwd.reason}">🚫 ${customNwd.reason}</div>`;
      } else if (isNwd) {
        nwdLabelHtml = `<div class="cal-nowork-label">🚫 周末禁装</div>`;
      }

      // Render up to 3 task tags
      const taskTagsHtml = dayTasks.slice(0, 3).map(t => {
        let tagClass = 'cal-task-tag';
        if (t.status === 'completed') tagClass += ' cal-task-tag--completed';
        if (t.status === 'delayed') tagClass += ' cal-task-tag--delayed';
        return `
          <div class="${tagClass}" style="background: rgba(${hexToRgb(t.color)}, 0.15); border-color: ${t.color}; color: ${t.color}" title="${t.name}">
            ${t.name}
          </div>
        `;
      }).join('');

      const moreTasksHtml = dayTasks.length > 3 ? `<div class="cal-more">＋还有 ${dayTasks.length - 3} 项</div>` : '';

      // Badges row
      let badgesHtml = '';
      if (hasMat || hasAcc || hasIssue || hasLog) {
        badgesHtml = `
          <div class="cal-badges">
            ${hasMat ? '<span class="cal-badge" title="材料提醒">🔔</span>' : ''}
            ${hasAcc ? '<span class="cal-badge" title="验收节点">✅</span>' : ''}
            ${hasIssue ? '<span class="cal-badge" title="现场问题">⚠️</span>' : ''}
            ${hasLog ? '<span class="cal-badge" title="施工日志">📝</span>' : ''}
          </div>
        `;
      }

      return `
        <div class="${dayClasses.join(' ')}" onclick="selectCalendarDay('${cell.dateStr}')">
          <div class="cal-day-num">
            ${isToday ? `<span class="cal-today-badge">今</span>` : cell.dayNum}
          </div>
          ${nwdLabelHtml}
          ${taskTagsHtml}
          ${moreTasksHtml}
          ${badgesHtml}
        </div>
      `;
    }).join('');
  }

  // Select a day cell
  window.selectCalendarDay = function (dateStr) {
    calSelectedDate = dateStr;

    // Redraw grid selected state
    const gridEl = document.getElementById('calendar-grid');
    if (gridEl) {
      const cells = gridEl.querySelectorAll('.cal-day');
      const cellsData = getMonthCalDays(calCurrentYear, calCurrentMonth);
      cells.forEach((cellEl, idx) => {
        const cellData = cellsData[idx];
        if (cellData) {
          const isSelected = cellData.dateStr === calSelectedDate;
          cellEl.classList.toggle('cal-day--selected', isSelected);
        }
      });
    }

    renderDayPanel(dateStr);
  };

  // Day Detail Panel Renderer
  function renderDayPanel(dateStr) {
    const panel = document.getElementById('cal-day-panel');
    if (!panel) return;

    const noWorkDays = getNoWorkDays();
    const settings = getScheduleSettings();
    const tasks = getScheduleTasks();
    const materials = getMaterialReminders();
    const acceptances = getAcceptanceNodes();
    const issues = getIssueRecords();
    const logs = getDailyLogs();

    const isNwd = isNoWorkDay(dateStr, noWorkDays, settings);
    const customNwd = noWorkDays.find(n => n.date === dateStr);

    let nwdReason = '';
    let nwdTypeStr = '';
    let nwdAllowQuiet = false;
    let nwdNote = '';
    if (customNwd) {
      nwdReason = customNwd.reason;
      nwdAllowQuiet = customNwd.allowQuiet;
      nwdNote = customNwd.note;
      const typeMap = { weekend: '周末', holiday: '法定节假日', exam: '中高考禁噪', property: '物业通知', custom: '用户自定义' };
      nwdTypeStr = typeMap[customNwd.type] || '自定义';
    } else if (isNwd) {
      nwdReason = '周末禁装';
      nwdAllowQuiet = settings.weekendAllowQuiet;
      nwdTypeStr = '周末';
    }

    // Get items active on this day
    const dayTasks = tasks.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);
    const dayMats = materials.filter(m => m.remindDate === dateStr || m.expectedArrivalDate === dateStr);
    const dayAccs = acceptances.filter(a => a.date === dateStr);
    const dayIssues = issues.filter(i => i.date === dateStr);
    const dayLog = logs.find(l => l.date === dateStr);

    // Build panel sections
    let html = `
      <div class="day-panel-drag-handle" aria-hidden="true"></div>
      <div class="day-panel-header">
        <div>
          <div class="day-panel-date">${dateStr} (${getWeekdayName(dateStr)})</div>
          ${isNwd ? `<div class="day-panel-nowork-badge">🚫 禁装日: ${nwdReason}</div>` : ''}
        </div>
        <button class="modal-close" onclick="closeDayPanel()" type="button" aria-label="关闭面板">✕</button>
      </div>
      
      <div class="day-panel-body">
    `;

    // 1. 禁装日信息
    if (isNwd) {
      html += `
        <div class="day-panel-section">
          <div class="day-panel-section-header">
            <span class="day-panel-section-title">🚫 禁装日信息</span>
            ${customNwd ? `<button class="btn btn-secondary btn-xs" onclick="openNoWorkDayModal('${dateStr}', '${customNwd.id}')">编辑</button>` : ''}
          </div>
          <div class="day-panel-nowork-card">
            <strong>禁装类型：</strong>${nwdTypeStr}<br>
            <strong>禁装原因：</strong>${nwdReason}<br>
            <strong>低噪施工：</strong>${nwdAllowQuiet ? '<span style="color:#22c55e">允许（量尺/验收/低噪准备等）</span>' : '<span style="color:#ef4444">严禁施工</span>'}<br>
            ${nwdNote ? `<strong>备注：</strong>${nwdNote}` : ''}
          </div>
          ${customNwd ? `
            <div style="margin-top:6px;display:flex;justify-content:flex-end;">
              <button class="btn btn-danger btn-xs" onclick="deleteNoWorkDay('${customNwd.id}')">撤销该禁装日</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 2. 工序列表
    html += `
      <div class="day-panel-section">
        <div class="day-panel-section-header">
          <span class="day-panel-section-title">📋 施工工序 (${dayTasks.length})</span>
        </div>
    `;
    if (dayTasks.length === 0) {
      html += `<div class="day-panel-empty">今天没有正在进行的工序。</div>`;
    } else {
      dayTasks.forEach(task => {
        html += `
          <div class="day-task-card" style="border-left-color: ${task.color}">
            <div class="day-task-header">
              <span class="day-task-name">${task.name}</span>
              <span class="day-task-status" style="color: ${getStatusColor(task.status)}">${getStatusText(task.status)}</span>
            </div>
            <div class="day-task-meta">⏱️ 工期：${task.startDate} 至 ${task.endDate} (${task.estimatedWorkDays}工作日)</div>
            ${task.workerName ? `<div class="day-task-meta">👷 工人师傅：${task.workerName}</div>` : ''}
            ${task.area ? `<div class="day-task-meta">📍 施工区域：${task.area}</div>` : ''}
            ${task.content ? `<div class="day-task-meta">📝 简述：${task.content}</div>` : ''}
            ${task.note ? `<div class="day-task-meta">ℹ️ 备注：${task.note}</div>` : ''}
            <div class="day-task-actions">
              <select class="form-select task-status-select" onchange="updateTaskStatus('${task.id}', this.value)" aria-label="更新工序状态">
                <option value="not-started" ${task.status === 'not-started' ? 'selected' : ''}>未开始</option>
                <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>施工中</option>
                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>已完工</option>
                <option value="delayed" ${task.status === 'delayed' ? 'selected' : ''}>异常延期</option>
              </select>
              <button class="btn btn-secondary btn-xs" onclick="openTaskModal('${task.id}')">编辑</button>
              <button class="btn btn-danger btn-xs" onclick="deleteTask('${task.id}')">删除</button>
            </div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // 3. 工人信息
    html += `
      <div class="day-panel-section">
        <div class="day-panel-section-title">👷 到场工人</div>
    `;
    const workersWithTasks = dayTasks.filter(t => t.workerName);
    if (workersWithTasks.length === 0) {
      html += `<div class="day-panel-empty">今天没有关联的施工工人。</div>`;
    } else {
      // Find worker phones from WORKERS storage if matching by name
      const workersList = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
      workersWithTasks.forEach(t => {
        const matched = workersList.find(w => w.name === t.workerName || w.id === t.workerId);
        const phone = matched ? matched.phone : '';
        html += `
          <div class="day-worker-card">
            <div class="day-worker-name">👷 ${t.workerName}</div>
            ${phone ? `<div class="day-worker-meta">📞 电话：<a href="tel:${phone}" style="color:var(--text-secondary);text-decoration:underline;">${phone}</a></div>` : ''}
            <div class="day-worker-meta">工序：${t.name}</div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // 4. 材料提醒
    html += `
      <div class="day-panel-section">
        <div class="day-panel-section-title">🔔 材料提醒 (${dayMats.length})</div>
    `;
    if (dayMats.length === 0) {
      html += `<div class="day-panel-empty">今天无材料备忘。</div>`;
    } else {
      dayMats.forEach(mat => {
        const isRemindDate = mat.remindDate === dateStr;
        html += `
          <div class="day-material-card">
            <div class="day-material-header">
              <span class="day-material-name">${isRemindDate ? '⚠️ 提醒购买: ' : '🚚 预计到场: '}${mat.name}</span>
              <span class="day-material-status" style="color: ${getMatStatusColor(mat.status)}">${getMatStatusText(mat.status)}</span>
            </div>
            <div class="day-material-meta">提醒备料：${mat.remindDate || '无'}</div>
            <div class="day-material-meta">预计到场：${mat.expectedArrivalDate || '无'}</div>
            ${mat.actualArrivalDate ? `<div class="day-material-meta">实际到场：${mat.actualArrivalDate}</div>` : ''}
            ${mat.note ? `<div class="day-material-meta">备注：${mat.note}</div>` : ''}
            <div class="day-material-actions">
              <select class="form-select task-status-select" onchange="updateMaterialStatus('${mat.id}', this.value)" aria-label="更新材料状态">
                <option value="pending" ${mat.status === 'pending' ? 'selected' : ''}>待购买</option>
                <option value="purchased" ${mat.status === 'purchased' ? 'selected' : ''}>已购买</option>
                <option value="shipping" ${mat.status === 'shipping' ? 'selected' : ''}>运输中</option>
                <option value="arrived" ${mat.status === 'arrived' ? 'selected' : ''}>已到场</option>
                <option value="issue" ${mat.status === 'issue' ? 'selected' : ''}>异常</option>
              </select>
              <button class="btn btn-secondary btn-xs" onclick="openMaterialModal('${dateStr}', '${mat.id}')">编辑</button>
              <button class="btn btn-danger btn-xs" onclick="deleteMaterial('${mat.id}')">删除</button>
            </div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // 5. 验收节点
    html += `
      <div class="day-panel-section">
        <div class="day-panel-section-title">✅ 验收节点 (${dayAccs.length})</div>
    `;
    if (dayAccs.length === 0) {
      html += `<div class="day-panel-empty">今天无待验收节点。</div>`;
    } else {
      dayAccs.forEach(acc => {
        const total = acc.checklist ? acc.checklist.length : 0;
        const passed = acc.checklist ? acc.checklist.filter(item => item.checked).length : 0;
        html += `
          <div class="day-acc-card">
            <div class="day-acc-header">
              <span class="day-acc-name">🔍 ${acc.name}</span>
              <span class="day-acc-result" style="color: ${getAccResultColor(acc.result)}">${getAccResultText(acc.result)}</span>
            </div>
            <div class="day-acc-checklist-progress">自检进度：${passed}/${total}</div>
            ${total > 0 ? `
              <div class="day-acc-checklist">
                ${acc.checklist.map((item, idx) => `
                  <label class="day-acc-item ${item.checked ? 'day-acc-item--done' : ''}">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleAccChecklistItem('${acc.id}', ${idx})">
                    <span>${item.text}</span>
                  </label>
                `).join('')}
              </div>
            ` : ''}
            ${acc.note ? `<div class="day-acc-meta">备注：${acc.note}</div>` : ''}
            <div class="day-acc-actions">
              <select class="form-select task-status-select" onchange="updateAcceptanceResult('${acc.id}', this.value)" aria-label="更新验收状态">
                <option value="not-checked" ${acc.result === 'not-checked' ? 'selected' : ''}>未验收</option>
                <option value="passed" ${acc.result === 'passed' ? 'selected' : ''}>通过</option>
                <option value="failed" ${acc.result === 'failed' ? 'selected' : ''}>不通过</option>
                <option value="conditional" ${acc.result === 'conditional' ? 'selected' : ''}>有条件通过</option>
              </select>
              <button class="btn btn-secondary btn-xs" onclick="openAcceptanceModal('${dateStr}', '${acc.id}')">编辑</button>
              <button class="btn btn-danger btn-xs" onclick="deleteAcceptance('${acc.id}')">删除</button>
            </div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // 6. 施工日志
    html += `
      <div class="day-panel-section">
        <div class="day-panel-section-header">
          <span class="day-panel-section-title">📝 施工日志</span>
          ${dayLog ? `<button class="btn btn-secondary btn-xs" onclick="openLogModal('${dateStr}')">编辑</button>` : ''}
        </div>
    `;
    if (!dayLog) {
      html += `<div class="day-panel-empty">今天暂未记录施工日志。</div>`;
    } else {
      html += `
        <div class="day-log-card">
          ${dayLog.workContent ? `<div class="day-log-item"><strong>今日施工：</strong>${dayLog.workContent}</div>` : ''}
          ${dayLog.workers ? `<div class="day-log-item"><strong>到场工人：</strong>${dayLog.workers}</div>` : ''}
          ${dayLog.materialStatus ? `<div class="day-log-item"><strong>备料到货：</strong>${dayLog.materialStatus}</div>` : ''}
          ${dayLog.issuesText ? `<div class="day-log-item"><strong>发现问题：</strong>${dayLog.issuesText}</div>` : ''}
          ${dayLog.tomorrowPlan ? `<div class="day-log-item"><strong>明日计划：</strong>${dayLog.tomorrowPlan}</div>` : ''}
          ${dayLog.note ? `<div class="day-log-item"><strong>备注：</strong>${dayLog.note}</div>` : ''}
        </div>
      `;
    }
    html += `</div>`;

    // 7. 问题记录
    html += `
      <div class="day-panel-section">
        <div class="day-panel-section-title">⚠️ 问题记录 (${dayIssues.length})</div>
    `;
    if (dayIssues.length === 0) {
      html += `<div class="day-panel-empty">今天无现场异常问题记录。</div>`;
    } else {
      dayIssues.forEach(iss => {
        html += `
          <div class="day-issue-card ${iss.status === 'resolved' ? 'day-issue-card--resolved' : ''}">
            <div class="day-issue-header">
              <span class="day-issue-desc">${iss.description}</span>
              <span class="day-issue-status" style="color: ${getIssueStatusColor(iss.status)}">${getIssueStatusText(iss.status)}</span>
            </div>
            ${iss.responsiblePerson ? `<div class="day-issue-meta">责任人：${iss.responsiblePerson}</div>` : ''}
            ${iss.deadline ? `<div class="day-issue-meta">整改限期：${iss.deadline}</div>` : ''}
            ${iss.note ? `<div class="day-issue-meta">进展/备注：${iss.note}</div>` : ''}
            <div class="day-issue-actions">
              <select class="form-select task-status-select" onchange="updateIssueStatus('${iss.id}', this.value)" aria-label="更新问题状态">
                <option value="pending" ${iss.status === 'pending' ? 'selected' : ''}>待处理</option>
                <option value="processing" ${iss.status === 'processing' ? 'selected' : ''}>处理中</option>
                <option value="resolved" ${iss.status === 'resolved' ? 'selected' : ''}>已解决</option>
              </select>
              <button class="btn btn-secondary btn-xs" onclick="openIssueModal('${dateStr}', '${iss.id}')">编辑</button>
              <button class="btn btn-danger btn-xs" onclick="deleteIssue('${iss.id}')">删除</button>
            </div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // Close body & Add Footer
    html += `
      </div>
      <div class="day-panel-footer">
        ${!dayLog ? `<button class="btn btn-secondary btn-sm" onclick="openLogModal('${dateStr}')" type="button">＋ 记日志</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="openMaterialModal('${dateStr}')" type="button">＋ 备料提醒</button>
        <button class="btn btn-secondary btn-sm" onclick="openAcceptanceModal('${dateStr}')" type="button">＋ 设验收点</button>
        <button class="btn btn-secondary btn-sm" onclick="openIssueModal('${dateStr}')" type="button">＋ 记现场问题</button>
      </div>
    `;

    panel.innerHTML = html;
    panel.classList.add('day-panel--open');

    // 移动端：显示遮罩
    if (window.innerWidth <= 900) {
      const overlay = document.getElementById('cal-panel-overlay');
      if (overlay) {
        overlay.style.display = 'block';
        // 触发回流后再加 active 类以产生过渡动画
        requestAnimationFrame(() => overlay.classList.add('active'));
      }
    }
  }

  window.closeDayPanel = function () {
    const panel = document.getElementById('cal-day-panel');
    if (panel) panel.classList.remove('day-panel--open');

    // 移动端：隐藏遮罩
    const overlay = document.getElementById('cal-panel-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => { overlay.style.display = ''; }, 260);
    }

    calSelectedDate = '';
    // Remove highlights
    const gridEl = document.getElementById('calendar-grid');
    if (gridEl) {
      gridEl.querySelectorAll('.cal-day').forEach(el => el.classList.remove('cal-day--selected'));
    }
  };

  // Month navigation
  window.changeMonth = function (dir) {
    calCurrentMonth += dir;
    if (calCurrentMonth > 12) {
      calCurrentMonth = 1;
      calCurrentYear++;
    } else if (calCurrentMonth < 1) {
      calCurrentMonth = 12;
      calCurrentYear--;
    }
    refreshCalendarView();
  };

  window.goToday = function () {
    const today = new Date();
    calCurrentYear = today.getFullYear();
    calCurrentMonth = today.getMonth() + 1;
    calSelectedDate = dateToStr(today);
    refreshCalendarView();
  };

  // Generate / Settings Schedule Modal
  window.openGenerateModal = function () {
    const settings = getScheduleSettings();
    const tasks = getScheduleTasks();

    // Default start date is today or first task's start date
    let startDate = getTodayStr();
    if (tasks.length > 0) {
      tasks.sort((a, b) => a.startDate.localeCompare(b.startDate));
      startDate = tasks[0].startDate;
    }

    document.getElementById('gen-start-date').value = startDate;
    document.getElementById('gen-sat-nowork').checked = settings.satNoWork;
    document.getElementById('gen-sun-nowork').checked = settings.sunNoWork;
    document.getElementById('gen-allow-quiet').checked = settings.weekendAllowQuiet;
    document.getElementById('gen-auto-material').checked = settings.autoMaterial;
    document.getElementById('gen-auto-acceptance').checked = settings.autoAcceptance;

    openModal('modal-gen-schedule');
  };

  window.submitGenerateSchedule = function () {
    const startDateVal = document.getElementById('gen-start-date').value;
    if (!startDateVal) {
      showToast('请选择开工日期', 'error');
      return;
    }

    // Save settings
    const settings = {
      satNoWork: document.getElementById('gen-sat-nowork').checked,
      sunNoWork: document.getElementById('gen-sun-nowork').checked,
      weekendAllowQuiet: document.getElementById('gen-allow-quiet').checked,
      autoMaterial: document.getElementById('gen-auto-material').checked,
      autoAcceptance: document.getElementById('gen-auto-acceptance').checked
    };
    saveScheduleSettings(settings);

    // If schedule already exists, ask confirmation
    const existingTasks = getScheduleTasks();
    if (existingTasks.length > 0) {
      if (!confirm('重新生成排期将清除现有的所有排期、材料提醒与验收数据（施工日志和现场问题除外），确定要重新生成吗？')) {
        return;
      }
    }

    const templateName = document.getElementById('gen-type').value;
    const templateTasks = SCHEDULE_TEMPLATES[templateName] || SCHEDULE_TEMPLATES.full;
    const noWorkDays = getNoWorkDays();

    const tasks = [];
    const materials = [];
    const acceptances = [];

    let currentStart = startDateVal;

    templateTasks.forEach((t, index) => {
      const taskId = generateId();
      const endDate = calcEndDate(currentStart, t.workDays, noWorkDays, settings, t.isNoisy);

      const task = {
        id: taskId,
        name: t.name,
        startDate: currentStart,
        estimatedWorkDays: t.workDays,
        endDate: endDate,
        workerId: '',
        workerName: '',
        area: '',
        content: '',
        isNoisy: t.isNoisy,
        needsAcceptance: t.needsAcceptance,
        status: 'not-started',
        color: t.color || TASK_COLORS[index % TASK_COLORS.length],
        note: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(task);

      // Auto materials
      if (settings.autoMaterial && TASK_MATERIALS[t.name]) {
        TASK_MATERIALS[t.name].forEach(mName => {
          const matId = generateId();
          const remindDate = calcPrevWorkDate(currentStart, 5, noWorkDays, settings);
          materials.push({
            id: matId,
            name: mName,
            relatedTaskId: taskId,
            remindDate: remindDate,
            expectedArrivalDate: currentStart,
            actualArrivalDate: '',
            status: 'pending',
            note: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
      }

      // Auto acceptance
      if (settings.autoAcceptance && t.needsAcceptance) {
        const accId = generateId();
        const checklistTexts = ACCEPTANCE_CHECKLISTS[t.name] || ACCEPTANCE_CHECKLISTS.generic;
        const checklist = checklistTexts.map(txt => ({ text: txt, checked: false }));
        acceptances.push({
          id: accId,
          name: `${t.name}验收`,
          relatedTaskId: taskId,
          date: endDate,
          checklist: checklist,
          result: 'not-checked',
          allowNextStep: false,
          note: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Next task starts on the next working day
      currentStart = calcNextStartDate(endDate, noWorkDays, settings, index + 1 < templateTasks.length ? templateTasks[index + 1].isNoisy : false);
    });

    saveScheduleTasks(tasks);
    saveMaterialReminders(materials);
    saveAcceptanceNodes(acceptances);

    closeModal('modal-gen-schedule');
    showToast('排期生成成功！');

    // Set selected view month
    calSelectedDate = startDateVal;
    const startD = strToDate(calSelectedDate);
    calCurrentYear = startD.getFullYear();
    calCurrentMonth = startD.getMonth() + 1;

    refreshCalendarView();
  };

  // Task Modal CRUD
  window.openTaskModal = function (taskId = '') {
    const tasks = getScheduleTasks();
    const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);

    // Populate workers dropdown
    const workerSelect = document.getElementById('te-worker-id');
    workerSelect.innerHTML = '<option value="">-- 选择已有工人 --</option>' + workers.map(w => `
      <option value="${w.id}">${w.name} (${w.notes || '无工种'})</option>
    `).join('');

    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      document.getElementById('te-task-id').value = task.id;
      document.getElementById('te-name').value = task.name;
      document.getElementById('te-start-date').value = task.startDate;
      document.getElementById('te-work-days').value = task.estimatedWorkDays;
      document.getElementById('te-worker-id').value = task.workerId || '';
      document.getElementById('te-worker-name').value = task.workerName || '';
      document.getElementById('te-area').value = task.area || '';
      document.getElementById('te-content').value = task.content || '';
      document.getElementById('te-is-noisy').checked = task.isNoisy || false;
      document.getElementById('te-needs-acceptance').checked = task.needsAcceptance || false;
      document.getElementById('te-note').value = task.note || '';
      document.getElementById('modal-task-edit-title').textContent = '编辑工序';

      renderColorSwatches(task.color);
    } else {
      document.getElementById('te-task-id').value = '';
      document.getElementById('te-name').value = '';
      document.getElementById('te-start-date').value = calSelectedDate || getTodayStr();
      document.getElementById('te-work-days').value = '3';
      document.getElementById('te-worker-id').value = '';
      document.getElementById('te-worker-name').value = '';
      document.getElementById('te-area').value = '';
      document.getElementById('te-content').value = '';
      document.getElementById('te-is-noisy').checked = false;
      document.getElementById('te-needs-acceptance').checked = false;
      document.getElementById('te-note').value = '';
      document.getElementById('modal-task-edit-title').textContent = '新增工序';

      renderColorSwatches(TASK_COLORS[0]);
    }

    updateTaskCalcEndDate();
    openModal('modal-task-edit');
  };

  function renderColorSwatches(selectedColor) {
    const container = document.getElementById('te-color-picker');
    container.innerHTML = TASK_COLORS.map(c => `
      <div class="color-swatch ${c === selectedColor ? 'color-swatch--selected' : ''}" 
           style="background: ${c}" 
           onclick="selectColorSwatch('${c}')"
           type="button"></div>
    `).join('');
    container.dataset.selectedColor = selectedColor;
  }

  window.selectColorSwatch = function (color) {
    renderColorSwatches(color);
  };

  window.updateTaskCalcEndDate = function () {
    const startDate = document.getElementById('te-start-date').value;
    const workDays = parseInt(document.getElementById('te-work-days').value);
    const isNoisy = document.getElementById('te-is-noisy').checked;
    const hintEl = document.getElementById('te-calc-end-date');

    if (!startDate || isNaN(workDays) || workDays <= 0) {
      hintEl.textContent = '';
      return;
    }

    const noWorkDays = getNoWorkDays();
    const settings = getScheduleSettings();
    const end = calcEndDate(startDate, workDays, noWorkDays, settings, isNoisy);
    hintEl.textContent = `→ 预计结束: ${end} (${getWeekdayName(end)})`;
  };

  window.saveTaskForm = function () {
    const id = document.getElementById('te-task-id').value;
    const name = document.getElementById('te-name').value.trim();
    const startDate = document.getElementById('te-start-date').value;
    const workDays = parseInt(document.getElementById('te-work-days').value);
    const workerId = document.getElementById('te-worker-id').value;
    let workerName = document.getElementById('te-worker-name').value.trim();
    const area = document.getElementById('te-area').value.trim();
    const content = document.getElementById('te-content').value.trim();
    const isNoisy = document.getElementById('te-is-noisy').checked;
    const needsAcceptance = document.getElementById('te-needs-acceptance').checked;
    const note = document.getElementById('te-note').value.trim();
    const color = document.getElementById('te-color-picker').dataset.selectedColor;

    if (!name) {
      showToast('请输入工序名称', 'error');
      return;
    }
    if (!startDate) {
      showToast('请选择开始日期', 'error');
      return;
    }
    if (isNaN(workDays) || workDays <= 0) {
      showToast('请输入有效的施工天数', 'error');
      return;
    }

    if (workerId) {
      const workers = StorageUtil.get(STORAGE_KEYS.WORKERS, []);
      const w = workers.find(x => x.id === workerId);
      if (w) workerName = w.name;
    }

    const tasks = getScheduleTasks();
    const noWorkDays = getNoWorkDays();
    const settings = getScheduleSettings();
    const endDate = calcEndDate(startDate, workDays, noWorkDays, settings, isNoisy);

    if (id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.name = name;
        task.startDate = startDate;
        task.estimatedWorkDays = workDays;
        task.endDate = endDate;
        task.workerId = workerId;
        task.workerName = workerName;
        task.area = area;
        task.content = content;
        task.isNoisy = isNoisy;
        task.needsAcceptance = needsAcceptance;
        task.note = note;
        task.color = color;
        task.updatedAt = new Date().toISOString();

        // Update linked acceptance node if any
        const acceptances = getAcceptanceNodes();
        const acc = acceptances.find(a => a.relatedTaskId === id);
        if (needsAcceptance) {
          if (acc) {
            acc.date = endDate;
            acc.updatedAt = new Date().toISOString();
          } else {
            const checklistTexts = ACCEPTANCE_CHECKLISTS[name] || ACCEPTANCE_CHECKLISTS.generic;
            acceptances.push({
              id: generateId(),
              name: `${name}验收`,
              relatedTaskId: id,
              date: endDate,
              checklist: checklistTexts.map(txt => ({ text: txt, checked: false })),
              result: 'not-checked',
              allowNextStep: false,
              note: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } else if (acc && acc.result === 'not-checked') {
          // Remove not-checked acceptance if no longer needed
          const accIdx = acceptances.findIndex(a => a.id === acc.id);
          acceptances.splice(accIdx, 1);
        }
        saveAcceptanceNodes(acceptances);
      }
    } else {
      const taskId = generateId();
      tasks.push({
        id: taskId,
        name: name,
        startDate: startDate,
        estimatedWorkDays: workDays,
        endDate: endDate,
        workerId: workerId,
        workerName: workerName,
        area: area,
        content: content,
        isNoisy: isNoisy,
        needsAcceptance: needsAcceptance,
        status: 'not-started',
        color: color,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Generate material reminder if settings say so
      if (settings.autoMaterial && TASK_MATERIALS[name]) {
        const materials = getMaterialReminders();
        TASK_MATERIALS[name].forEach(mName => {
          materials.push({
            id: generateId(),
            name: mName,
            relatedTaskId: taskId,
            remindDate: calcPrevWorkDate(startDate, 5, noWorkDays, settings),
            expectedArrivalDate: startDate,
            actualArrivalDate: '',
            status: 'pending',
            note: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
        saveMaterialReminders(materials);
      }

      // Generate acceptance node
      if (needsAcceptance) {
        const acceptances = getAcceptanceNodes();
        const checklistTexts = ACCEPTANCE_CHECKLISTS[name] || ACCEPTANCE_CHECKLISTS.generic;
        acceptances.push({
          id: generateId(),
          name: `${name}验收`,
          relatedTaskId: taskId,
          date: endDate,
          checklist: checklistTexts.map(txt => ({ text: txt, checked: false })),
          result: 'not-checked',
          allowNextStep: false,
          note: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        saveAcceptanceNodes(acceptances);
      }
    }

    saveScheduleTasks(tasks);
    closeModal('modal-task-edit');
    showToast('工序保存成功');

    // Trigger cascade adjust if dates changed
    adjustScheduleAfterNoWorkDaysChange();

    refreshCalendarView();
  };

  window.deleteTask = function (taskId) {
    const tasks = getScheduleTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let deleteWhole = true;

    // If task spans multiple days, ask the user if they want to delete the whole task or just today
    if (task.startDate !== task.endDate && calSelectedDate) {
      const choice = prompt(
        `该工序（${task.name}）跨越多个日期（${task.startDate} 至 ${task.endDate}）。\n\n` +
        `请输入选项数字并点击确认：\n` +
        `1 - 删除整道工序（所有日期均不施工）\n` +
        `2 - 仅今天（${calSelectedDate}）停工（该天设为停工禁装日，工期自动向后顺延）\n\n` +
        `（输入其他或直接取消将放弃操作）`
      );

      if (choice === '1') {
        deleteWhole = true;
      } else if (choice === '2') {
        // Option 2: Add today as a custom no-work day
        const noWorkDays = getNoWorkDays();
        // Check if already a no-work day
        if (!noWorkDays.some(n => n.date === calSelectedDate)) {
          noWorkDays.push({
            id: generateId(),
            date: calSelectedDate,
            reason: `${task.name}停工`,
            type: 'custom',
            allowQuiet: false,
            note: `通过工序「${task.name}」单日删除快速生成`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          saveNoWorkDays(noWorkDays);
          showToast('今天已设为禁装停工日，后续工期已自动顺延');
          adjustScheduleAfterNoWorkDaysChange();
          refreshCalendarView();
        } else {
          showToast('今天已经是禁装日', 'info');
        }
        return; // Exit, do not delete whole task
      } else {
        return; // Cancel
      }
    } else {
      // Normal confirmation for single day tasks
      if (!confirm(`确定要删除工序「${task.name}」吗？与之关联的材料提醒和验收节点也将被删除。`)) {
        return;
      }
    }

    if (deleteWhole) {
      const remainingTasks = tasks.filter(t => t.id !== taskId);
      saveScheduleTasks(remainingTasks);

      // Clean materials and acceptances
      const materials = getMaterialReminders().filter(m => m.relatedTaskId !== taskId);
      saveMaterialReminders(materials);

      const acceptances = getAcceptanceNodes().filter(a => a.relatedTaskId !== taskId);
      saveAcceptanceNodes(acceptances);

      showToast('工序已成功删除');
      adjustScheduleAfterNoWorkDaysChange();
      refreshCalendarView();
    }
  };

  window.updateTaskStatus = function (taskId, status) {
    const tasks = getScheduleTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    saveScheduleTasks(tasks);

    if (status === 'delayed') {
      openPostponeModal(taskId);
    } else {
      showToast('工序状态已更新');
      refreshCalendarView();
    }
  };

  // Postpone / Delay Modal
  window.openPostponeModal = function (taskId) {
    document.getElementById('postpone-task-id').value = taskId;
    // Set checked state of option none
    const radios = document.getElementsByName('postpone-option');
    radios.forEach(r => {
      r.checked = r.value === 'none';
    });
    document.getElementById('postpone-custom-days').value = '';
    document.getElementById('postpone-custom-days').style.display = 'none';

    openModal('modal-postpone');
  };

  window.togglePostponeCustom = function (val) {
    const customInput = document.getElementById('postpone-custom-days');
    if (val === 'custom') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  };

  window.executePostpone = function () {
    const taskId = document.getElementById('postpone-task-id').value;
    const radios = document.getElementsByName('postpone-option');
    let optionVal = 'none';
    radios.forEach(r => {
      if (r.checked) optionVal = r.value;
    });

    let days = 0;
    if (optionVal === 'none') {
      closeModal('modal-postpone');
      refreshCalendarView();
      return;
    } else if (optionVal === 'custom') {
      days = parseInt(document.getElementById('postpone-custom-days').value);
    } else {
      days = parseInt(optionVal);
    }

    if (isNaN(days) || days <= 0) {
      showToast('请输入有效的顺延天数', 'error');
      return;
    }

    const tasks = getScheduleTasks();
    const settings = getScheduleSettings();
    const noWorkDays = getNoWorkDays();

    // Sort by startDate
    tasks.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Step 1: Extend current task duration
    task.estimatedWorkDays += days;
    task.endDate = calcEndDate(task.startDate, task.estimatedWorkDays, noWorkDays, settings, task.isNoisy);
    task.updatedAt = new Date().toISOString();

    // Update linked acceptance node date
    const acceptances = getAcceptanceNodes();
    const acc = acceptances.find(a => a.relatedTaskId === task.id);
    if (acc) {
      acc.date = task.endDate;
      acc.updatedAt = new Date().toISOString();
    }

    // Step 2: Cascade shift subsequent 'not-started' tasks
    let prevEndDate = task.endDate;
    const startIndex = tasks.indexOf(task);

    const materials = getMaterialReminders();

    for (let i = startIndex + 1; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.status === 'not-started') {
        t.startDate = calcNextStartDate(prevEndDate, noWorkDays, settings, t.isNoisy);
        t.endDate = calcEndDate(t.startDate, t.estimatedWorkDays, noWorkDays, settings, t.isNoisy);
        t.updatedAt = new Date().toISOString();

        // Shift materials
        const taskMats = materials.filter(m => m.relatedTaskId === t.id);
        taskMats.forEach(m => {
          m.remindDate = calcPrevWorkDate(t.startDate, 5, noWorkDays, settings);
          m.expectedArrivalDate = t.startDate;
          m.updatedAt = new Date().toISOString();
        });

        // Shift acceptance
        const accNode = acceptances.find(a => a.relatedTaskId === t.id);
        if (accNode) {
          accNode.date = t.endDate;
          accNode.updatedAt = new Date().toISOString();
        }
        prevEndDate = t.endDate;
      } else {
        prevEndDate = t.endDate;
      }
    }

    saveScheduleTasks(tasks);
    saveMaterialReminders(materials);
    saveAcceptanceNodes(acceptances);

    closeModal('modal-postpone');
    showToast(`成功延期并顺延后续未开始工序 ${days} 个工作日`);
    refreshCalendarView();
  };

  // No-Work Day CRUD
  window.openNoWorkDayModal = function (dateStr = '', nwdId = '') {
    const days = getNoWorkDays();
    if (nwdId) {
      const n = days.find(x => x.id === nwdId);
      if (!n) return;
      document.getElementById('nwd-id').value = n.id;
      document.getElementById('nwd-date').value = n.date;
      document.getElementById('nwd-reason').value = n.reason;
      document.getElementById('nwd-type').value = n.type;
      document.getElementById('nwd-allow-quiet').checked = n.allowQuiet || false;
      document.getElementById('nwd-note').value = n.note || '';
    } else {
      document.getElementById('nwd-id').value = '';
      document.getElementById('nwd-date').value = dateStr || calSelectedDate || getTodayStr();
      document.getElementById('nwd-reason').value = '';
      document.getElementById('nwd-type').value = 'custom';
      document.getElementById('nwd-allow-quiet').checked = false;
      document.getElementById('nwd-note').value = '';
    }

    openModal('modal-nwd-edit');
  };

  window.saveNoWorkDayForm = function () {
    const id = document.getElementById('nwd-id').value;
    const date = document.getElementById('nwd-date').value;
    const reason = document.getElementById('nwd-reason').value.trim();
    const type = document.getElementById('nwd-type').value;
    const allowQuiet = document.getElementById('nwd-allow-quiet').checked;
    const note = document.getElementById('nwd-note').value.trim();

    if (!date) {
      showToast('请选择日期', 'error');
      return;
    }
    if (!reason) {
      showToast('请输入禁装原因', 'error');
      return;
    }

    const days = getNoWorkDays();
    if (id) {
      const n = days.find(x => x.id === id);
      if (n) {
        n.date = date;
        n.reason = reason;
        n.type = type;
        n.allowQuiet = allowQuiet;
        n.note = note;
        n.updatedAt = new Date().toISOString();
      }
    } else {
      // Check if already exists for this date
      if (days.some(x => x.date === date)) {
        showToast('该日期已设置为禁装日', 'error');
        return;
      }
      days.push({
        id: generateId(),
        date: date,
        reason: reason,
        type: type,
        allowQuiet: allowQuiet,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    saveNoWorkDays(days);
    closeModal('modal-nwd-edit');
    showToast('禁装日设置成功');

    adjustScheduleAfterNoWorkDaysChange();
    refreshCalendarView();
  };

  window.deleteNoWorkDay = function (nwdId) {
    if (!confirm('确定要取消这个禁装日设置吗？部分工期可能会向前自动微调。')) {
      return;
    }

    const days = getNoWorkDays().filter(n => n.id !== nwdId);
    saveNoWorkDays(days);
    showToast('禁装日已取消');

    adjustScheduleAfterNoWorkDaysChange();
    refreshCalendarView();
  };

  // Material CRUD
  window.openMaterialModal = function (dateStr = '', matId = '') {
    const tasks = getScheduleTasks();
    const mats = getMaterialReminders();

    // Populate tasks select
    const taskSelect = document.getElementById('mat-task-id');
    taskSelect.innerHTML = '<option value="">-- 选择关联工序 --</option>' + tasks.map(t => `
      <option value="${t.id}">${t.name}</option>
    `).join('');

    if (matId) {
      const mat = mats.find(m => m.id === matId);
      if (!mat) return;

      document.getElementById('mat-id').value = mat.id;
      document.getElementById('mat-name').value = mat.name;
      document.getElementById('mat-task-id').value = mat.relatedTaskId || '';
      document.getElementById('mat-remind-date').value = mat.remindDate || '';
      document.getElementById('mat-expected-date').value = mat.expectedArrivalDate || '';
      document.getElementById('mat-actual-date').value = mat.actualArrivalDate || '';
      document.getElementById('mat-status').value = mat.status;
      document.getElementById('mat-note').value = mat.note || '';
      document.getElementById('modal-mat-title').textContent = '编辑材料提醒';
    } else {
      document.getElementById('mat-id').value = '';
      document.getElementById('mat-name').value = '';
      document.getElementById('mat-task-id').value = '';
      document.getElementById('mat-remind-date').value = dateStr || calSelectedDate || getTodayStr();
      document.getElementById('mat-expected-date').value = dateStr || calSelectedDate || getTodayStr();
      document.getElementById('mat-actual-date').value = '';
      document.getElementById('mat-status').value = 'pending';
      document.getElementById('mat-note').value = '';
      document.getElementById('modal-mat-title').textContent = '添加材料提醒';
    }

    openModal('modal-mat-edit');
  };

  window.onMatTaskChange = function () {
    const taskId = document.getElementById('mat-task-id').value;
    if (!taskId) return;

    const tasks = getScheduleTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const settings = getScheduleSettings();
    const noWorkDays = getNoWorkDays();

    // Expected arrival is task start date
    document.getElementById('mat-expected-date').value = task.startDate;
    // Remind date is 5 working days before task start date
    document.getElementById('mat-remind-date').value = calcPrevWorkDate(task.startDate, 5, noWorkDays, settings);
  };

  window.saveMaterialForm = function () {
    const id = document.getElementById('mat-id').value;
    const name = document.getElementById('mat-name').value.trim();
    const taskId = document.getElementById('mat-task-id').value;
    const remindDate = document.getElementById('mat-remind-date').value;
    const expectedArrival = document.getElementById('mat-expected-date').value;
    const actualArrival = document.getElementById('mat-actual-date').value;
    const status = document.getElementById('mat-status').value;
    const note = document.getElementById('mat-note').value.trim();

    if (!name) {
      showToast('请输入材料名称', 'error');
      return;
    }

    const mats = getMaterialReminders();
    if (id) {
      const mat = mats.find(m => m.id === id);
      if (mat) {
        mat.name = name;
        mat.relatedTaskId = taskId;
        mat.remindDate = remindDate;
        mat.expectedArrivalDate = expectedArrival;
        mat.actualArrivalDate = actualArrival;
        mat.status = status;
        mat.note = note;
        mat.updatedAt = new Date().toISOString();
      }
    } else {
      mats.push({
        id: generateId(),
        name: name,
        relatedTaskId: taskId,
        remindDate: remindDate,
        expectedArrivalDate: expectedArrival,
        actualArrivalDate: actualArrival,
        status: status,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    saveMaterialReminders(mats);
    closeModal('modal-mat-edit');
    showToast('材料提醒已保存');
    refreshCalendarView();
  };

  window.deleteMaterial = function (matId) {
    if (!confirm('确定要删除该材料提醒吗？')) return;
    const mats = getMaterialReminders().filter(m => m.id !== matId);
    saveMaterialReminders(mats);
    showToast('材料提醒已删除');
    refreshCalendarView();
  };

  window.updateMaterialStatus = function (matId, status) {
    const mats = getMaterialReminders();
    const mat = mats.find(m => m.id === matId);
    if (!mat) return;

    mat.status = status;
    if (status === 'arrived' && !mat.actualArrivalDate) {
      mat.actualArrivalDate = getTodayStr();
    }
    mat.updatedAt = new Date().toISOString();
    saveMaterialReminders(mats);
    showToast('材料状态已更新');
    refreshCalendarView();
  };

  // Acceptance CRUD
  window.openAcceptanceModal = function (dateStr = '', accId = '') {
    const tasks = getScheduleTasks();
    const accs = getAcceptanceNodes();

    // Populate tasks select
    const taskSelect = document.getElementById('acc-task-id');
    taskSelect.innerHTML = '<option value="">-- 选择关联工序 --</option>' + tasks.map(t => `
      <option value="${t.id}">${t.name}</option>
    `).join('');

    if (accId) {
      const acc = accs.find(a => a.id === accId);
      if (!acc) return;

      document.getElementById('acc-id').value = acc.id;
      document.getElementById('acc-name').value = acc.name;
      document.getElementById('acc-task-id').value = acc.relatedTaskId || '';
      document.getElementById('acc-date').value = acc.date;
      document.getElementById('acc-result').value = acc.result;
      document.getElementById('acc-allow-next').checked = acc.allowNextStep || false;
      document.getElementById('acc-note').value = acc.note || '';
      document.getElementById('modal-acc-title').textContent = '编辑验收节点';

      renderModalChecklist(acc.checklist || []);
    } else {
      document.getElementById('acc-id').value = '';
      document.getElementById('acc-name').value = '';
      document.getElementById('acc-task-id').value = '';
      document.getElementById('acc-date').value = dateStr || calSelectedDate || getTodayStr();
      document.getElementById('acc-result').value = 'not-checked';
      document.getElementById('acc-allow-next').checked = false;
      document.getElementById('acc-note').value = '';
      document.getElementById('modal-acc-title').textContent = '添加验收节点';

      renderModalChecklist([]);
    }

    openModal('modal-acc-edit');
  };

  window.onAccTaskChange = function () {
    const taskId = document.getElementById('acc-task-id').value;
    if (!taskId) return;

    const tasks = getScheduleTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('acc-name').value = `${task.name}验收`;
    document.getElementById('acc-date').value = task.endDate;

    // Auto-fill checklist template
    const checklistTexts = ACCEPTANCE_CHECKLISTS[task.name] || ACCEPTANCE_CHECKLISTS.generic;
    const checklist = checklistTexts.map(txt => ({ text: txt, checked: false }));
    renderModalChecklist(checklist);
  };

  function renderModalChecklist(items = []) {
    const container = document.getElementById('acc-checklist');
    container.innerHTML = items.map((it, idx) => `
      <div class="acc-checklist-item" data-idx="${idx}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <input type="checkbox" ${it.checked ? 'checked' : ''} onchange="modalChecklistCheckChanged(${idx}, this.checked)" aria-label="标记通过">
        <input type="text" class="form-input" style="flex:1;padding:4px 8px;height:28px;font-size:12px;" value="${it.text}" onchange="modalChecklistTextChanged(${idx}, this.value)" aria-label="检查项文本">
        <button class="btn btn-danger btn-xs" type="button" onclick="modalChecklistRemove(${idx})">✕</button>
      </div>
    `).join('') + `
      <button class="btn btn-secondary btn-xs" type="button" style="margin-top:6px;align-self:flex-start;" onclick="modalChecklistAdd()">＋ 添加检查项</button>
    `;
    container.dataset.checklist = JSON.stringify(items);
  }

  window.modalChecklistCheckChanged = function (idx, checked) {
    const container = document.getElementById('acc-checklist');
    const items = JSON.parse(container.dataset.checklist);
    items[idx].checked = checked;
    container.dataset.checklist = JSON.stringify(items);
  };

  window.modalChecklistTextChanged = function (idx, text) {
    const container = document.getElementById('acc-checklist');
    const items = JSON.parse(container.dataset.checklist);
    items[idx].text = text;
    container.dataset.checklist = JSON.stringify(items);
  };

  window.modalChecklistRemove = function (idx) {
    const container = document.getElementById('acc-checklist');
    const items = JSON.parse(container.dataset.checklist);
    items.splice(idx, 1);
    renderModalChecklist(items);
  };

  window.modalChecklistAdd = function () {
    const container = document.getElementById('acc-checklist');
    const items = JSON.parse(container.dataset.checklist || '[]');
    items.push({ text: '新增检查项目', checked: false });
    renderModalChecklist(items);
  };

  window.saveAcceptanceForm = function () {
    const id = document.getElementById('acc-id').value;
    const name = document.getElementById('acc-name').value.trim();
    const taskId = document.getElementById('acc-task-id').value;
    const date = document.getElementById('acc-date').value;
    const result = document.getElementById('acc-result').value;
    const allowNext = document.getElementById('acc-allow-next').checked;
    const note = document.getElementById('acc-note').value.trim();
    const checklist = JSON.parse(document.getElementById('acc-checklist').dataset.checklist || '[]');

    if (!name) {
      showToast('请输入验收名称', 'error');
      return;
    }
    if (!date) {
      showToast('请选择验收日期', 'error');
      return;
    }

    const accs = getAcceptanceNodes();
    if (id) {
      const acc = accs.find(a => a.id === id);
      if (acc) {
        acc.name = name;
        acc.relatedTaskId = taskId;
        acc.date = date;
        acc.result = result;
        acc.allowNextStep = allowNext;
        acc.note = note;
        acc.checklist = checklist;
        acc.updatedAt = new Date().toISOString();
      }
    } else {
      accs.push({
        id: generateId(),
        name: name,
        relatedTaskId: taskId,
        date: date,
        result: result,
        allowNextStep: allowNext,
        note: note,
        checklist: checklist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    saveAcceptanceNodes(accs);
    closeModal('modal-acc-edit');
    showToast('验收节点已保存');
    refreshCalendarView();
  };

  window.deleteAcceptance = function (accId) {
    if (!confirm('确定要删除该验收记录吗？')) return;
    const accs = getAcceptanceNodes().filter(a => a.id !== accId);
    saveAcceptanceNodes(accs);
    showToast('验收节点已删除');
    refreshCalendarView();
  };

  window.toggleAccChecklistItem = function (accId, idx) {
    const accs = getAcceptanceNodes();
    const acc = accs.find(a => a.id === accId);
    if (!acc || !acc.checklist || !acc.checklist[idx]) return;

    acc.checklist[idx].checked = !acc.checklist[idx].checked;
    acc.updatedAt = new Date().toISOString();
    saveAcceptanceNodes(accs);

    renderDayPanel(calSelectedDate);
  };

  window.updateAcceptanceResult = function (accId, result) {
    const accs = getAcceptanceNodes();
    const acc = accs.find(a => a.id === accId);
    if (!acc) return;

    acc.result = result;
    acc.updatedAt = new Date().toISOString();
    saveAcceptanceNodes(accs);
    showToast('验收结果已更新');
    refreshCalendarView();
  };

  // Daily Log CRUD
  window.openLogModal = function (dateStr) {
    document.getElementById('log-date').value = dateStr;
    const logs = getDailyLogs();
    const log = logs.find(l => l.date === dateStr);

    document.getElementById('modal-log-title').textContent = log ? `编辑施工日志 (${dateStr})` : `记施工日志 (${dateStr})`;

    if (log) {
      document.getElementById('log-work-content').value = log.workContent || '';
      document.getElementById('log-workers-text').value = log.workers || '';
      document.getElementById('log-material-status').value = log.materialStatus || '';
      document.getElementById('log-issues-text').value = log.issuesText || '';
      document.getElementById('log-tomorrow-plan').value = log.tomorrowPlan || '';
      document.getElementById('log-note').value = log.note || '';
    } else {
      document.getElementById('log-work-content').value = '';
      document.getElementById('log-material-status').value = '';
      document.getElementById('log-issues-text').value = '';
      document.getElementById('log-tomorrow-plan').value = '';
      document.getElementById('log-note').value = '';

      // Smart auto-fill workers working today
      const activeTasks = getScheduleTasks().filter(t => t.startDate <= dateStr && t.endDate >= dateStr);
      const workerNames = activeTasks.map(t => t.workerName).filter(Boolean);
      document.getElementById('log-workers-text').value = workerNames.join('、');
    }

    openModal('modal-log-edit');
  };

  window.saveLogForm = function () {
    const date = document.getElementById('log-date').value;
    const workContent = document.getElementById('log-work-content').value.trim();
    const workers = document.getElementById('log-workers-text').value.trim();
    const materialStatus = document.getElementById('log-material-status').value.trim();
    const issuesText = document.getElementById('log-issues-text').value.trim();
    const tomorrowPlan = document.getElementById('log-tomorrow-plan').value.trim();
    const note = document.getElementById('log-note').value.trim();

    const logs = getDailyLogs();
    const existingIdx = logs.findIndex(l => l.date === date);

    const logData = {
      id: existingIdx !== -1 ? logs[existingIdx].id : generateId(),
      date: date,
      workContent: workContent,
      workers: workers,
      materialStatus: materialStatus,
      issuesText: issuesText,
      tomorrowPlan: tomorrowPlan,
      note: note,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      logData.createdAt = logs[existingIdx].createdAt;
      logs[existingIdx] = logData;
    } else {
      logData.createdAt = new Date().toISOString();
      logs.push(logData);
    }

    saveDailyLogs(logs);
    closeModal('modal-log-edit');
    showToast('日志保存成功');
    refreshCalendarView();
  };

  // Issue CRUD
  window.openIssueModal = function (dateStr = '', issId = '') {
    const issues = getIssueRecords();
    if (issId) {
      const iss = issues.find(i => i.id === issId);
      if (!iss) return;

      document.getElementById('iss-id').value = iss.id;
      document.getElementById('iss-date').value = iss.date;
      document.getElementById('iss-description').value = iss.description;
      document.getElementById('iss-responsible').value = iss.responsiblePerson || '';
      document.getElementById('iss-deadline').value = iss.deadline || '';
      document.getElementById('iss-status').value = iss.status;
      document.getElementById('iss-note').value = iss.note || '';
      document.getElementById('modal-iss-title').textContent = '编辑问题记录';
    } else {
      document.getElementById('iss-id').value = '';
      document.getElementById('iss-date').value = dateStr || calSelectedDate || getTodayStr();
      document.getElementById('iss-description').value = '';
      document.getElementById('iss-responsible').value = '';
      document.getElementById('iss-deadline').value = dateStr || calSelectedDate || getTodayStr();
      document.getElementById('iss-status').value = 'pending';
      document.getElementById('iss-note').value = '';
      document.getElementById('modal-iss-title').textContent = '记录现场问题';
    }

    openModal('modal-iss-edit');
  };

  window.saveIssueForm = function () {
    const id = document.getElementById('iss-id').value;
    const date = document.getElementById('iss-date').value;
    const description = document.getElementById('iss-description').value.trim();
    const responsible = document.getElementById('iss-responsible').value.trim();
    const deadline = document.getElementById('iss-deadline').value;
    const status = document.getElementById('iss-status').value;
    const note = document.getElementById('iss-note').value.trim();

    if (!description) {
      showToast('请输入问题描述', 'error');
      return;
    }

    const issues = getIssueRecords();
    if (id) {
      const iss = issues.find(i => i.id === id);
      if (iss) {
        iss.date = date;
        iss.description = description;
        iss.responsiblePerson = responsible;
        iss.deadline = deadline;
        iss.status = status;
        iss.note = note;
        iss.updatedAt = new Date().toISOString();
      }
    } else {
      issues.push({
        id: generateId(),
        date: date,
        description: description,
        responsiblePerson: responsible,
        deadline: deadline,
        status: status,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    saveIssueRecords(issues);
    closeModal('modal-iss-edit');
    showToast('问题记录已保存');
    refreshCalendarView();
  };

  window.deleteIssue = function (issId) {
    if (!confirm('确定要删除该条问题记录吗？')) return;
    const issues = getIssueRecords().filter(i => i.id !== issId);
    saveIssueRecords(issues);
    showToast('问题记录已删除');
    refreshCalendarView();
  };

  window.updateIssueStatus = function (issId, status) {
    const issues = getIssueRecords();
    const iss = issues.find(i => i.id === issId);
    if (!iss) return;

    iss.status = status;
    iss.updatedAt = new Date().toISOString();
    saveIssueRecords(issues);
    showToast('问题状态已更新');
    refreshCalendarView();
  };

  // Convert Hex color to RGB
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `${r}, ${g}, ${b}`;
  }

  // ================================================================
  // 移动端手势：向下滑动关闭底部面板
  // ================================================================
  function initPanelSwipeClose() {
    // 只在触摸设备上启用
    if (!('ontouchstart' in window)) return;

    const panel = document.getElementById('cal-day-panel');
    if (!panel) return;

    // 避免重复绑定
    if (panel._swipeInited) return;
    panel._swipeInited = true;

    let startY = 0;
    let startScrollTop = 0;
    let isDragging = false;
    let currentTranslate = 0;

    panel.addEventListener('touchstart', (e) => {
      // 仅处理从面板顶部区域（手柄或 header）开始的触摸
      const handle = panel.querySelector('.day-panel-drag-handle');
      const header = panel.querySelector('.day-panel-header');
      const target = e.target;
      const isOnHandle = handle && handle.contains(target);
      const isOnHeader = header && header.contains(target);

      // 如果内容区已滚动到顶部，也允许向下拖拽
      const body = panel.querySelector('.day-panel-body');
      const atTop = !body || body.scrollTop <= 0;

      if (!isOnHandle && !isOnHeader && !atTop) return;

      isDragging = true;
      startY = e.touches[0].clientY;
      startScrollTop = body ? body.scrollTop : 0;
      currentTranslate = 0;
      panel.style.transition = 'none';
    }, { passive: true });

    panel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY <= 0) return; // 只处理向下滑
      currentTranslate = deltaY;
      // 跟手移动，最大移动距离为面板高度
      const maxH = panel.offsetHeight;
      const ratio = Math.min(deltaY / maxH, 1);
      panel.style.transform = `translateY(${deltaY}px)`;
      // 遮罩随手势淡出
      const overlay = document.getElementById('cal-panel-overlay');
      if (overlay) overlay.style.opacity = String(1 - ratio * 0.9);
    }, { passive: true });

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.transition = '';

      const threshold = panel.offsetHeight * 0.32; // 滑过 32% 高度则关闭
      if (currentTranslate > threshold) {
        window.closeDayPanel();
      } else {
        // 回弹
        panel.style.transform = '';
        const overlay = document.getElementById('cal-panel-overlay');
        if (overlay) overlay.style.opacity = '';
      }
      currentTranslate = 0;
    };

    panel.addEventListener('touchend', endDrag, { passive: true });
    panel.addEventListener('touchcancel', endDrag, { passive: true });
  }

  // 窗口尺寸变化时重新渲染（如横竖屏切换），节流处理
  let _resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      const calPage = document.getElementById('page-calendar');
      if (calPage && calPage.style.display !== 'none' && calPage.offsetParent !== null) {
        refreshCalendarView();
      }
    }, 300);
  });

})();
