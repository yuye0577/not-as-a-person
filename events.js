/* =========================================================================
   events.js —— 事件数据层（对应 GameEngine → EventManager → events.js → Event Data）

   这是纯数据文件，不包含任何调度/筛选/抽样逻辑（那些在 event-manager.js 里）。
   数据直接来自 EVENTS.md 的字段规格：id / category / name / rarity /
   animalWeight(★换算成 1~5 的数字) / triggerTime / weather / precondition /
   emotionTag / perception(按物种) / choices。

   EVENTS.md 永远作为设计文档维护；本文件是"程序实际读取的数据源"，由 EVENTS.md
   人工同步而来（EVENTS.md 是 Markdown，程序不直接解析 Markdown）。以后新增/删除/
   修改事件，只需要改这个文件（或者先改 EVENTS.md 再同步过来），不需要动
   event-manager.js 或 index.html 里的任何一行游戏逻辑。

   choice.apply 是三层状态（生理/情绪/社会，见 DESIGN.md 第6节）的变化量；
   choice.feedback 是"当下感受"文案，现在时——EVENTS.md 目前没有单独的
   "回忆片段"字段，Today's Memory 直接复用 feedback 作为回忆素材，没有为此
   新增事件或修改文档。

   ⚠️ 当前只包含 EVENTS.md 里已经写完的 19 个事件（EVENTS.md 目标规模是 87 个，
   其余条目在 EVENTS.md 里还标注着"待补充"，尚未成文，因此没有转录进来——
   没有凭空新增事件）。之后 EVENTS.md 补齐更多事件时，往下方数组里追加对象即可，
   不需要改任何其他文件。
   ========================================================================= */

// 稀有度 → 抽样权重，对应 EVENTS.md"稀有度分层"表格里的百分比
const EVENT_RARITY_WEIGHT = { Common: 60, Uncommon: 25, Rare: 10, Secret: 5 };

// 情绪标签 → 中文形容词，供 Today's Memory 的"高频情绪/高光时刻"两句文案使用
const EVENT_EMOTION_ZH = {
  Expectation: '期待', Curiosity: '好奇', Disappointment: '失落', Joy: '开心',
  Comfort: '舒适', Wariness: '警惕', Relief: '安心', Concern: '担心',
  Fear: '害怕', Unease: '不安', Drowsiness: '困倦', Alertness: '警觉',
  Surprise: '惊讶', Happiness: '开心', Serenity: '平静'
};

const EVENTS_LIBRARY = [
  {
    id: 'EAT-001', category: 'Eating', name: '厨房的声音', rarity: 'Common', emotionTag: 'Expectation',
    animalWeight: { cat: 5, dog: 5, rabbit: 5 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '你的耳朵动了动——厨房那边传来一阵窸窸窣窣的声音。',
      dog:    '你的鼻子先醒了——空气里飘来一点点、若有若无的味道。',
      rabbit: '你猛地竖起耳朵，浑身一僵——那边好像有什么声音。'
    },
    choices: [
      { label: '起身，往那个方向走去', apply: { physio: { hunger: +25 }, emotion: { curiosity: +10 } }, feedback: '你走过去翻找了一圈，什么也没有，肚子更空了。' },
      { label: '对着那个方向，大声叫了几声', apply: { physio: { hunger: -40 }, emotion: { calm: +20 }, social: { bond: +15, trust: +10 } }, feedback: '脚步声靠近了，接着你听见了碗碰撞的声音——吃到了。' },
      { label: '没有动，又闭上了眼睛', apply: { physio: { fatigue: -10 }, emotion: { calm: +5 } }, feedback: '困意还没散，你又蜷缩回了原来的姿势。' }
    ]
  },
  {
    id: 'EAT-002', category: 'Eating', name: '闻到饭香', rarity: 'Common', emotionTag: 'Curiosity',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Noon', 'Evening'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '一阵陌生又诱人的味道飘了过来。',
      dog:    '你的鼻子拼命抽动——这味道太好闻了。',
      rabbit: '你闻到了一点新的气味，耳朵转向了那个方向。'
    },
    choices: [
      { label: '循着味道找过去', apply: { emotion: { curiosity: +15 }, physio: { fatigue: +5 } }, feedback: '你找了一圈，没找到源头，但闻了个够。' },
      { label: '原地深深吸了口气，没挪窝', apply: { emotion: { calm: +10 } }, feedback: '你就这么闻着，也很满足。' }
    ]
  },
  {
    id: 'EAT-003', category: 'Eating', name: '空空的碗', rarity: 'Uncommon', emotionTag: 'Disappointment',
    animalWeight: { cat: 3, dog: 4, rabbit: 3 }, triggerTime: ['Noon', 'Evening', 'Night'], weather: ['Any'],
    precondition: (s) => s.physio.hunger > 60,
    perception: {
      cat:    '你低头看了看碗，空的。',
      dog:    '碗被舔得叮当响，还是空的。',
      rabbit: '草料架上只剩下一点点碎屑。'
    },
    choices: [
      { label: '守在碗边等', apply: { physio: { hunger: +10 }, emotion: { tension: +5 } }, feedback: '你等了好一会儿，什么都没发生。' },
      { label: '走开，去做别的事', apply: { emotion: { calm: +5 } }, feedback: '你转身去找点别的事情做。' }
    ]
  },
  {
    id: 'EAT-004', category: 'Eating', name: '醒来的咕噜声', rarity: 'Common', emotionTag: 'Expectation',
    animalWeight: { cat: 4, dog: 5, rabbit: 3 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '肚子里咕噜了一声，你动了动耳朵，没有立刻睁眼。',
      dog:    '肚子发出一声闷响，鼻子已经先动了起来，四处嗅着。',
      rabbit: '肚子空空的感觉让你有点坐立不安，鼻子动个不停。'
    },
    choices: [
      { label: '起身，去碗那边看看', apply: { physio: { hunger: +5 }, emotion: { curiosity: +5 } }, feedback: '你走过去看了看，碗还是空的，但你已经完全醒了。' },
      { label: '没有起身，又趴了回去', apply: { physio: { fatigue: -10 }, emotion: { calm: +10 } }, feedback: '你没有起身，那阵咕噜声很快就过去了。' }
    ]
  },
  {
    id: 'PLY-001', category: 'Play', name: '会动的毛线球', rarity: 'Common', emotionTag: 'Joy',
    animalWeight: { cat: 5, dog: 4, rabbit: 2 }, triggerTime: ['Morning', 'Noon', 'Evening'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '眼角余光扫到，一个东西轻轻晃动了一下。',
      dog:    '你听见一个熟悉的、会发出声响的东西被碰了一下。',
      rabbit: '眼前忽然有什么东西动了一下，你整个身体绷紧了一瞬。'
    },
    choices: [
      { label: '扑过去，追着它转圈', apply: { physio: { hunger: +10 }, emotion: { curiosity: +15, calm: +5 } }, feedback: '你追着它转了好几圈，玩得气喘吁吁。' },
      { label: '看了一眼，没什么兴趣', apply: { emotion: { calm: +10 } }, feedback: '你看了一眼，没什么兴趣，又趴了回去。' }
    ]
  },
  {
    id: 'PLY-002', category: 'Play', name: '纸箱子', rarity: 'Uncommon', emotionTag: 'Comfort',
    animalWeight: { cat: 5, dog: 2, rabbit: 1 }, triggerTime: ['Any'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '一个方方正正的新东西出现在地上。',
      dog:    '你闻了闻，是个没见过的纸箱子。',
      rabbit: '那个大大的东西让你有点紧张。'
    },
    choices: [
      { label: '钻进去待着', apply: { emotion: { calm: +20 }, social: { dependence: +5 } }, feedback: '你钻进去之后，整个人都放松了下来。' },
      { label: '绕着它走了一圈', apply: { emotion: { curiosity: +10 } }, feedback: '你绕了一圈，确认没什么危险。' },
      { label: '躲得远远的', apply: { emotion: { tension: +10 }, physio: { safety: +10 } }, feedback: '你离得远远的，警惕地观察着。' }
    ]
  },
  {
    id: 'PLY-009', category: 'Play', name: '绕圈跑跳', rarity: 'Common', emotionTag: 'Joy',
    animalWeight: { cat: 5, dog: 5, rabbit: 4 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '一股劲儿突然涌了上来，你浑身都痒痒的，很想动一动。',
      dog:    '浑身的劲儿没处使，你尾巴甩得飞快。',
      rabbit: '后腿突然痒痒的，你浑身绷紧，很想跳一跳。'
    },
    choices: [
      { label: '尽情跑跳，把这股劲儿都释放出来', apply: { physio: { fatigue: +15 }, emotion: { calm: +10 } }, feedback: '你跑跳了好一阵，气喘吁吁地停了下来，心里很痛快。' },
      { label: '忍住，没有动', apply: { emotion: { tension: +5 } }, feedback: '你忍住了，没有动，但那股劲儿还留在身体里。' }
    ]
  },
  {
    id: 'EXP-001', category: 'Explore', name: '地上的光斑', rarity: 'Common', emotionTag: 'Curiosity',
    animalWeight: { cat: 5, dog: 2, rabbit: 2 }, triggerTime: ['Noon'], weather: ['Sunny'], precondition: null,
    perception: {
      cat:    '地上有一小块光在动。',
      dog:    '你没太注意，鼻子还在别处。',
      rabbit: '地上的光让你有点在意，又不敢太靠近。'
    },
    choices: [
      { label: '扑上去追那块光', apply: { emotion: { curiosity: +20 }, physio: { fatigue: +10 } }, feedback: '你扑了几次都扑空，但玩得很起劲。' },
      { label: '盯着看了一会儿，没动', apply: { emotion: { curiosity: +8 } }, feedback: '你盯着看了一会儿，觉得没意思了。' }
    ]
  },
  {
    id: 'EXP-002', category: 'Explore', name: '墙角的影子', rarity: 'Common', emotionTag: 'Wariness',
    animalWeight: { cat: 4, dog: 3, rabbit: 4 }, triggerTime: ['Evening'], weather: ['Sunny'], precondition: null,
    perception: {
      cat:    '墙角的影子变长了，形状有点陌生。',
      dog:    '影子晃了一下，你抬头看了看。',
      rabbit: '那道影子让你心里一紧。'
    },
    choices: [
      { label: '走过去闻一闻/看一看', apply: { emotion: { curiosity: +15, tension: -5 } }, feedback: '你凑近了才发现，只是自己的影子。' },
      { label: '远远地看着，没有靠近', apply: { emotion: { tension: +5 } }, feedback: '你远远看着，直到它慢慢消失。' }
    ]
  },
  {
    id: 'EXP-003', category: 'Explore', name: '窗边的小鸟', rarity: 'Common', emotionTag: 'Curiosity',
    animalWeight: { cat: 5, dog: 2, rabbit: 2 }, triggerTime: ['Morning', 'Noon'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '窗外飞过一只鸟，你的瞳孔一下子放大，尾巴尖轻轻抖动。',
      dog:    '窗外似乎有点动静，可你的鼻子还埋在地上，没怎么在意。',
      rabbit: '窗边闪过一个影子，你的耳朵唰地转了过去，整个身体僵住。'
    },
    choices: [
      { label: '悄悄靠近', apply: { emotion: { curiosity: +20 }, physio: { fatigue: +5 } }, feedback: '你贴到窗边的时候，鸟已经飞走了。' },
      { label: '继续观察', apply: { emotion: { curiosity: +15 } }, feedback: '你盯着那个方向看了很久，直到它彻底消失。' },
      { label: '不理它', apply: { emotion: { calm: +5 } }, feedback: '你看都没看，继续做自己的事。' }
    ]
  },
  {
    id: 'EXP-009', category: 'Explore', name: '不一样的光线角度', rarity: 'Common', emotionTag: 'Surprise',
    animalWeight: { cat: 5, dog: 2, rabbit: 2 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '光线的角度和往常不太一样，你眯起眼睛，多看了两眼。',
      dog:    '地上的光斑换了个位置，你抬头看了看。',
      rabbit: '光线落下来的样子有点陌生，你耳朵动了动。'
    },
    choices: [
      { label: '走近，顺着光线看了看', apply: { emotion: { curiosity: +15 } }, feedback: '你顺着光线找了一圈，只是角度变了，没什么特别的。' },
      { label: '只是留意到，没有多想', apply: { emotion: { calm: +10 } }, feedback: '你没有多想，很快就不再注意那道光了。' }
    ]
  },
  {
    id: 'OWN-001', category: 'Owner', name: '熟悉的脚步声', rarity: 'Common', emotionTag: 'Relief',
    animalWeight: { cat: 4, dog: 5, rabbit: 3 }, triggerTime: ['Evening'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '门口传来熟悉的脚步声和钥匙转动的声音。',
      dog:    '你还没看到人，尾巴已经先动了起来——是他回来了。',
      rabbit: '脚步声由远及近，你竖起耳朵仔细分辨——是熟悉的脚步。'
    },
    choices: [
      { label: '慢慢走过去，蹭一下', apply: { social: { bond: +20, trust: +15 }, emotion: { calm: +10 } }, feedback: '你慢慢走过去，轻轻蹭了一下他的腿。' },
      { label: '留在原地，只是看着', apply: { social: { trust: +5 }, emotion: { tension: -5 } }, feedback: '你没有过去，只是远远地看着他。' },
      { label: '转身，躲到看不见的地方', apply: { emotion: { tension: +10 }, social: { bond: -5 } }, feedback: '你转身躲了起来，心跳还是有点快。' }
    ]
  },
  {
    id: 'OWN-002', category: 'Owner', name: '主人打电话', rarity: 'Uncommon', emotionTag: 'Concern',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Any'], weather: ['Any'],
    precondition: (s) => s.social.bond > 30,
    perception: {
      cat:    '主人的声音听起来和平时不太一样。',
      dog:    '主人说话的声音里带着点不熟悉的情绪，你竖起了耳朵。',
      rabbit: '陌生的语调让你有点不安。'
    },
    choices: [
      { label: '走过去，趴在主人脚边', apply: { social: { bond: +15, dependence: +10 } }, feedback: '你趴在脚边，声音好像慢慢平静了下来。' },
      { label: '找个地方，安静地待着', apply: { emotion: { calm: +5 } }, feedback: '你在旁边安静待着，没有打扰。' }
    ]
  },
  {
    id: 'OWN-003', category: 'Owner', name: '出门前的响动', rarity: 'Common', emotionTag: 'Concern',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '门口传来一阵窸窸窣窣的响动，你竖起耳朵，安静地听着。',
      dog:    '鞋柜那边传来熟悉的响动，你立刻竖起耳朵，尾巴摇了起来。',
      rabbit: '门口的响动让你浑身一紧，耳朵转向了那个方向。'
    },
    choices: [
      { label: '凑过去，绕着那阵响动打转', apply: { social: { dependence: +10 }, emotion: { tension: +5 } }, feedback: '你绕着他打转，直到听见门关上的声音，屋子里只剩下自己。' },
      { label: '待在原地，没有过去', apply: { emotion: { calm: +5 } }, feedback: '你没有过去，只是听着那阵响动，直到它渐渐消失。' }
    ]
  },
  {
    id: 'OWN-004', category: 'Owner', name: '安静下来的屋子', rarity: 'Common', emotionTag: 'Serenity',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Morning', 'Noon'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '屋子里忽然静了下来，只剩下自己的呼吸声。',
      dog:    '四周一下子空了，连脚步声都听不见了，你绕着屋子转了一圈。',
      rabbit: '屋子安静得能听见自己的心跳，你缩得更紧了一点。'
    },
    choices: [
      { label: '找个能看到门口的地方趴下', apply: { social: { dependence: +5 }, emotion: { calm: +5 } }, feedback: '你趴在能看见门口的地方，安安静静地等着。' },
      { label: '找点自己的事情做', apply: { emotion: { calm: +10 } }, feedback: '你没有多想，找了点自己的事情做，时间就这么过去了。' }
    ]
  },
  {
    id: 'OWN-005', category: 'Owner', name: '顺毛的手', rarity: 'Common', emotionTag: 'Comfort',
    animalWeight: { cat: 4, dog: 5, rabbit: 2 }, triggerTime: ['Any'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '一只手轻轻落在头顶，顺着毛捋了下去。',
      dog:    '一只手揉了揉耳朵后面，力道刚刚好。',
      rabbit: '一只手小心地碰了碰背，动作很轻。'
    },
    choices: [
      { label: '往那只手上蹭了蹭', apply: { social: { bond: +15, trust: +10 }, emotion: { calm: +10 } }, feedback: '你往他的手上蹭了蹭，很舒服。' },
      { label: '没有动，任由它待着', apply: { emotion: { calm: +15 } }, feedback: '你没有动，就这么让他的手留在原地。' }
    ]
  },
  {
    id: 'OWN-006', category: 'Owner', name: '挨着待一会儿', rarity: 'Common', emotionTag: 'Comfort',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Evening', 'Night'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '那个人窝在软软的地方，很久都没挪动，你抬眼看了一下。',
      dog:    '那个人窝在沙发上，一动不动，你竖起耳朵观察了一会儿。',
      rabbit: '那个人在一个地方很久没动，你从窝里探出头看了看。'
    },
    choices: [
      { label: '走过去，挨着待一会儿', apply: { social: { bond: +15 }, physio: { fatigue: +5 }, emotion: { calm: +15 } }, feedback: '你挨着那团温暖待了很久，很踏实。' },
      { label: '留在自己原来的地方', apply: { emotion: { calm: +5 } }, feedback: '你没有过去，只是远远地看着他。' }
    ]
  },
  {
    id: 'ENV-001', category: 'Environment', name: '雷声', rarity: 'Uncommon', emotionTag: 'Fear',
    animalWeight: { cat: 3, dog: 3, rabbit: 5 }, triggerTime: ['Any'], weather: ['Rain'], precondition: null,
    perception: {
      cat:    '一声闷响传来，你的耳朵猛地贴向脑后。',
      dog:    '你吓了一跳，抬头看向窗外。',
      rabbit: '你浑身一颤，立刻缩到了最里面的角落。'
    },
    choices: [
      { label: '躲到一个狭小、看不见外面的地方', apply: { physio: { safety: +15 }, emotion: { tension: -10 } }, feedback: '你缩在角落里，感觉安全一点了。' },
      { label: '靠近主人所在的方向', apply: { social: { dependence: +15 }, emotion: { tension: -15 } }, feedback: '你靠近了熟悉的气味，心跳慢慢平复。' },
      { label: '僵在原地，一动不动', apply: { emotion: { tension: +10 } }, feedback: '你僵住了好一会儿，才敢重新动一下。' }
    ]
  },
  {
    id: 'ENV-002', category: 'Environment', name: '突然下雨', rarity: 'Rare', emotionTag: 'Unease',
    animalWeight: { cat: 4, dog: 3, rabbit: 3 }, triggerTime: ['Any'], weather: ['Rain'], precondition: null,
    perception: {
      cat:    '窗外的光线暗了下来，传来沙沙的声音。',
      dog:    '空气里的味道变了，你的鼻子动了动。',
      rabbit: '外面的声音突然变得很吵，你浑身紧绷。'
    },
    choices: [
      { label: '走到窗边看看', apply: { emotion: { curiosity: +10 } }, feedback: '你看着窗外的雨，出了一会儿神。' },
      { label: '找个更暖和的地方待着', apply: { physio: { fatigue: -10 }, emotion: { calm: +15 } }, feedback: '你找了个暖和的角落，缩了起来。' }
    ]
  },
  {
    id: 'ENV-003', category: 'Environment', name: '哐当作响的窗户', rarity: 'Common', emotionTag: 'Alertness',
    animalWeight: { cat: 4, dog: 3, rabbit: 5 }, triggerTime: ['Any'], weather: ['Wind'], precondition: null,
    perception: {
      cat:    '窗户被风吹得哐当响了一声，你耳朵一下子竖了起来。',
      dog:    '一阵风把门吹得响了一下，你耳朵动了动。',
      rabbit: '哐当一声响，你浑身一颤。'
    },
    choices: [
      { label: '抬头看向声音的方向', apply: { emotion: { curiosity: +10, tension: +5 } }, feedback: '你看了一会儿，只是风，声音很快就停了。' },
      { label: '缩起来，没有去看', apply: { physio: { safety: +10 }, emotion: { tension: -5 } }, feedback: '你缩着没有去看，一直等到那阵声音停下来。' }
    ]
  },
  {
    id: 'RST-001', category: 'Rest', name: '一片阳光', rarity: 'Common', emotionTag: 'Comfort',
    animalWeight: { cat: 5, dog: 3, rabbit: 4 }, triggerTime: ['Noon'], weather: ['Sunny'], precondition: null,
    perception: {
      cat:    '一小片阳光正好落在地上，暖暖的。',
      dog:    '地上有一块被晒得暖暖的地方。',
      rabbit: '阳光照在窝边，暖意一点点渗了过来。'
    },
    choices: [
      { label: '走过去，趴下', apply: { physio: { fatigue: -15, safety: +5 }, emotion: { calm: +20 } }, feedback: '你趴在那片阳光里，暖洋洋的，眼皮渐渐垂了下来。' },
      { label: '懒得挪地方，待在原地', apply: { physio: { fatigue: -5 } }, feedback: '阳光很好，但你懒得挪地方。' }
    ]
  },
  {
    id: 'RST-002', category: 'Rest', name: '打哈欠', rarity: 'Common', emotionTag: 'Drowsiness',
    animalWeight: { cat: 5, dog: 4, rabbit: 4 }, triggerTime: ['Noon', 'Night'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '一阵困意涌了上来，你忍不住打了个哈欠。',
      dog:    '你的眼皮开始打架，打了个大大的哈欠。',
      rabbit: '你的鼻子皱了一下，也跟着犯困了。'
    },
    choices: [
      { label: '找个地方躺平睡一会儿', apply: { physio: { fatigue: -20 }, emotion: { calm: +10 } }, feedback: '你躺平之后，很快就迷迷糊糊地睡着了。' },
      { label: '强撑着，继续待着', apply: { physio: { fatigue: +5 } }, feedback: '你撑着没睡，但还是有点犯困。' }
    ]
  },
  {
    id: 'RST-005', category: 'Rest', name: '赖床', rarity: 'Common', emotionTag: 'Drowsiness',
    animalWeight: { cat: 5, dog: 3, rabbit: 3 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '已经醒了，但很不想睁开眼睛。',
      dog:    '眼皮还很沉，但尾巴已经开始有一下没一下地摇。',
      rabbit: '已经醒了，但你还窝在原来的地方，耳朵动了动。'
    },
    choices: [
      { label: '强迫自己起来', apply: { emotion: { tension: +5, curiosity: +5 } }, feedback: '你撑着站了起来，还是有点没睡醒的感觉，但已经醒着了。' },
      { label: '继续赖着不起来', apply: { physio: { fatigue: -15 }, emotion: { calm: +10 } }, feedback: '你没有起来，又舒服地缩了回去，多赖了一会儿。' }
    ]
  },
  {
    id: 'SOC-001', category: 'Social', name: '门外的陌生人', rarity: 'Uncommon', emotionTag: 'Alertness',
    animalWeight: { cat: 2, dog: 5, rabbit: 2 }, triggerTime: ['Any'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '门外传来一个不熟悉的气味和脚步声。',
      dog:    '陌生的脚步声让你立刻警觉起来，冲到门边。',
      rabbit: '陌生的动静让你立刻缩到最角落。'
    },
    choices: [
      { label: '冲过去看看', apply: { emotion: { tension: +10, curiosity: +10 } }, feedback: '你冲到门边，隔着门大声表达了存在感。' },
      { label: '远远观察', apply: { emotion: { tension: +5 } }, feedback: '你远远地看着，没有靠近。' },
      { label: '躲起来', apply: { physio: { safety: +10 }, emotion: { tension: -5 } }, feedback: '你躲进了最安全的角落，等动静消失。' }
    ]
  },
  {
    id: 'SOC-002', category: 'Social', name: '快递到了', rarity: 'Uncommon', emotionTag: 'Alertness',
    animalWeight: { cat: 2, dog: 5, rabbit: 3 }, triggerTime: ['Any'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '门口传来一阵陌生的响动，很快又安静了。',
      dog:    '外面的声音让你冲过去叫了几声。',
      rabbit: '突如其来的声音让你吓了一跳。'
    },
    choices: [
      { label: '对着门叫了几声', apply: { emotion: { tension: +10 } }, feedback: '你叫了几声，声音很快就消失了。' },
      { label: '好奇地凑近门边闻了闻', apply: { emotion: { curiosity: +10 } }, feedback: '你凑近闻了闻，全是陌生的气味。' }
    ]
  },
  {
    id: 'SOC-008', category: 'Social', name: '另一边的动静', rarity: 'Common', emotionTag: 'Curiosity',
    animalWeight: { cat: 2, dog: 5, rabbit: 2 }, triggerTime: ['Morning'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '另一边传来一点细碎的响动，不像是人的声音。',
      dog:    '一阵不属于人的响动从另一个房间传来，你的耳朵立刻竖了起来。',
      rabbit: '那阵陌生的响动让你浑身一紧，耳朵转向了那个方向。'
    },
    choices: [
      { label: '循着响动，过去看看', apply: { emotion: { curiosity: +15 } }, feedback: '你循着那阵响动找了过去，只是看了看，没有靠近。' },
      { label: '没有理会，继续待着', apply: { emotion: { calm: +5 } }, feedback: '你没有理会，那阵响动很快就没了。' }
    ]
  },
  {
    id: 'RAR-001', category: 'Rare', name: '家里来了客人', rarity: 'Rare', emotionTag: 'Surprise',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Evening'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '家里多了一个不熟悉的人，气味和声音都很陌生。',
      dog:    '来了一个新朋友，你忍不住想凑过去。',
      rabbit: '家里来了陌生人，你一直没敢从窝里出来。'
    },
    choices: [
      { label: '凑过去打个招呼', apply: { social: { trust: +10 }, emotion: { tension: +5 } }, feedback: '你凑过去蹭了蹭，好像还挺友善的。' },
      { label: '找个高处/远处观察', apply: { emotion: { curiosity: +10 } }, feedback: '你远远地看着，没有靠近。' },
      { label: '一直躲着，直到对方离开', apply: { emotion: { tension: +15 }, physio: { safety: +10 } }, feedback: '你一直躲着，直到听见门关上的声音才松了口气。' }
    ]
  },
  {
    id: 'RAR-002', category: 'Rare', name: '熟悉的人一直都在', rarity: 'Rare', emotionTag: 'Happiness',
    animalWeight: { cat: 3, dog: 5, rabbit: 2 }, triggerTime: ['Any'], weather: ['Any'],
    precondition: (s) => s.social.bond > 40,
    perception: {
      cat:    '主人罕见地一直待在家里，没有要出门的样子。',
      dog:    '主人一直没出门，你忍不住跟前跟后。',
      rabbit: '家里的气味和平时不太一样，主人一直都在。'
    },
    choices: [
      { label: '一直跟着主人', apply: { social: { bond: +25, dependence: +15 } }, feedback: '你跟前跟后了好一会儿，很满足。' },
      { label: '照常做自己的事，只是偶尔看看主人在不在', apply: { social: { trust: +10 }, emotion: { calm: +15 } }, feedback: '你偶尔看一眼，确认主人还在，就很安心。' }
    ]
  },
  {
    id: 'RAR-003', category: 'Rare', name: '夜里的月光', rarity: 'Secret', emotionTag: 'Serenity',
    animalWeight: { cat: 5, dog: 2, rabbit: 3 }, triggerTime: ['Night'], weather: ['Any'], precondition: null,
    perception: {
      cat:    '夜里醒来，一束光正好照在地上，很安静。',
      dog:    '你睡得迷迷糊糊，没太注意到那束光。',
      rabbit: '夜里的安静和那束光，让你莫名地醒了很久。'
    },
    choices: [
      { label: '走过去，静静待在那束光里', apply: { emotion: { calm: +20 }, physio: { safety: +10 } }, feedback: '你待在那束光里，整个世界都很安静。' },
      { label: '看了一眼，又继续睡', apply: { physio: { fatigue: -10 } }, feedback: '你看了一眼，觉得没什么特别，又睡了过去。' }
    ]
  }
];

/* =========================================================================
   Ending Framework 专用数据：Alternate Ending（当前唯一的实现是 Death）的内容池，
   不是普通事件，不进入 EVENTS_LIBRARY，也不经过 EventManager 的筛选/加权/抽样
   逻辑——GameEngine 直接按当前动物查找。

   这一刻动物没有选择的余地（这正是它和普通 Event Layer 的区别：普通事件代表
   "动物的本能反应/能动性"，这里代表"这一刻没有能动性"），所以只有一句按物种
   区分的感知层文案，没有 choices。文案只描述感官现象，不解释世界，不出现任何
   直接的结局字样，理解留给玩家（DESIGN.md 第12节 Show, Don't Explain）。

   补充 id：现在只在 dayLog 里被原样记录，暂不消费，是给 Memory / Statistics /
   Secret Ending / Replay 这类"以后可能会读 dayLog"的系统预留的零成本字段，
   不代表现在就要实现这些系统。数组结构（而不是按动物的字典）是为了未来给
   同一种动物追加多条 Alternate Ending 内容时，不需要改数据形状。
   ========================================================================= */
const DEATH_ENDINGS = [
  // 猫：好奇驱使的靠近
  { id: 'DEATH-001', animal: 'cat',    perception: '你追着一点亮光，跑到了从没到过的地方。光越来越近，越来越刺眼。' },
  // 狗：因为信任而靠近
  { id: 'DEATH-002', animal: 'dog',    perception: '一个熟悉的声音在很远的地方响起，你朝着它跑了过去。声音越来越急促，然后，什么都听不见了。' },
  // 兔子：惊慌逃跑中撞入危险
  { id: 'DEATH-003', animal: 'rabbit', perception: '一阵响动让你没命地跑了起来。跑着跑着，周围突然安静了下来。' }
];
