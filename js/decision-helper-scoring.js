// 装修前决策助手 — 评分算法

function calculateDecisionRecommendation(answers = {}) {
  const methods = DECISION_HELPER_DATA.methods;
  const scores = {};
  methods.forEach(method => { scores[method.key] = 0; });

  const add = (key, value) => {
    scores[key] = (scores[key] || 0) + value;
  };
  const applyMap = (field, rules) => {
    const value = answers[field];
    if (!value || !rules[value]) return;
    Object.entries(rules[value]).forEach(([key, score]) => add(key, score));
  };
  const includes = (field, option) => Array.isArray(answers[field]) && answers[field].includes(option);

  applyMap('weeklyTime', {
    '几乎没时间': { fullPackage: 4, designStudio: 3, halfPackage: 1, foreman: -2, selfDecoration: -4 },
    '每周 1-2 次': { fullPackage: 2, halfPackage: 2, designStudio: 2, foreman: 0, selfDecoration: -2 },
    '每周 3-4 次': { halfPackage: 3, foreman: 2, independentDesigner: 2, selfDecoration: 1, fullPackage: 0 },
    '基本可以经常跑工地': { selfDecoration: 4, foreman: 3, halfPackage: 2, independentDesigner: 1, fullPackage: -2 },
  });
  applyMap('budgetLevel', {
    '非常紧张，能省就省': { selfDecoration: 4, foreman: 3, halfPackage: 1, fullPackage: -2, designStudio: -3, independentDesigner: -1 },
    '有明确预算，希望尽量控制': { halfPackage: 3, foreman: 2, selfDecoration: 2, independentDesigner: 1, fullPackage: 0, designStudio: -1 },
    '预算中等，希望效果和价格平衡': { halfPackage: 3, independentDesigner: 3, designStudio: 1, fullPackage: 1, foreman: 1 },
    '预算较充足，更看重效果和省心': { designStudio: 4, fullPackage: 3, independentDesigner: 2, halfPackage: 1, selfDecoration: -2 },
  });
  applyMap('designExpectation', {
    '简单实用就行': { foreman: 2, halfPackage: 2, selfDecoration: 2, fullPackage: 1, independentDesigner: -1, designStudio: -2 },
    '希望好看一点': { halfPackage: 2, independentDesigner: 2, fullPackage: 1, foreman: 1 },
    '要有整体风格': { independentDesigner: 4, designStudio: 3, halfPackage: 2, fullPackage: 1, foreman: -1, selfDecoration: -2 },
    '对效果要求很高': { designStudio: 5, independentDesigner: 4, fullPackage: 1, foreman: -2, selfDecoration: -3 },
  });

  if (['比较需要', '非常需要'].includes(answers.layoutPlanningNeed)) {
    Object.entries({ independentDesigner: 3, designStudio: 4, fullPackage: 1, foreman: -2, selfDecoration: -2 }).forEach(([key, score]) => add(key, score));
  }
  applyMap('designFeeWillingness', {
    '不愿意': { foreman: 2, selfDecoration: 2, halfPackage: 1, independentDesigner: -3, designStudio: -3 },
    '愿意为好设计付费': { designStudio: 4, independentDesigner: 4, halfPackage: 1 },
  });
  applyMap('houseType', {
    '老房翻新': { designStudio: 3, independentDesigner: 2, halfPackage: 2, foreman: 1, selfDecoration: -2 },
    '精装改造': { independentDesigner: 2, designStudio: 2, halfPackage: 1, fullPackage: -1 },
  });
  applyMap('layoutChange', {
    '需要明显改动': { independentDesigner: 3, designStudio: 4, halfPackage: 2, foreman: -1, selfDecoration: -2 },
  });

  const complexSystems = Array.isArray(answers.complexSystems) ? answers.complexSystems.filter(item => item !== '无') : [];
  if (complexSystems.length >= 3) {
    Object.entries({ designStudio: 4, independentDesigner: 2, halfPackage: 2, fullPackage: 1, foreman: -1, selfDecoration: -2 }).forEach(([key, score]) => add(key, score));
  }
  if (includes('complexSystems', '无')) {
    Object.entries({ foreman: 1, halfPackage: 1, selfDecoration: 1 }).forEach(([key, score]) => add(key, score));
  }

  applyMap('decorationKnowledge', {
    '完全不懂': { fullPackage: 3, designStudio: 2, halfPackage: 1, foreman: -2, selfDecoration: -4 },
    '做过一些功课': { halfPackage: 2, foreman: 2, independentDesigner: 1, selfDecoration: 1 },
    '比较了解': { selfDecoration: 4, foreman: 3, halfPackage: 2, independentDesigner: 1 },
  });
  applyMap('workerResource', {
    '没有': { fullPackage: 2, designStudio: 1, halfPackage: 1, foreman: -2, selfDecoration: -2 },
    '有比较靠谱的完整资源': { foreman: 3, selfDecoration: 3, halfPackage: 2, fullPackage: -1 },
  });
  applyMap('expertHelp', {
    '能深度参与': { selfDecoration: 3, foreman: 2, halfPackage: 1 },
  });
  applyMap('communicationSkill', {
    '不擅长': { fullPackage: 3, designStudio: 2, halfPackage: 0, foreman: -2, selfDecoration: -3 },
    '比较擅长': { selfDecoration: 3, foreman: 3, halfPackage: 2 },
  });
  applyMap('involvement', {
    '尽量少参与': { fullPackage: 4, designStudio: 3, halfPackage: 1, foreman: -2, selfDecoration: -4 },
    '关键节点参与': { fullPackage: 2, halfPackage: 3, designStudio: 2, independentDesigner: 1 },
    '大部分环节参与': { halfPackage: 3, foreman: 2, independentDesigner: 2, selfDecoration: 1 },
    '想自己深度掌控': { selfDecoration: 4, foreman: 3, halfPackage: 2, fullPackage: -2 },
  });

  if (includes('fearPoints', '自己太累')) Object.entries({ fullPackage: 3, designStudio: 2, selfDecoration: -3, foreman: -1 }).forEach(([key, score]) => add(key, score));
  if (includes('fearPoints', '效果不好看')) Object.entries({ independentDesigner: 3, designStudio: 3, foreman: -1, selfDecoration: -2 }).forEach(([key, score]) => add(key, score));
  if (includes('fearPoints', '被增项')) Object.entries({ halfPackage: 1, foreman: 1, selfDecoration: 1, fullPackage: -1 }).forEach(([key, score]) => add(key, score));
  if (includes('fearPoints', '工期拖延')) Object.entries({ fullPackage: 1, designStudio: 1, selfDecoration: -1 }).forEach(([key, score]) => add(key, score));
  if (includes('fearPoints', '家人意见不统一')) Object.entries({ independentDesigner: 2, designStudio: 2 }).forEach(([key, score]) => add(key, score));

  const ranked = methods
    .map(method => ({ ...method, score: scores[method.key] || 0 }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-CN'));
  const lowest = [...ranked]
    .filter(item => item.key !== ranked[0].key && item.key !== ranked[1].key)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'zh-CN'))
    .slice(0, 2);
  const gap = ranked[0].score - ranked[1].score;

  return {
    scores,
    ranked,
    top: ranked[0],
    alternative: ranked[1],
    notRecommended: lowest,
    summary: gap <= 2 ? '你适合在这两种方式之间对比选择' : `你的情况更明显倾向于 ${ranked[0].name}`,
    reasons: buildRecommendationReasons(answers, ranked[0], ranked[1]),
    risks: buildRiskReminders(answers, ranked[0].key),
    complexityLevel: calculateComplexityLevel(answers),
    pressureLevel: calculatePressureLevel(answers),
    designNeedLevel: calculateDesignNeedLevel(answers),
  };
}

function buildRecommendationReasons(answers, top, alternative) {
  const reasons = [];
  if (answers.weeklyTime) reasons.push(`你的装修投入时间是“${answers.weeklyTime}”，这会明显影响适合自己管到什么程度。`);
  if (answers.budgetLevel) reasons.push(`你的预算倾向是“${answers.budgetLevel}”，所以推荐会同时考虑省心和控费。`);
  if (answers.designExpectation) reasons.push(`你对设计效果的要求是“${answers.designExpectation}”，这会影响是否需要设计师或设计工作室介入。`);
  if (answers.involvement) reasons.push(`你的参与意愿是“${answers.involvement}”，当前更适合优先考虑 ${top.name}。`);
  if (alternative) reasons.push(`${alternative.name} 可以作为备选方案，对比时重点看报价边界、服务范围和后续落地能力。`);
  if (answers.houseType) reasons.push(`你的房屋类型是“${answers.houseType}”，前期要先确认拆改、水电和主材边界。`);
  if (answers.area) reasons.push(`房屋面积约 ${answers.area}㎡，建议先把预算范围和重点空间排优先级。`);
  if (reasons.length < 3) reasons.push('目前信息还不算完整，补齐预算、时间和设计需求后，推荐会更贴近你的真实情况。');
  if (reasons.length < 3) reasons.push('在正式选择服务方前，建议把报价范围、付款节点和验收标准提前写清楚。');
  return reasons.slice(0, 5);
}

function buildRiskReminders(answers, topKey) {
  const descriptions = DECISION_HELPER_DATA.methodDescriptions[topKey];
  const risks = descriptions ? [descriptions.risks] : [];
  const fearPoints = Array.isArray(answers.fearPoints) ? answers.fearPoints : [];
  if (fearPoints.includes('被增项')) risks.push('你比较担心增项，签约前要把包含、不包含、升级项和付款节点写清楚。');
  if (fearPoints.includes('工期拖延')) risks.push('你比较担心工期，建议把材料到场时间、验收节点和延期处理方式提前约定。');
  if (fearPoints.includes('效果不好看')) risks.push('你比较担心效果，建议用真实案例、图纸清单和落地跟进方式来判断服务方。');
  if (fearPoints.includes('自己太累')) risks.push('你比较担心精力消耗，尽量减少需要你频繁协调的模式。');
  return [...new Set(risks)].slice(0, 5);
}

function calculateComplexityLevel(answers) {
  let score = 0;
  if (['老房翻新', '二手房局改'].includes(answers.houseType)) score += 2;
  if (['需要明显改动', '还不确定'].includes(answers.layoutChange)) score += 2;
  const systems = Array.isArray(answers.complexSystems) ? answers.complexSystems.filter(item => item !== '无') : [];
  if (systems.length >= 3) score += 2;
  if (Number(answers.area) >= 120) score += 1;
  return score >= 5 ? '高' : score >= 2 ? '中' : '低';
}

function calculatePressureLevel(answers) {
  let score = 0;
  if (['基本可以经常跑工地', '每周 3-4 次'].includes(answers.weeklyTime)) score += 2;
  if (['想自己深度掌控', '大部分环节参与'].includes(answers.involvement)) score += 2;
  if (answers.coordinationWillingness === '愿意深度参与') score += 1;
  if (answers.stressTolerance === '很难接受') score -= 1;
  return score >= 4 ? '高' : score >= 2 ? '中' : '低';
}

function calculateDesignNeedLevel(answers) {
  let score = 0;
  if (['要有整体风格', '对效果要求很高'].includes(answers.designExpectation)) score += 2;
  if (['比较需要', '非常需要'].includes(answers.layoutPlanningNeed)) score += 2;
  if (answers.designFeeWillingness === '愿意为好设计付费') score += 1;
  if (answers.effectPreference === '高落地还原度') score += 1;
  return score >= 5 ? '高' : score >= 2 ? '中' : '低';
}

if (typeof window !== 'undefined') {
  window.calculateDecisionRecommendation = calculateDecisionRecommendation;
}
