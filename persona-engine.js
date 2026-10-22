(function (root, factory) {
  'use strict';
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root && typeof root === 'object') root.KeepsPersonaEngine = engine;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const version = 'p1';
  const scoreNote = '这是原创生活偏好小游戏，刻度来自本次选择，不是概率，也不代表 MBTI 或心理测评结论。50 表示两端偏好混合；角色仅作趣味参考。';
  const axes = [
    { key: 'company', label: '同行方式', left: '独享', right: '搭子', leftCode: 'D', rightCode: 'B', explanation: '这一餐，你更想把时间留给自己，还是与喜欢的人一起分享？' },
    { key: 'ritual', label: '小事仪式', left: '随性', right: '仪式', leftCode: 'S', rightCode: 'Y', explanation: '一份日常小食，你更喜欢自在随手，还是认真安排一个小仪式？' },
    { key: 'novelty', label: '口味探索', left: '经典', right: '探索', leftCode: 'C', rightCode: 'T', explanation: '熟悉的安心与没试过的新鲜，哪一种更容易打动此刻的你？' },
    { key: 'memory', label: '回忆习惯', left: '当下', right: '收藏', leftCode: 'X', rightCode: 'Z', explanation: '快乐发生之后，你更享受当下，还是喜欢留下一页可回看的记录？' }
  ];

  const questions = [
    { id: 'evening-company', axis: 'company', title: '热薯条刚到手，这个傍晚你想怎么过？', scene: '今天的事情忙完了，接下来有一小段属于你的空闲。', options: [
      { text: '找个靠窗位，安静享受自己的时间', value: -2 },
      { text: '先自己吃两根，有人来再一起聊', value: -1 },
      { text: '问问熟人，要不要顺路来坐一会儿', value: 1 },
      { text: '约上喜欢的人，大家分着吃更开心', value: 2 }
    ] },
    { id: 'little-ceremony', axis: 'ritual', title: '给自己买了份小食，你会如何开场？', scene: '难得不用赶时间，包装袋里正飘出热乎乎的香气。', options: [
      { text: '打开就吃，好吃的第一口最要紧', value: -2 },
      { text: '找个舒服的座位，就可以开始了', value: -1 },
      { text: '摆好杯子和小食，选首此刻想听的歌', value: 1 },
      { text: '挑个喜欢的角落，认真安排今天的小仪式', value: 2 }
    ] },
    { id: 'menu-choice', axis: 'novelty', title: '熟悉的菜单上多了款新品，你怎么选？', scene: '常吃的那款也在，今天可以按自己的心情点单。', options: [
      { text: '还是老搭配，熟悉的味道让我安心', value: -2 },
      { text: '以老搭配为主，换一个小配菜就好', value: -1 },
      { text: '给新品一个位置，再留一份熟悉的', value: 1 },
      { text: '先试没吃过的，说不定就是新惊喜', value: 2 }
    ] },
    { id: 'happy-bite', axis: 'memory', title: '吃到今天最开心的一口，你的下一步是？', scene: '也许是刚出锅的薯条，也许是一口刚刚好的甜。', options: [
      { text: '趁热继续吃，开心就在此刻', value: -2 },
      { text: '心里记一下，偶尔才会拍照', value: -1 },
      { text: '随手留张照，方便以后想起', value: 1 },
      { text: '拍照、写日期，再补一句今天的心情', value: 2 }
    ] },
    { id: 'weekend-company', axis: 'company', title: '周末突然空出半小时，你会把它留给谁？', scene: '路过一家可以坐一会儿的店，天气和心情都还不错。', options: [
      { text: '留给自己，吃点东西放空一会儿', value: -2 },
      { text: '自己待着，有好玩的再发给朋友', value: -1 },
      { text: '找一位聊得来的人，一起短暂充电', value: 1 },
      { text: '看看谁有空，临时来场轻松小聚', value: 2 }
    ] },
    { id: 'ordinary-date', axis: 'ritual', title: '普通的一天，也想奖励自己一下。你会？', scene: '没有纪念日，也不需要很大的理由，一份喜欢的小食就够了。', options: [
      { text: '想到就买，走到哪儿开心到哪儿', value: -2 },
      { text: '按当时的心情来，舒服最重要', value: -1 },
      { text: '专门留一段时间，好好享受这一餐', value: 1 },
      { text: '为它选时间、选位置，把小奖励过得认真', value: 2 }
    ] },
    { id: 'new-combination', axis: 'novelty', title: '有人推荐了一种没试过的吃法，你的反应是？', scene: '这只是一个轻松的小建议，喜欢与否都由你决定。', options: [
      { text: '我有最爱的吃法，今天想继续它', value: -2 },
      { text: '先听听，哪天有心情再做一点变化', value: -1 },
      { text: '留一小份试试，看看会不会喜欢', value: 1 },
      { text: '正好想换换口味，今天就来探索一下', value: 2 }
    ] },
    { id: 'photo-at-night', axis: 'memory', title: '晚上翻到今天的食物照片，你更想怎么处理？', scene: '画面里是很普通的一餐，回想起来却有一点开心。', options: [
      { text: '看一眼笑笑，明天再找新的快乐', value: -2 },
      { text: '随手留在相册里就挺好', value: -1 },
      { text: '挑个喜欢的标签，放进这个月的记录', value: 1 },
      { text: '做成一页手帐，记下日期和那时的故事', value: 2 }
    ] }
  ];

  // 四位原创角色码依次对应：独/伴、随/仪、常/探、现/藏。
  const archetypes = [
    { id: 'DSCX', title: '晚风独享家', subtitle: '一人份的自在，也有刚好的温度', quote: '风慢一点，我也慢一点。', description: '这次选择里的你，喜欢给自己留点安静，靠熟悉的味道轻松充电。浪漫可以是一段不用解释、也不用安排满的时间。', tags: ['自在独处', '经典安心', '享受此刻'], mission: '今天给自己留十分钟，吃一口熟悉的小食，再在手帐写下此刻最舒服的一件事。', kind: 'coffee', sprite: 'coffee', accent: '#86624e' },
    { id: 'DSCZ', title: '日常拾光者', subtitle: '把熟悉的小快乐，一点点收好', quote: '普通的一天，也有值得留下的一口。', description: '你喜欢自在地按自己的节奏过日子，也愿意为熟悉的快乐留个位置。那些小小记录，是你送给未来自己的日常来信。', tags: ['自己的节奏', '熟悉味道', '日常留痕'], mission: '拍下今天的一份经典小食，用日期命名这一页，再写一句“今天还不错，因为……”。', kind: 'fries', sprite: 'fries', accent: '#bb8340' },
    { id: 'DSTX', title: '随心探味侠', subtitle: '给自己一点空白，让惊喜路过', quote: '今天的下一口，可以没有剧本。', description: '你乐于一个人自在出发，也愿意试试没遇见过的味道。对你来说，浪漫常常藏在临时起意的小小改变里。', tags: ['随心出发', '尝点新鲜', '即刻开心'], mission: '今天在熟悉的菜单里挑一样没试过的小配菜，尝完用三个词记下真实感受。', kind: 'nuggets', sprite: 'nuggets', accent: '#b67b42' },
    { id: 'DSTZ', title: '灵感打捞员', subtitle: '随手遇见新鲜，随手留下灵感', quote: '路上捡到的快乐，我放进这一页。', description: '你享受独处时的自由探索，也喜欢收藏突然冒出来的小念头。一张照片、一句随手写的话，就能成为下一次出发的灵感。', tags: ['独自探索', '随手记录', '灵感收藏'], mission: '试一种小小的新搭配，为它拍张照片，在今天的手帐里写一个你自创的名字。', kind: 'pie', sprite: 'pie', accent: '#b77b69' },
    { id: 'DYCX', title: '片刻仪式家', subtitle: '认真留一会儿，只为照顾自己', quote: '这一刻，我值得被好好安排。', description: '你偏爱熟悉的安心，也愿意认真对待属于自己的片刻。即使没有旁人见证，一份好好享受的日常，也能带来踏实的浪漫。', tags: ['独处充电', '认真享用', '经典舒心'], mission: '为今天的一餐选一个舒服的位置，认真吃完第一口，再记下当时的声音或光线。', kind: 'breakfast', sprite: 'breakfast', accent: '#ba9850' },
    { id: 'DYCZ', title: '落日收藏家', subtitle: '把熟悉的一餐，留成温柔坐标', quote: '夕阳会落下，这一页会留下。', description: '你喜欢独处的安稳、熟悉的口味，也愿意为回忆多花一点心思。生活里重复出现的小事，经你认真记录，会长成独有的纪念。', tags: ['安静浪漫', '小事仪式', '回忆归档'], mission: '今天找一束喜欢的光，为手边的一餐拍照，写下日期、天气和一句此刻想对自己说的话。', kind: 'cola', sprite: 'cola', accent: '#b77973' },
    { id: 'DYTX', title: '私藏探店家', subtitle: '给新鲜感，安排一个自己的座位', quote: '这一站，只为我的好奇心。', description: '你愿意独自探索新味道，也喜欢把体验安排得妥帖。那些专门为自己留出的新鲜时刻，让普通的一天多一点期待。', tags: ['独立好奇', '认真探索', '体验此刻'], mission: '今天为一个没试过的口味留出专属十分钟，吃完在手帐记下“最意外的一点”。', kind: 'burger', sprite: 'burger', accent: '#a9754c' },
    { id: 'DYTZ', title: '口袋策展人', subtitle: '把自己的新发现，认真办成小展览', quote: '每个新口味，都能有一张小展签。', description: '你把探索当成给自己的礼物，也愿意认真收藏体验。记录对你来说不只是留照片，更是把喜欢的瞬间整理成自己的小小世界。', tags: ['发现新鲜', '个人策展', '认真收藏'], mission: '选一个今天的新发现，把照片、日期和一句品尝笔记排成一页，给这页起个展览名。', kind: 'icecream', sprite: 'icecream', accent: '#b383a4' },
    { id: 'BSCX', title: '快乐组局人', subtitle: '熟悉的人加熟悉的味道，就很开心', quote: '来都来了，一起分两根薯条。', description: '你喜欢轻松自然的相聚，用熟悉的小食让气氛慢慢热起来。无需复杂安排，身边有人一起笑，就已经是你珍惜的当下。', tags: ['轻松相聚', '经典搭子', '当下开心'], mission: '今天和一位熟悉的人分享一份小食，结束后在手帐留下一句你们聊得最开心的话。', kind: 'fries', sprite: 'fries', accent: '#c38e3d' },
    { id: 'BSCZ', title: '老友故事家', subtitle: '同一份老搭配，也能长出新故事', quote: '吃的还是那份，故事又多了一点。', description: '你在自在的相聚里找到安全感，也喜欢把老友之间的小事收好。熟悉的餐桌与味道，是你们不断续写故事的起点。', tags: ['老友常聚', '随性自在', '故事留存'], mission: '想起一位老搭子，写下你们常点的组合，再给今天的手帐补一句“那次一起吃的时候……”。', kind: 'burger', sprite: 'burger', accent: '#ad7958' },
    { id: 'BSTX', title: '即兴冒险家', subtitle: '有人一起，新鲜就更有趣一点', quote: '要不，今天一起试个没试过的？', description: '你愿意和喜欢的人一起尝点新鲜，也享受不预设太多的轻松。浪漫可以是一句临时的邀请，然后两个人一起发现今天的小惊喜。', tags: ['一起尝鲜', '即兴出发', '共享此刻'], mission: '今天和搭子各推荐一个新口味，选一个双方都愿意试的，在手帐里各留一句真实评价。', kind: 'nuggets', sprite: 'nuggets', accent: '#b98441' },
    { id: 'BSTZ', title: '笑点收集员', subtitle: '新口味也好，笑出声的瞬间也好', quote: '这一口的新鲜，配上你刚才的笑。', description: '你喜欢和人自在地探索，也愿意留下相聚时最鲜活的小细节。日后再翻开记录，先想起的可能是味道，也可能是那天大家的笑声。', tags: ['搭子尝鲜', '随手抓拍', '笑点收藏'], mission: '今天分享一个新发现，给这一刻拍张小物照，把聊天里最有趣的一句话放进手帐。', kind: 'cola', sprite: 'cola', accent: '#a97380' },
    { id: 'BYCX', title: '温柔主理人', subtitle: '把熟悉的小聚，照顾得刚刚好', quote: '坐舒服一点，我们慢慢吃。', description: '你喜欢相聚，也愿意为熟悉的人安排一个舒服的片刻。经典的味道、合适的位置、彼此自在的节奏，就是你擅长的生活浪漫。', tags: ['细心相伴', '经典安心', '认真相聚'], mission: '今天给一次小聚选个舒服的时段，听听对方想吃什么，再记下一个让彼此轻松的细节。', kind: 'breakfast', sprite: 'breakfast', accent: '#a99854' },
    { id: 'BYCZ', title: '相聚纪念官', subtitle: '为每一次好好见面，留一张回执', quote: '今天见到了你，值得有一页纪念。', description: '你珍惜熟悉的人与味道，喜欢认真安排相聚，也愿意把共同的日子留存。那些有日期的小记录，是你用心经营关系的温柔方式。', tags: ['珍惜陪伴', '相聚仪式', '共同回忆'], mission: '为今天的一次相伴拍张餐桌照，手帐里写上日期，再留一句想谢谢对方的事。', kind: 'pie', sprite: 'pie', accent: '#b77f6e' },
    { id: 'BYTX', title: '浪漫发起人', subtitle: '把新鲜的小心思，变成一起的体验', quote: '我有个小计划，想和你一起试试。', description: '你乐于和人尝试新鲜，也愿意认真安排一份共享的惊喜。你偏爱的浪漫，是让一个小念头发生，再一起享受它带来的快乐。', tags: ['主动邀约', '新鲜仪式', '共享体验'], mission: '今天向喜欢的搭子发起一个轻量小计划：试一份新品或换一个座位，然后记下现场最开心的一秒。', kind: 'icecream', sprite: 'icecream', accent: '#b4819c' },
    { id: 'BYTZ', title: '生活彩蛋家', subtitle: '一起认真发现，也一起好好记住', quote: '下一个彩蛋，我们一起写进日历。', description: '你愿意把好奇心分享给喜欢的人，也乐于为体验与回忆花心思。新发现有了相伴的人和一页记录，便成了可反复回看的生活彩蛋。', tags: ['共同探索', '认真浪漫', '彩蛋收藏'], mission: '今天与搭子选一个小小的新体验，把一张照片、一句各自的感受和日期做成共同的一页手帐。', kind: 'coffee', sprite: 'coffee', accent: '#8a6c78' }
  ];

  const byId = Object.create(null);
  archetypes.forEach(function (item) { byId[item.id] = item; });
  const keys = axes.map(function (axis) { return axis.key; });

  function dataProperty(object, key) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : undefined;
  }

  function validatedScores(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const ownKeys = Reflect.ownKeys(input);
    if (ownKeys.length !== keys.length || ownKeys.some(function (key) { return !keys.includes(key); })) return null;
    const scores = {};
    for (const key of keys) {
      const score = dataProperty(input, key);
      if (!Number.isInteger(score) || score < 0 || score > 100) return null;
      scores[key] = score;
    }
    return scores;
  }

  function tendency(axis, score) {
    return score === 50 ? axis.left + ' / ' + axis.right + '混合' : score < 50 ? axis.left : axis.right;
  }

  function fromScores(input) {
    try {
      const scores = validatedScores(input);
      if (!scores) return null;
      // 平分固定取右侧角色作展示，但维度仍明确保留“混合”，没有额外概率。
      const code = axes.map(function (axis) { return scores[axis.key] < 50 ? axis.leftCode : axis.rightCode; }).join('');
      const item = byId[code];
      const mixedAxes = axes.filter(function (axis) { return scores[axis.key] === 50; }).map(function (axis) { return axis.key; });
      const axisNotes = axes.map(function (axis) {
        const score = scores[axis.key];
        return { key: axis.key, label: axis.label, score: score, mixed: score === 50, tendency: tendency(axis, score), description: score === 50 ? '这次选择里，' + axis.left + '与' + axis.right + '两端偏好混合。' : '这次选择里更偏向' + tendency(axis, score) + '，刻度不是概率。' };
      });
      return { version: version, id: item.id, code: code, title: item.title, subtitle: item.subtitle, quote: item.quote, description: item.description, tags: item.tags.slice(), mission: item.mission, kind: item.kind, sprite: item.sprite, accent: item.accent, scores: scores, mixedAxes: mixedAxes, axisNotes: axisNotes, scoreNote: scoreNote, note: mixedAxes.length ? '混合偏好：' + axes.filter(function (axis) { return mixedAxes.includes(axis.key); }).map(function (axis) { return axis.label; }).join('、') + '。角色按固定规则展示，可同时参考两端特点。' : '角色来自这一次的生活场景选择，偏好也可以随着心情改变。' };
    } catch (_) { return null; }
  }

  function summary(offsets) {
    try {
      if (!Array.isArray(offsets) || offsets.length !== axes.length) return null;
      const scores = {};
      for (let i = 0; i < axes.length; i++) {
        const offset = dataProperty(offsets, String(i));
        if (!Number.isInteger(offset) || offset < 0 || offset > 8) return null;
        scores[axes[i].key] = Math.round(offset / 8 * 100);
      }
      return fromScores(scores);
    } catch (_) { return null; }
  }

  function calculate(answers) {
    try {
      if (!Array.isArray(answers) || answers.length !== questions.length) return null;
      const sums = { company: 0, ritual: 0, novelty: 0, memory: 0 };
      for (let i = 0; i < questions.length; i++) {
        const answer = dataProperty(answers, String(i));
        if (!Number.isInteger(answer) || answer < 0 || answer > 3) return null;
        sums[questions[i].axis] += questions[i].options[answer].value;
      }
      return summary(keys.map(function (key) { return sums[key] + 4; }));
    } catch (_) { return null; }
  }

  function canonicalResult(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    if (dataProperty(input, 'version') !== version) return null;
    const result = fromScores(dataProperty(input, 'scores'));
    if (!result || dataProperty(input, 'id') !== result.id || dataProperty(input, 'code') !== result.code) return null;
    return result;
  }

  function encode(input) {
    try {
      const result = canonicalResult(input);
      if (!result) return null;
      return version + '.' + result.code + '.' + keys.map(function (key) { return result.scores[key].toString(36).padStart(2, '0'); }).join('');
    } catch (_) { return null; }
  }

  function decode(token) {
    try {
      if (typeof token !== 'string' || token.length !== 16) return null;
      const parts = /^p1.([A-Z]{4}).([0-9a-z]{8})$/.exec(token);
      if (!parts || !Object.prototype.hasOwnProperty.call(byId, parts[1])) return null;
      const scores = {};
      keys.forEach(function (key, index) { scores[key] = parseInt(parts[2].slice(index * 2, index * 2 + 2), 36); });
      const result = fromScores(scores);
      return result && result.id === parts[1] && encode(result) === token ? result : null;
    } catch (_) { return null; }
  }

  function compare(first, second) {
    try {
      const a = typeof first === 'string' ? decode(first) : canonicalResult(first);
      const b = typeof second === 'string' ? decode(second) : canonicalResult(second);
      if (!a || !b) return null;
      const shared = [], differences = [];
      axes.forEach(function (axis) {
        const aSide = tendency(axis, a.scores[axis.key]), bSide = tendency(axis, b.scores[axis.key]);
        if (aSide === bSide) shared.push(axis.label + '：你们都' + (a.scores[axis.key] === 50 ? '兼具「' + axis.left + '」与「' + axis.right + '」的偏好。' : '偏向「' + aSide + '」。'));
        else differences.push(axis.label + '：你偏向「' + aSide + '」，好友偏向「' + bSide + '」。');
      });
      return { title: shared.length === 4 ? '同频的小日常' : shared.length === 0 ? '两种节奏，一起尝尝' : '快乐可以互相借一点', description: shared.length === 4 ? '这次选择里，四个生活维度都有共同习惯。下次可以一起选一个舒服的小计划。' : shared.length === 0 ? '这次选择里，你们呈现不同的生活偏好。可以从一件双方都舒服的小事开始。' : '这次选择里，你们在' + shared.length + '个维度有相近倾向，也保留着各自的生活节奏。', shared: shared, differences: differences };
    } catch (_) { return null; }
  }

  function safeUrl(input, allowFragment) {
    if (typeof input !== 'string' || !input || input.trim() !== input || /[\u0000-\u001f\u007f]/.test(input)) return null;
    const url = allowFragment && input.startsWith('#persona?') ? new URL(input, 'https://share.invalid/') : new URL(input);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url : null;
  }

  function buildShareUrl(base, input) {
    try {
      const token = encode(input), url = safeUrl(base, false);
      if (!token || !url) return null;
      // 清除来源页面查询串，避免把临时凭证、搜索词或订单上下文带到分享里。
      url.search = '';
      url.hash = 'persona?v=' + version + '&r=' + token;
      return url.href;
    } catch (_) { return null; }
  }

  function readShareUrl(input) {
    try {
      const url = safeUrl(input, true);
      if (!url || !url.hash.startsWith('#persona?')) return null;
      const params = new URLSearchParams(url.hash.slice('#persona?'.length));
      const entries = Array.from(params.entries());
      if (entries.length !== 2 || params.getAll('v').length !== 1 || params.getAll('r').length !== 1 || params.get('v') !== version) return null;
      return decode(params.get('r'));
    } catch (_) { return null; }
  }

  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }

  return deepFreeze({ version: version, scoreNote: scoreNote, axes: axes, questions: questions, archetypes: archetypes, calculate: calculate, fromScores: fromScores, calculateFromScores: fromScores, summary: summary, encode: encode, decode: decode, compare: compare, buildShareUrl: buildShareUrl, readShareUrl: readShareUrl });
});
