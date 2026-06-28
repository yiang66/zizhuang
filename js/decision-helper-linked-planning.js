// 装修前决策助手 — 需求联动预留规划规则

const DECISION_LINKED_PLANNING_DISCLAIMER = '以下点位和尺寸为前期规划参考，不代表唯一标准。实际位置和尺寸需要结合户型、家电型号、柜体设计和现场施工确认。';

const DECISION_POINT_TYPE_LABELS = {
  socket: '插座',
  switch: '开关',
  waterIn: '进水',
  waterOut: '排水',
  network: '网线',
  lighting: '灯位',
  appliance: '家电位',
  cabinet: '柜体预留',
  other: '其他',
};

const DECISION_POINT_TYPES = Object.keys(DECISION_POINT_TYPE_LABELS);
const DECISION_PLANNING_STAGES = ['设计前', '水电前', '瓦工前', '木工前', '橱柜设计前', '定制柜复尺前', '安装前'];
const DECISION_IMPORTANCE_LABELS = {
  high: '高',
  medium: '中',
  low: '低',
};

const DECISION_LINKED_PLANNING_RULES = [
  {
    id: 'dishwasher',
    triggers: ['洗碗机'],
    sourceNeed: '洗碗机',
    points: [
      { room: '厨房', type: 'socket', title: '洗碗机插座预留', suggestion: '建议在橱柜内或相邻柜体预留洗碗机电源，避免被机器本体挡住。', quantity: '1', stage: '水电前', importance: 'high' },
      { room: '厨房', type: 'waterIn', title: '洗碗机进水预留', suggestion: '需要结合水槽位置和橱柜方案确认进水位置。', quantity: '1', stage: '水电前', importance: 'high' },
      { room: '厨房', type: 'waterOut', title: '洗碗机排水预留', suggestion: '提前确认排水方式，避免后期橱柜安装后不好改。', quantity: '1', stage: '水电前', importance: 'high' },
    ],
    dimensions: [
      { room: '厨房', title: '洗碗机尺寸确认', reference: '嵌入式洗碗机需要提前确认宽度、高度、深度以及橱柜开孔尺寸。', warning: '橱柜设计前最好确定品牌型号，不同型号尺寸不同。', stage: '橱柜设计前' },
    ],
  },
  {
    id: 'built-in-appliance',
    triggers: ['蒸烤箱', '嵌入式电器', '嵌入式冰箱', '洗碗机/蒸烤箱/嵌入式电器'],
    sourceNeed: '嵌入式电器',
    points: [
      { room: '厨房', type: 'socket', title: '嵌入式电器插座预留', suggestion: '根据高柜或地柜位置预留独立电源，避免插座被机器挡住。', quantity: '1', stage: '水电前', importance: 'high' },
    ],
    dimensions: [
      { room: '厨房', title: '嵌入式电器柜体尺寸', reference: '需要提前确认设备宽高深、散热要求、开孔尺寸。', warning: '橱柜设计前确认型号，避免后期无法安装。', stage: '橱柜设计前' },
    ],
  },
  {
    id: 'water-filter',
    triggers: ['净水器'],
    sourceNeed: '净水器',
    points: [
      { room: '厨房', type: 'socket', title: '净水器插座预留', suggestion: '水槽下方或净水器安装位置附近预留电源。', quantity: '1', stage: '水电前', importance: 'medium' },
      { room: '厨房', type: 'waterIn', title: '净水器水路预留', suggestion: '提前确认净水器安装位置和水路。', quantity: '1', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '厨房', title: '水槽柜内部空间', reference: '净水器、垃圾处理器、小厨宝等设备可能都集中在水槽柜，需要提前确认柜内空间。', warning: '避免设备太多导致后期放不下。', stage: '橱柜设计前' },
    ],
  },
  {
    id: 'garbage-disposal',
    triggers: ['垃圾处理器'],
    sourceNeed: '垃圾处理器',
    points: [
      { room: '厨房', type: 'socket', title: '垃圾处理器电源预留', suggestion: '水槽下方预留电源，并考虑开关控制方式。', quantity: '1', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '厨房', title: '水槽下方空间', reference: '垃圾处理器会占用水槽柜空间，需要和净水器、下水管位置一起考虑。', warning: '水槽柜内设备集中时，建议提前和橱柜商确认布局。', stage: '橱柜设计前' },
    ],
  },
  {
    id: 'robot-vacuum',
    triggers: ['扫地机器人', '扫地机器人位置'],
    sourceNeed: '扫地机器人',
    points: [
      { room: '玄关/阳台/客厅', type: 'socket', title: '扫地机器人充电位', suggestion: '选择一个不影响通行的位置，预留电源，最好提前考虑柜体底部是否留空。', quantity: '1', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '玄关/阳台/客厅', title: '机器人停靠空间', reference: '需要提前预留机器人基站宽度、高度和前方回转空间。', warning: '如果藏进柜子，柜体底部高度和深度要提前确认。', stage: '定制柜复尺前' },
    ],
  },
  {
    id: 'smart-toilet',
    triggers: ['智能马桶'],
    sourceNeed: '智能马桶',
    points: [
      { room: '卫生间', type: 'socket', title: '智能马桶插座预留', suggestion: '马桶侧后方预留防溅插座，具体位置结合马桶型号和水电师傅确认。', quantity: '1', stage: '水电前', importance: 'high' },
      { room: '卫生间', type: 'waterIn', title: '智能马桶水路确认', suggestion: '确认水压、角阀位置、坑距和排污方式。', quantity: '1', stage: '水电前', importance: 'high' },
    ],
    dimensions: [
      { room: '卫生间', title: '马桶坑距和插座位置', reference: '智能马桶需要提前确认坑距、插座位置、水压和安装空间。', warning: '不要等贴完砖才发现插座没留或位置不合适。', stage: '水电前' },
    ],
  },
  {
    id: 'heated-towel-rack',
    triggers: ['电热毛巾架'],
    sourceNeed: '电热毛巾架',
    points: [
      { room: '卫生间', type: 'socket', title: '电热毛巾架插座预留', suggestion: '在毛巾架安装位置附近预留防溅电源。', quantity: '1', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '卫生间', title: '毛巾架安装位置', reference: '需要提前确认墙面宽度、插座位置和是否会影响开门或淋浴区。', warning: '结合实际墙面、门扇和淋浴区尺寸确认。', stage: '水电前' },
    ],
  },
  {
    id: 'projector',
    triggers: ['投影', '投影仪', '家庭影院', '卧室投影'],
    sourceNeed: '投影',
    points: [
      { room: '客厅/卧室', type: 'socket', title: '投影仪电源预留', suggestion: '根据吊装、壁挂或摆放方式预留电源。', quantity: '1', stage: '水电前', importance: 'medium' },
      { room: '客厅/卧室', type: 'network', title: '投影网络或信号线预留', suggestion: '如果需要更稳定的网络或连接设备，提前考虑网线/HDMI/管线。', quantity: '1', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '客厅/卧室', title: '投影距离和幕布位置', reference: '需要根据投影仪参数、客厅开间、幕布尺寸确认安装位置。', warning: '如果做吊顶或隐藏幕布，要提前和木工/吊顶方案衔接。', stage: '设计前' },
    ],
  },
  {
    id: 'tv',
    triggers: ['电视', '卧室电视'],
    sourceNeed: '电视',
    points: [
      { room: '客厅/卧室', type: 'socket', title: '电视墙插座预留', suggestion: '根据电视安装方式和电视柜高度预留插座，尽量避免外露线。', quantity: '2-4', stage: '水电前', importance: 'medium' },
      { room: '客厅/卧室', type: 'network', title: '电视墙网线预留', suggestion: '如果看电视、游戏或投屏需求较高，可以预留网线。', quantity: '1', stage: '水电前', importance: 'low' },
    ],
    dimensions: [
      { room: '客厅/卧室', title: '电视墙插座和电视柜高度', reference: '电视柜高度、电视安装高度、插座隐藏位置需要一起确认。', warning: '结合电视尺寸和安装方式确认，不建议只按通用高度施工。', stage: '水电前' },
    ],
  },
  {
    id: 'electric-curtain',
    triggers: ['电动窗帘'],
    sourceNeed: '电动窗帘',
    points: [
      { room: '客厅/卧室', type: 'socket', title: '电动窗帘电源预留', suggestion: '窗帘盒侧边预留电源，左右位置要提前确认。', quantity: '1', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '客厅/卧室', title: '窗帘盒尺寸预留', reference: '单层、双层、电动窗帘对窗帘盒宽度要求不同，需要提前确认。', warning: '无主灯、吊顶、窗帘盒要一起考虑。', stage: '木工前' },
    ],
  },
  {
    id: 'hvac',
    triggers: ['中央空调', '风管机', '新风'],
    sourceNeed: '中央空调/风管机/新风',
    points: [
      { room: '全屋/对应空间', type: 'appliance', title: '空调/新风设备点位确认', suggestion: '提前确认内机、出风口、回风口、检修口位置。', quantity: '按空间', stage: '设计前', importance: 'high' },
    ],
    dimensions: [
      { room: '全屋/对应空间', title: '吊顶高度和设备检修', reference: '中央空调、风管机、新风会影响吊顶高度、出风口位置和检修口。', warning: '必须在水电和木工前确认方案。', stage: '设计前' },
    ],
  },
  {
    id: 'floor-heating',
    triggers: ['地暖'],
    sourceNeed: '地暖',
    points: [
      { room: '全屋', type: 'appliance', title: '地暖控制器和分集水器位置', suggestion: '提前确认分集水器位置、温控器位置和地面完成面高度。', quantity: '按方案', stage: '设计前', importance: 'high' },
    ],
    dimensions: [
      { room: '全屋', title: '地面完成面高度', reference: '地暖会影响地面厚度、门槛、门洞和柜体尺寸。', warning: '门、柜、地板/瓷砖铺贴都要考虑完成面高度。', stage: '设计前' },
    ],
  },
  {
    id: 'laundry-suite',
    triggers: ['洗衣机', '烘干机', '洗烘套装'],
    sourceNeed: '洗烘套装',
    points: [
      { room: '阳台', type: 'socket', title: '洗衣机/烘干机插座预留', suggestion: '根据叠放或并排方案预留电源。', quantity: '2', stage: '水电前', importance: 'high' },
      { room: '阳台', type: 'waterIn', title: '洗衣机进水预留', suggestion: '提前确认洗衣机位置和龙头位置。', quantity: '1', stage: '水电前', importance: 'high' },
      { room: '阳台', type: 'waterOut', title: '洗衣区排水预留', suggestion: '提前确认洗衣机排水、地漏和洗衣池排水。', quantity: '1', stage: '水电前', importance: 'high' },
    ],
    dimensions: [
      { room: '阳台', title: '洗烘区尺寸预留', reference: '叠放和并排需要不同的宽度、高度和柜体尺寸。', warning: '阳台柜设计前确认设备型号。', stage: '定制柜复尺前' },
    ],
  },
  {
    id: 'small-appliance-zone',
    triggers: ['餐边柜', '小家电区', '厨房小家电很多', '小家电多'],
    sourceNeed: '小家电区',
    points: [
      { room: '餐厅/厨房', type: 'socket', title: '小家电插座预留', suggestion: '餐边柜或厨房台面区域预留足够插座，避免后期插排外露。', quantity: '2-4', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '餐厅/厨房', title: '餐边柜台面和插座高度', reference: '餐边柜高度、插座位置、小家电尺寸要一起考虑。', warning: '定制柜复尺前结合小家电清单确认。', stage: '定制柜复尺前' },
    ],
  },
  {
    id: 'elder-safety',
    triggers: ['有老人居住', '老人扶手', '防滑地砖', '无障碍/防滑设计', '老人房'],
    sourceNeed: '老人居住/防滑',
    points: [
      { room: '卫生间/过道', type: 'lighting', title: '夜间照明预留', suggestion: '老人起夜动线可以考虑感应灯或低位灯。', quantity: '按动线', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '卫生间/过道', title: '卫生间安全尺寸和防滑', reference: '关注防滑地砖、扶手安装位置、门槛高度和通行动线。', warning: '尽量减少高低差。', stage: '设计前' },
    ],
  },
  {
    id: 'storage-heavy',
    triggers: ['需要大量收纳'],
    sourceNeed: '大量收纳',
    minimumStorageSelections: 5,
    points: [
      { room: '玄关/餐厅/阳台', type: 'socket', title: '柜体内插座预留', suggestion: '如果柜体内要放扫地机器人、小家电、吸尘器等，需要提前预留插座。', quantity: '按柜体', stage: '水电前', importance: 'medium' },
    ],
    dimensions: [
      { room: '全屋', title: '全屋收纳柜体预留', reference: '建议重点规划玄关柜、餐边柜、家政柜、衣柜、阳台柜。', warning: '定制柜复尺前要确认家电、行李箱、清洁工具等尺寸。', stage: '设计前' },
    ],
  },
];

function generateLinkedPlanning(needs = {}) {
  const selectedNeeds = collectSelectedNeeds(needs);
  const triggeredRules = DECISION_LINKED_PLANNING_RULES
    .map(rule => ({ rule, sourceNeed: findTriggeredNeed(rule, selectedNeeds, needs) }))
    .filter(item => item.sourceNeed);

  const pointPlanItems = [];
  const dimensionReferenceItems = [];

  triggeredRules.forEach(({ rule, sourceNeed }) => {
    (rule.points || []).forEach((point, index) => {
      pointPlanItems.push(normalizePointPlanItem({
        ...point,
        id: createPlanningId('point', rule.id, index),
        autoKey: createAutoKey('point', rule.id, point.title, point.room, point.type),
        sourceNeed: point.sourceNeed || sourceNeed || rule.sourceNeed,
        manual: false,
      }));
    });

    (rule.dimensions || []).forEach((dimension, index) => {
      dimensionReferenceItems.push(normalizeDimensionReferenceItem({
        ...dimension,
        id: createPlanningId('dimension', rule.id, index),
        autoKey: createAutoKey('dimension', rule.id, dimension.title, dimension.room, ''),
        sourceNeed: dimension.sourceNeed || sourceNeed || rule.sourceNeed,
        manual: false,
      }));
    });
  });

  return {
    pointPlanItems: dedupeByAutoKey(pointPlanItems),
    dimensionReferenceItems: dedupeByAutoKey(dimensionReferenceItems),
    stageReminders: buildStagePlanningReminders(pointPlanItems, dimensionReferenceItems),
  };
}

function mergeLinkedPlanning(existingPointItems = [], existingDimensionItems = [], generated = {}) {
  return {
    pointPlanItems: mergePlanningItems(
      existingPointItems.map(normalizePointPlanItem),
      (generated.pointPlanItems || []).map(normalizePointPlanItem),
      ['quantity', 'userNote', 'confirmed'],
    ),
    dimensionReferenceItems: mergePlanningItems(
      existingDimensionItems.map(normalizeDimensionReferenceItem),
      (generated.dimensionReferenceItems || []).map(normalizeDimensionReferenceItem),
      ['userNote', 'confirmed'],
    ),
  };
}

function buildStagePlanningReminders(pointItems = [], dimensionItems = []) {
  const byStage = new Map();
  const add = (item, description) => {
    if (!item || !item.stage) return;
    if (!byStage.has(item.stage)) {
      byStage.set(item.stage, {
        id: `stage-${item.stage}`,
        stage: item.stage,
        title: `${item.stage}必须确认事项`,
        items: [],
        relatedNeeds: [],
      });
    }
    const bucket = byStage.get(item.stage);
    bucket.items.push(description);
    if (item.sourceNeed && item.sourceNeed !== '手动新增' && !bucket.relatedNeeds.includes(item.sourceNeed)) {
      bucket.relatedNeeds.push(item.sourceNeed);
    }
  };

  pointItems.forEach(item => {
    const label = DECISION_POINT_TYPE_LABELS[item.type] || '其他';
    add(item, `${item.room}｜${label}｜${item.title}${item.quantity ? `（数量：${item.quantity}）` : ''}`);
  });
  dimensionItems.forEach(item => {
    add(item, `${item.room}｜尺寸参考｜${item.title}`);
  });

  return [...byStage.values()].sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage));
}

function collectSelectedNeeds(needs = {}) {
  const selected = [];
  Object.entries(needs || {}).forEach(([sectionId, value]) => {
    (value?.selected || []).forEach(label => {
      if (label) selected.push({ sectionId, label });
    });
  });
  return selected;
}

function findTriggeredNeed(rule, selectedNeeds, needs) {
  const hit = selectedNeeds.find(item => (rule.triggers || []).includes(item.label));
  if (hit) return hit.label;

  const storageCount = (needs.storage?.selected || []).length;
  if (rule.minimumStorageSelections && storageCount >= rule.minimumStorageSelections) {
    return rule.sourceNeed || '大量收纳';
  }
  return '';
}

function mergePlanningItems(existingItems, generatedItems, preserveFields) {
  const existingByKey = new Map();
  const manualItems = [];

  existingItems.forEach(item => {
    const normalized = { ...item };
    if (normalized.manual || normalized.sourceNeed === '手动新增' || String(normalized.id || '').startsWith('custom-')) {
      manualItems.push(normalized);
      return;
    }
    existingByKey.set(getPlanningMatchKey(normalized), normalized);
  });

  const merged = generatedItems.map(item => {
    const previous = existingByKey.get(getPlanningMatchKey(item));
    if (!previous) return item;
    const next = { ...item };
    preserveFields.forEach(field => {
      const value = previous[field];
      if (value !== undefined && value !== null && value !== '') next[field] = value;
      if (field === 'confirmed') next[field] = Boolean(previous[field]);
    });
    return next;
  });

  return [...merged, ...manualItems];
}

function normalizePointPlanItem(item = {}) {
  return {
    id: item.id || createPlanningId('point', item.sourceNeed || 'custom', item.title || Date.now()),
    room: item.room || '未指定',
    sourceNeed: item.sourceNeed || '手动新增',
    type: DECISION_POINT_TYPES.includes(item.type) ? item.type : 'other',
    title: item.title || '未命名点位',
    suggestion: item.suggestion || '',
    quantity: item.quantity == null ? '' : String(item.quantity),
    stage: DECISION_PLANNING_STAGES.includes(item.stage) ? item.stage : '水电前',
    importance: ['high', 'medium', 'low'].includes(item.importance) ? item.importance : 'medium',
    userNote: item.userNote || '',
    confirmed: Boolean(item.confirmed),
    autoKey: item.autoKey || createAutoKey('point', item.sourceNeed || 'custom', item.title || '', item.room || '', item.type || ''),
    manual: Boolean(item.manual),
  };
}

function normalizeDimensionReferenceItem(item = {}) {
  return {
    id: item.id || createPlanningId('dimension', item.sourceNeed || 'custom', item.title || Date.now()),
    room: item.room || '未指定',
    sourceNeed: item.sourceNeed || '手动新增',
    title: item.title || '未命名尺寸参考',
    reference: item.reference || '',
    warning: item.warning || '',
    stage: DECISION_PLANNING_STAGES.includes(item.stage) ? item.stage : '设计前',
    userNote: item.userNote || '',
    confirmed: Boolean(item.confirmed),
    autoKey: item.autoKey || createAutoKey('dimension', item.sourceNeed || 'custom', item.title || '', item.room || '', ''),
    manual: Boolean(item.manual),
  };
}

function dedupeByAutoKey(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.autoKey || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getPlanningMatchKey(item) {
  return item.autoKey || `${item.sourceNeed}|${item.room}|${item.type || ''}|${item.title}`;
}

function createPlanningId(prefix, ruleId, index) {
  return `${prefix}-${String(ruleId).replace(/[^a-z0-9-]/gi, '-')}-${index}`;
}

function createAutoKey(kind, ruleId, title, room, type) {
  return [kind, ruleId, title, room, type].filter(Boolean).join('|');
}

function stageOrder(stage) {
  const index = DECISION_PLANNING_STAGES.indexOf(stage);
  return index === -1 ? DECISION_PLANNING_STAGES.length : index;
}

if (typeof window !== 'undefined') {
  window.DECISION_LINKED_PLANNING_DISCLAIMER = DECISION_LINKED_PLANNING_DISCLAIMER;
  window.DECISION_POINT_TYPE_LABELS = DECISION_POINT_TYPE_LABELS;
  window.DECISION_POINT_TYPES = DECISION_POINT_TYPES;
  window.DECISION_PLANNING_STAGES = DECISION_PLANNING_STAGES;
  window.DECISION_IMPORTANCE_LABELS = DECISION_IMPORTANCE_LABELS;
  window.DECISION_LINKED_PLANNING_RULES = DECISION_LINKED_PLANNING_RULES;
  window.generateLinkedPlanning = generateLinkedPlanning;
  window.mergeLinkedPlanning = mergeLinkedPlanning;
  window.buildStagePlanningReminders = buildStagePlanningReminders;
}
