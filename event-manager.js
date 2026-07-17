/* =========================================================================
   event-manager.js —— 事件调度/筛选层（GameEngine → EventManager → events.js）

   EventManager 是 GameEngine 与事件数据之间唯一的接口：GameEngine 不直接
   访问 EVENTS_LIBRARY，也不知道稀有度权重、星级怎么换算成概率——它只会问
   EventManager"现在该出哪个事件"，然后拿到一个事件对象或 null。

   保留 DESIGN.md 第7节的五层事件层级：
     世界层（写在 events.js 的注释/事实里，玩家看不到）
       → 感知层（event.perception，按物种呈现，EventManager 原样透传，不做改写）
       → 选择层（event.choices，玩家点击）
       → 情绪层（choice.apply，由 GameEngine 调用 applyDelta 落到状态上）
       → 反馈层（choice.feedback，由 GameEngine 展示）
   EventManager 只负责"选出哪个事件"，不触碰、不改写事件内容本身。

   调度规则（对应 EVENTS.md 已定义的字段，全部直接复用，没有推测/新增字段）：
     - 同一局不重复：内部维护 usedIds，用过的事件永远不会在同一天再抽到。
     - 按动物类型筛选/加权：event.animalWeight（★换算的 1~5 权重）。
     - 按时间段筛选：event.triggerTime（Morning/Noon/Evening/Night/Any）。
     - 按前置条件筛选：event.precondition（如 Hunger > 60，Bond > 30）。
     - 按天气筛选：event.weather（Sunny/Rain/Wind/Snow/Any）。
     - 按稀有度加权：EVENT_RARITY_WEIGHT（Common/Uncommon/Rare/Secret）。
     - 跨局多样性：上一局出现过的事件本局适度降权，呼应"每局至少 40% 不同"。
   ========================================================================= */

const EventManager = (function () {
  const library = EVENTS_LIBRARY;           // 来自 events.js，只读
  const rarityWeight = EVENT_RARITY_WEIGHT;  // 来自 events.js
  const emotionZh = EVENT_EMOTION_ZH;        // 来自 events.js

  let usedIds = new Set();         // 本局已出现过的事件 id
  let previousUsedIds = new Set(); // 上一局用过的事件 id，用于跨局多样性降权

  // 当日天气：影响事件筛选，是 EVENTS.md"天气"字段引入的前置需求
  const WEATHER_OPTIONS = [
    { type: 'Sunny', weight: 50 },
    { type: 'Rain', weight: 20 },
    { type: 'Wind', weight: 20 },
    { type: 'Snow', weight: 10 }
  ];

  function rollWeather() {
    const total = WEATHER_OPTIONS.reduce((sum, w) => sum + w.weight, 0);
    let r = Math.random() * total;
    for (const w of WEATHER_OPTIONS) {
      if (r < w.weight) return w.type;
      r -= w.weight;
    }
    return WEATHER_OPTIONS[0].type;
  }

  function findById(id) {
    return library.find(ev => ev.id === id);
  }

  // relaxLevel 只用来放宽"天气"这一条（0=严格匹配天气，1=忽略天气）。
  // "触发时间"和"同一局不重复"永远是硬性条件，绝不放宽——放宽时段会导致
  // 晚上触发"早餐"这类破坏沉浸感的错误（这也是本次修复的一个真实 bug：
  // 旧版本这里曾经有 relaxLevel>=2 时连时段一起忽略，已经删除）。
  function getCandidates({ animal, timePeriod, weather, state, relaxLevel }) {
    return library.filter(ev => {
      if (usedIds.has(ev.id)) return false;
      if (ev.precondition && !ev.precondition(state)) return false;
      const timeOk = ev.triggerTime.includes('Any') || ev.triggerTime.includes(timePeriod);
      if (!timeOk) return false;
      const weatherOk = relaxLevel >= 1 || ev.weather.includes('Any') || ev.weather.includes(weather);
      if (!weatherOk) return false;
      return true;
    });
  }

  // 按"稀有度权重 × 当前动物适用星级"加权抽取；上一局出现过的事件适度降权
  function weightedPick(candidates, animal) {
    const weighted = candidates.map(ev => {
      const animalStars = ev.animalWeight[animal] || 1;
      let w = (rarityWeight[ev.rarity] || 10) * animalStars;
      if (previousUsedIds.has(ev.id)) w *= 0.3;
      return { ev, w };
    });
    const total = weighted.reduce((sum, x) => sum + x.w, 0);
    let r = Math.random() * total;
    for (const item of weighted) {
      if (r < item.w) return item.ev;
      r -= item.w;
    }
    return weighted[weighted.length - 1].ev;
  }

  // 唯一对外暴露的"选下一个事件"入口：context 由 GameEngine 提供
  // （当前动物 / 当前时间段 / 当日天气 / 当前状态）。只在"天气"这一条上
  // 逐步放宽（0→1），时段和"同一局不重复"绝不放宽；如果这个时段确实已经
  // 没有可用事件了，就诚实地返回 null，交给 GameEngine 用 idle 叙事撑住画面，
  // 而不是塞一个时段不对的事件进来
  function pickNext({ animal, timePeriod, weather, state }) {
    for (let relaxLevel = 0; relaxLevel <= 1; relaxLevel++) {
      const candidates = getCandidates({ animal, timePeriod, weather, state, relaxLevel });
      if (candidates.length) return weightedPick(candidates, animal);
    }
    return null;
  }

  function markUsed(id) {
    usedIds.add(id);
  }

  // 新的一天开始：清空"本局已用过"，但不动"上一局用过"（那是跨局多样性用的）
  function resetForNewDay() {
    usedIds = new Set();
  }

  // 一天结束：把这一局用过的事件记为"上一局"，供下一局抽样时降权参考
  function rolloverDay() {
    previousUsedIds = new Set(usedIds);
  }

  function getEmotionLabel(tag) {
    return emotionZh[tag] || tag;
  }

  function getLibrarySize() {
    return library.length;
  }

  return {
    pickNext,
    findById,
    markUsed,
    resetForNewDay,
    rolloverDay,
    rollWeather,
    getEmotionLabel,
    getLibrarySize
  };
})();
