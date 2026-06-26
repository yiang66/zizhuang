// 装修小白自装助手 — LocalStorage 工具函数

const STORAGE_SCHEMA_VERSION = 2;
const APP_BACKUP_INFO = {
  id: 'reno-helper',
  name: '装修小白自装助手',
  version: '1.1.2',
};

const STORAGE_META_KEYS = {
  LAST_BACKUP_AT: 'reno_last_backup_at',
  BACKUP_REMINDER_DISMISSED_AT: 'reno_backup_reminder_dismissed_at',
};

const StorageUtil = {
  // 获取数据
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', key, e);
      return defaultValue;
    }
  },

  // 保存数据
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', key, e);
      return false;
    }
  },

  // 删除数据
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', key, e);
      return false;
    }
  },

  // 清除所有装修数据
  clearAll() {
    [...Object.values(STORAGE_KEYS), ...Object.values(STORAGE_META_KEYS)].forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // 导出所有数据为 JSON
  exportAll() {
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.get(key);
    });
    return {
      app: { ...APP_BACKUP_INFO },
      schemaVersion: STORAGE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      sourceOrigin: typeof location !== 'undefined' ? location.origin : '',
      data,
    };
  },

  // 导入 JSON 数据
  importAll(payload) {
    const normalized = normalizeImportPayload(payload);
    const previousValues = {};
    const importedKeys = [];

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      previousValues[key] = localStorage.getItem(key);
      if (normalized.data[name] !== undefined && normalized.data[name] !== null) {
        if (!this.set(key, normalized.data[name])) {
          Object.entries(previousValues).forEach(([restoreKey, rawValue]) => {
            if (rawValue === null) localStorage.removeItem(restoreKey);
            else localStorage.setItem(restoreKey, rawValue);
          });
          throw new Error('本地存储空间不足，导入未完成');
        }
        importedKeys.push(name);
      }
    });

    return {
      importedKeys,
      legacy: normalized.legacy,
      schemaVersion: normalized.schemaVersion,
    };
  },

  markBackupCreated(exportedAt = new Date().toISOString()) {
    localStorage.setItem(STORAGE_META_KEYS.LAST_BACKUP_AT, exportedAt);
  },

  getLastBackupAt() {
    return localStorage.getItem(STORAGE_META_KEYS.LAST_BACKUP_AT);
  },

  hasUserData() {
    const meaningfulKeys = [
      STORAGE_KEYS.STAGE_STATUS,
      STORAGE_KEYS.TASK_STATUS,
      STORAGE_KEYS.SHOPPING_STATUS,
      STORAGE_KEYS.PREP_STATUS,
      STORAGE_KEYS.BUDGET_V2,
      STORAGE_KEYS.EXPENSES,
      STORAGE_KEYS.WORKERS,
      STORAGE_KEYS.CALL_RECORDS,
      STORAGE_KEYS.HOUSE_INFO,
    ];
    return meaningfulKeys.some(key => {
      const raw = localStorage.getItem(key);
      if (raw === null) return false;
      try {
        const value = JSON.parse(raw);
        return Array.isArray(value)
          ? value.length > 0
          : value && typeof value === 'object' && Object.keys(value).length > 0;
      } catch (_) {
        return false;
      }
    });
  },

  needsBackupReminder(intervalDays = 30) {
    if (!this.hasUserData()) return false;
    const lastAction = this.getLastBackupAt()
      || localStorage.getItem(STORAGE_META_KEYS.BACKUP_REMINDER_DISMISSED_AT);
    if (!lastAction) return true;
    const elapsed = Date.now() - new Date(lastAction).getTime();
    return Number.isFinite(elapsed) && elapsed >= intervalDays * 24 * 60 * 60 * 1000;
  },

  dismissBackupReminder() {
    localStorage.setItem(STORAGE_META_KEYS.BACKUP_REMINDER_DISMISSED_AT, new Date().toISOString());
  }
};

// 存储键常量
const STORAGE_KEYS = {
  STAGE_STATUS: 'reno_stage_status',       // { stageId: 'not-started' | 'in-progress' | 'completed' }
  TASK_STATUS: 'reno_task_status',         // { taskId: true/false }
  SHOPPING_STATUS: 'reno_shopping_status', // { itemId: true/false }
  PREP_STATUS: 'reno_prep_status',         // { itemId: true/false }
  BUDGET_ITEMS: 'reno_budget_items',       // legacy – kept for migration
  BUDGET_V2: 'reno_budget_v2',             // [{ id, category, room, name, brand, unit, qty, unitPrice, budget, actual, craft, priority, note }]
  EXPENSES: 'reno_expenses',               // [{ id, stageId, name, amount, date, note }]
  WORKERS: 'reno_workers',                 // [{ id, typeId, name, phone, source, rating, quote, selected, notes }]
  CALL_RECORDS: 'reno_call_records',       // [{ id, workerId, date, content, quote, conditions, attitude }]
  HOUSE_INFO: 'reno_house_info',
  CUSTOM_STAGES: 'reno_custom_stages',     // custom stage data
};

const STORAGE_VALUE_TYPES = {
  STAGE_STATUS: 'object',
  TASK_STATUS: 'object',
  SHOPPING_STATUS: 'object',
  PREP_STATUS: 'object',
  BUDGET_ITEMS: 'array',
  BUDGET_V2: 'array',
  EXPENSES: 'array',
  WORKERS: 'array',
  CALL_RECORDS: 'array',
  HOUSE_INFO: 'object',
  CUSTOM_STAGES: 'array',
};

function normalizeImportPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('备份文件格式不正确');
  }

  const isEnvelope = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data);
  if (isEnvelope && payload.app?.id !== APP_BACKUP_INFO.id) {
    throw new Error('这不是装修小白自装助手的备份文件');
  }

  const data = isEnvelope ? payload.data : payload;
  const knownEntries = Object.keys(STORAGE_KEYS)
    .filter(name => Object.prototype.hasOwnProperty.call(data, name));

  if (knownEntries.length === 0) {
    throw new Error('备份文件中没有可导入的装修数据');
  }

  knownEntries.forEach(name => {
    const value = data[name];
    if (value === null || value === undefined) return;
    const expectedType = STORAGE_VALUE_TYPES[name];
    const valid = expectedType === 'array'
      ? Array.isArray(value)
      : typeof value === 'object' && !Array.isArray(value);
    if (!valid) {
      throw new Error(`${name} 数据类型不正确`);
    }
  });

  return {
    data,
    legacy: !isEnvelope,
    schemaVersion: isEnvelope ? Number(payload.schemaVersion) || 1 : 1,
  };
}

// ID 生成器
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 格式化金额
function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '¥0';
  return '¥' + Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
