(function () {
  'use strict';
  const E = window.KeepsPersonaEngine, Art = window.KeepsPersonaArt;
  const esc = window.KeepsData.esc;
  const STORE = 'mc-keeps-persona-p1';
  const PUBLIC_URL = 'https://17-log.github.io/mc-keeps/';
  const FRIEND_STORE = 'mc-keeps-persona-friend-p1';
  const journey = { phase: 'intro', step: 0, answers: [], result: null, friend: null, preview: false, hash: null, error: '' };
  let host = null, context = null, listener = null, dialog = null;

  function ownResult() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      if (!saved || !Array.isArray(saved.answers)) return null;
      const result = E.decode(saved.token), calculated = E.calculate(saved.answers);
      return result && calculated && E.encode(calculated) === saved.token ? { result: result, answers: saved.answers.slice() } : null;
    } catch (_) { return null; }
  }
  function remember(result) {
    try { localStorage.setItem(STORE, JSON.stringify({ token: E.encode(result), answers: journey.answers })); }
    catch (_) { notify('结果已生成；浏览器未允许保存，下次可以重新测。'); }
  }
  function notify(message) { if (context && context.toast) context.toast(message); }
  function button(action, label, style, extra) {
    return '<button class="kp-btn ' + (style || '') + '" data-kp="' + action + '" ' + (extra || '') + '>' + label + '</button>';
  }
  function topline(label) {
    return '<div class="kp-topline"><span class="kp-kicker">McKEEPS / LITTLE JOY LAB</span><span class="kp-season">' + esc(label) + '</span></div>';
  }
  function sprite(result, variant) { return Art.svg(result.sprite || result.kind, variant == null ? E.archetypes.findIndex(function (a) { return a.id === result.id; }) % 4 : variant); }
  function shareUrl(result) {
    return E.buildShareUrl(PUBLIC_URL, result);
  }
  function rememberFriend(result) {
    try { if (result) sessionStorage.setItem(FRIEND_STORE, E.encode(result)); else sessionStorage.removeItem(FRIEND_STORE); } catch (_) {}
  }
  function restoreFriend() { try { return E.decode(sessionStorage.getItem(FRIEND_STORE)); } catch (_) { return null; } }
  function qr(url) { const code = qrcode(0, 'M'); code.addData(url); code.make(); return code; }
  function qrMarkup(result) {
    return '<div class="kp-qr" aria-label="打开这张结果卡的二维码">' + qr(shareUrl(result)).createSvgTag({ cellSize: 3, margin: 12, scalable: true }) + '<small>扫码看结果 · 测测自己</small></div>';
  }
  function previewResult(id) {
    const scores = {};
    E.axes.forEach(function (axis, i) { scores[axis.key] = id[i] === axis.rightCode ? 75 : 25; });
    return E.fromScores(scores);
  }
  function intro() {
    const own = ownResult();
    return topline('VOL. 01 / 麦门浪漫人格') +
      (journey.error ? '<p class="kp-preview-notice" role="alert">' + esc(journey.error) + '</p>' : '') +
      '<section class="kp-hero"><div class="kp-hero-copy"><div class="kp-label-line">给日常快乐，一张像素身份证</div>' +
      '<h1 tabindex="-1">你把日子，<br>吃成了哪种<em>浪漫？</em></h1><p>有人把普通周二过成纪念日，有人是快乐的临时发起人。选 8 个生活片刻，遇见你的像素人格。</p>' +
      '<div class="kp-chips"><span>8 道场景题</span><span>16 种快乐人格</span><span>不用登录</span></div><div class="kp-actions">' +
      button('start', '领取我的像素人格 ↗', 'primary') + (own ? button('last', '查看上次的我', 'plain') : '') + '</div>' +
      '<div class="kp-how"><span><b>01</b> 跟着直觉选</span><span><b>02</b> 领一张结果卡</span><span><b>03</b> 找到快乐搭子</span></div></div>' +
      '<div class="kp-hero-art"><span class="kp-live-label">TODAY’S LITTLE JOY</span><div class="kp-scene">' + Art.scene() + '</div></div></section>' +
      '<div class="kp-intro-title"><h2>每一种日常，都有自己的可爱。</h2><small>点开图鉴偷看 · 预览不代表测试结果</small></div>' +
      '<section class="kp-archetypes" aria-label="16种原创快乐人格">' + E.archetypes.map(function (a, i) {
        return '<button class="kp-type-tile" data-kp="preview" data-id="' + a.id + '" aria-label="预览' + a.title + '"><span class="kp-tile-num">' + String(i + 1).padStart(2, '0') + '</span>' + sprite(a) + '<h3>' + esc(a.title) + '</h3><small>' + a.id + '</small></button>';
      }).join('') + '</section>' +
      '<section class="kp-why"><div class="kp-feature"><b>像你的一句话</b><p>把生活习惯写成一个可以认领的小称号。</p></div><div class="kp-feature"><b>朋友也能接着玩</b><p>分享链接直接打开结果，测完看看你们的不同。</p></div><div class="kp-feature"><b>快乐继续发生</b><p>领一个轻量小任务，用照片和日期写进手帐。</p></div></section>' +
      '<p class="kp-footnote">原创生活偏好小游戏，供娱乐和自我表达；不属于 MBTI 或心理诊断。</p>';
  }
  function question() {
    const q = E.questions[journey.step], selected = journey.answers[journey.step];
    return topline('SCENE ' + String(journey.step + 1).padStart(2, '0') + ' / 08') +
      '<div class="kp-quiz-layout"><section class="kp-question-panel"><div class="kp-quiz-meta"><span>麦门浪漫人格</span><span aria-live="polite">' + (journey.step + 1) + ' / 8</span></div><div class="kp-progress" aria-hidden="true"><span style="width:' + ((journey.step + 1) / 8 * 100) + '%"></span></div>' +
      '<small class="kp-question-number">A LITTLE SCENE / ' + String(journey.step + 1).padStart(2, '0') + '</small><h1 tabindex="-1">' + esc(q.title) + '</h1><p class="kp-question-scene">' + esc(q.scene) + '</p>' +
      '<div class="kp-answers" role="group" aria-label="请选择最像自己的一个选项">' + q.options.map(function (a, i) {
        return '<button class="kp-answer" data-kp="answer" data-index="' + i + '" aria-pressed="' + (selected === i) + '"><span class="kp-answer-key">' + 'ABCD'[i] + '</span><span class="kp-answer-text">' + esc(a.text) + '</span></button>';
      }).join('') + '</div><div class="kp-quiz-nav">' + button(journey.step ? 'prev' : 'intro', journey.step ? '← 上一题' : '← 回到首页', 'plain') +
      button('next', journey.step === 7 ? '看看我的人格 ↗' : '下一幕 →', 'primary', selected == null ? 'disabled' : '') + '</div></section>' +
      '<aside class="kp-quiz-side"><div class="kp-mini-orbit">' + Art.svg(['fries', 'coffee', 'burger', 'icecream'][journey.step % 4], journey.step % 4) + '</div><h2>没有标准答案，<br>选此刻更像你的。</h2><p>不需要想成“我应该怎样”。你的第一反应，就很可爱。</p><div class="kp-quiz-dots">' + E.questions.map(function (_, i) { return '<span class="' + (i === journey.step ? 'active' : journey.answers[i] != null ? 'done' : '') + '"></span>'; }).join('') + '</div>' +
      (journey.friend ? '<p>朋友的 <b>' + esc(journey.friend.title) + '</b> 正在等你。测完一起看偏好对照。</p>' : '<p>回答可以返回修改；完成后生成一张专属结果卡。</p>') + '</aside></div>';
  }
  function axisMarkup(result) {
    return E.axes.map(function (axis) {
      const score = result.scores[axis.key];
      return '<div class="kp-axis"><div><span>' + axis.left + ' ← ' + axis.label + ' → ' + axis.right + '</span><b>' + (score === 50 ? '混合偏好' : (score > 50 ? axis.right : axis.left) + '倾向') + '</b></div><div class="kp-axis-track" role="meter" aria-label="' + axis.label + '，0为' + axis.left + '，100为' + axis.right + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + score + '"><span style="width:' + score + '%"></span><i style="left:' + score + '%"></i></div></div>';
    }).join('');
  }
  function scoreDetails(result, personal) {
    return '<details class="kp-detail"><summary>这些刻度怎么来的？' + (personal ? '也可以修改答案' : '') + '</summary><p>每条偏好轴对应 2 题，每个选项记 −2、−1、+1 或 +2。两题之和加 4，再除以 8 转成 0–100 刻度。0 偏向左端，100 偏向右端，50 为混合偏好；不是概率或排名。</p><div><table class="kp-score-table"><thead><tr><th>生活偏好</th><th>本次刻度</th><th>含义</th></tr></thead><tbody>' + E.axes.map(function (a) {
      return '<tr><td>' + a.label + '</td><td>' + result.scores[a.key] + ' / 100</td><td>' + a.left + ' → ' + a.right + '</td></tr>';
    }).join('') + '</tbody></table></div><p>' + esc(result.note) + '</p>' + (personal && journey.answers.length === 8 ? '<div class="kp-review-options">' + E.questions.map(function (q, i) {
      return '<button data-kp="review" data-index="' + i + '"><b>' + (i + 1) + '. ' + esc(q.title) + '</b><small>' + esc(q.options[journey.answers[i]].text) + ' · 修改</small></button>';
    }).join('') + '</div>' : '') + '</details>';
  }
  function comparison(result) {
    const friend = journey.friend;
    if (!friend || journey.phase !== 'result' || journey.preview) return '';
    const c = E.compare(result, friend);
    if (!c) return '';
    return '<section class="kp-comparison"><div class="kp-kicker">YOU + YOUR FRIEND</div><h2>' + esc(c.title) + '</h2><p>' + esc(c.description) + '</p><div class="kp-compare-people"><div>' + sprite(result) + '<b>你 · ' + esc(result.title) + '</b><small>' + result.code + '</small></div><span>×</span><div>' + sprite(friend) + '<b>朋友 · ' + esc(friend.title) + '</b><small>' + friend.code + '</small></div></div><div class="kp-compare-columns"><div><h3>可以一起享受的</h3>' + (c.shared.length ? c.shared.map(function (t) { return '<span class="kp-compare-chip">' + esc(t) + '</span>'; }).join('') : '<p>习惯不同，也可以一起找到新的小乐趣。</p>') + '</div><div><h3>可以互相带一带的</h3>' + (c.differences.length ? c.differences.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') : '<p>这次四个方向都很相近，下次各挑一个小惊喜。</p>') + '</div></div><p>这里只对照两人的本次选择，关系的好坏没有分数。</p></section>';
  }
  function resultPage() {
    const result = journey.result, friendView = journey.phase === 'friend', preview = journey.preview;
    const personal = !preview && !friendView;
    const entries = context.entries || [], own = ownResult();
    const label = preview ? '图鉴预览' : friendView ? '朋友的人格卡' : '我的快乐人格';
    return topline(label + ' / ' + result.code) + (preview ? '<p class="kp-preview-notice">这是图鉴里的示例角色与示例刻度。完成 8 道题，才会生成属于你的结果。</p>' : '') +
      (friendView ? '<div class="kp-friend-entry">' + sprite(result) + '<div><h2>朋友把这张人格卡递给了你。</h2><p>你会和 TA 同频，还是带来另一种快乐？</p></div>' + button('start', '测测我自己 ↗') + '</div>' : '') +
      '<div class="kp-result-layout"><article class="kp-card" id="kp-result-card"><div class="kp-card-top"><span class="kp-card-kicker">麦门浪漫人格 / PIXEL ID</span><span class="kp-card-number">' + (preview ? 'SAMPLE' : friendView ? 'FROM A FRIEND' : 'THIS IS ME') + '</span></div><div class="kp-result-main"><div>' + sprite(result) + '</div><div class="kp-result-copy"><small>' + label + '</small><h1 tabindex="-1">' + esc(result.title) + '</h1><span class="kp-result-code">' + result.code + '</span><p>' + esc(result.subtitle) + '</p></div></div><blockquote class="kp-result-quote">“' + esc(result.quote) + '”</blockquote><div class="kp-tags">' + result.tags.map(function (tag) { return '<span># ' + esc(tag) + '</span>'; }).join('') + '</div><div class="kp-axis-list">' + axisMarkup(result) + '</div><p class="kp-axis-caption">刻度从左侧偏好走向右侧偏好，50 表示混合。只表达本次选择，不是概率。</p><p class="kp-result-description">' + esc(result.description) + '</p><div class="kp-card-bottom"><b>麦味拾光 · 把日子慢慢收好</b><span>原创生活偏好 / ' + (preview ? '图鉴示例' : 'VERSION P1') + '</span></div></article><aside class="kp-result-actions">' +
      (personal ? button('share', '分享我的人格 ↗', 'primary') + button('download', '↓ 保存像素人格卡') +
        '<section class="kp-share-panel"><h2>让朋友接着玩</h2><p>链接直接打开你的结果卡。朋友测完，还能看看你们的偏好对照。</p><div class="kp-link-input"><input id="kp-result-url" readonly aria-label="人格结果分享链接" value="' + esc(shareUrl(result)) + '">' + button('copy', '复制') + '</div>' + button('caption', '复制一段分享文案', 'plain') + qrMarkup(result) + '</section>' :
        '<section class="kp-share-panel"><h2>' + (preview ? '这会是你吗？' : '换你登场了。') + '</h2><p>从 8 个日常片刻出发，看看你把日子过成了哪一种浪漫。</p>' + button('start', '领取我的像素人格 ↗', 'primary') + (friendView && own ? button('compare-last', '用上次结果和 TA 对照', 'plain') : '') + '</section>') +
      (personal ? '<section class="kp-mission-card"><div class="kp-kicker">YOUR NEXT LITTLE JOY</div><h2>今天，让人格活一页。</h2><p>' + esc(result.mission) + '</p><div class="kp-context-stat"><div><b>' + entries.length + '</b><span>' + (context.space === 'demo' ? '示例日记' : '本月日记') + '</span></div><div><b>' + new Set(entries.map(function (e) { return e.date; })).size + '</b><span>有记录的日子</span></div><div><b>' + entries.filter(function (e) { return e.photo; }).length + '</b><span>' + (context.space === 'demo' ? '示例照片' : '本月照片') + '</span></div></div>' + button('journal', '带着小任务，记一餐 ↗') + '<p class="kp-axis-caption">先放进个人草稿，再由你确认食物、日期和照片。手帐数据不参与人格评分。</p></section>' : '') +
      '<div class="kp-actions">' + button('intro', '← 人格图鉴', 'plain') + (personal ? button('start', '再测一次', 'plain') : '') + '</div><p class="kp-result-side-note">结果链接只带角色和四条偏好刻度。照片、订单与逐题答案留在你的浏览器。</p></aside></div>' +
      comparison(result) + scoreDetails(result, personal) + '<p class="kp-footnote">' + esc(result.scoreNote) + '</p>';
  }
  function render(focus) {
    if (!host) return;
    host.innerHTML = '<div class="kp-shell">' + (journey.phase === 'intro' ? intro() : journey.phase === 'quiz' ? question() : resultPage()) + '</div>';
    if (focus) {
      const title = host.querySelector('h1');
      if (title) title.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  function clearShareHash() {
    history.replaceState(null, '', '#persona'); journey.hash = location.hash;
  }
  function useOwn() {
    const own = ownResult();
    if (!own) { notify('没有可恢复的结果，来测一次吧。'); return; }
    journey.result = own.result; journey.answers = own.answers; journey.phase = 'result'; journey.preview = false;
    clearShareHash(); render(true);
  }
  async function copyText(value, control) {
    try { await navigator.clipboard.writeText(value); notify('已复制，发给快乐搭子吧。'); return true; }
    catch (_) {
      const area = document.createElement('textarea'); area.value = value; area.setAttribute('readonly', ''); area.style.cssText = 'position:fixed;left:0;top:0;opacity:0'; document.body.appendChild(area); area.select();
      let done = false; try { done = document.execCommand('copy'); } catch (_) {} area.remove();
      if (done) { notify('已复制，发给快乐搭子吧。'); return true; }
      if (control) { control.focus(); control.select(); }
      notify('浏览器未允许自动复制；请长按或选中链接复制。'); return false;
    }
  }
  function caption(result) {
    return '原来我是「' + result.title + '」！\n“' + result.quote + '”\n8 个生活片刻，测测你把日子吃成了哪种浪漫。测完看看我们哪里同频：\n' + shareUrl(result);
  }
  function closeDialog() { if (dialog) { const old = dialog; dialog = null; old.close(); old.remove(); } }
  function showShareDialog(result) {
    closeDialog();
    dialog = document.createElement('dialog'); dialog.className = 'kp-share-dialog'; dialog.setAttribute('aria-labelledby', 'kp-share-title');
    dialog.innerHTML = '<header><h2 id="kp-share-title">把快乐递给一个人</h2><button class="kp-btn plain" data-kpd="close" aria-label="关闭分享">×</button></header><p>分享链接或保存像素卡，朋友打开就能看你的结果并测自己。</p>' + qrMarkup(result) + '<div class="kp-share-url"><label for="kp-share-link">结果链接</label><textarea id="kp-share-link" readonly rows="3">' + esc(shareUrl(result)) + '</textarea></div><div class="kp-actions"><button class="kp-btn plain" data-kpd="caption">复制文案</button><button class="kp-btn primary" data-kpd="copy">复制链接</button></div>';
    dialog.addEventListener('click', function (event) {
      const b = event.target.closest('[data-kpd]'); if (!b) return;
      if (b.dataset.kpd === 'close') closeDialog();
      else copyText(b.dataset.kpd === 'caption' ? caption(result) : shareUrl(result), dialog.querySelector('textarea'));
    });
    dialog.addEventListener('close', function () { if (dialog === this) dialog = null; this.remove(); });
    document.body.appendChild(dialog); dialog.showModal();
  }
  async function share(result) {
    if (navigator.share) {
      try { await navigator.share({ title: '我是' + result.title + ' · 麦味拾光', text: result.quote + ' 测测我们哪里同频。', url: shareUrl(result) }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    showShareDialog(result);
  }
  function wrap(c, text, x, y, width, lineHeight, maxLines) {
    let line = '', count = 0;
    for (const char of String(text)) {
      if (c.measureText(line + char).width > width) {
        if (count >= maxLines - 1) { c.fillText(line.slice(0, -1) + '…', x, y); return; }
        c.fillText(line, x, y); y += lineHeight; line = char; count++;
      } else line += char;
    }
    if (line) c.fillText(line, x, y);
  }
  async function download(result, control) {
    control.disabled = true; const original = control.textContent; control.textContent = '正在排好像素卡…';
    try {
      await document.fonts.ready;
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440;
      const c = canvas.getContext('2d'); const ink = '#3b292f';
      c.fillStyle = '#f1e5cb'; c.fillRect(0, 0, 1080, 1440); c.strokeStyle = '#e6d7bc'; c.lineWidth = 1;
      for (let p = 0; p < 1440; p += 28) { c.beginPath(); c.moveTo(0, p); c.lineTo(1080, p); c.stroke(); }
      for (let p = 0; p < 1080; p += 28) { c.beginPath(); c.moveTo(p, 0); c.lineTo(p, 1440); c.stroke(); }
      c.fillStyle = ink; c.fillRect(65, 59, 964, 1326); c.fillStyle = '#fffdf6'; c.fillRect(52, 46, 964, 1326); c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(52, 46, 964, 1326);
      c.fillStyle = '#9c725c'; c.font = '23px "Microsoft YaHei",sans-serif'; c.fillText('麦门浪漫人格 / PIXEL ID', 106, 110);
      c.textAlign = 'right'; c.font = '20px monospace'; c.fillText('THIS IS ME / P1', 966, 110); c.textAlign = 'left';
      Art.draw(c, result.sprite, 380, 133, 320, E.archetypes.findIndex(function (a) { return a.id === result.id; }) % 4);
      c.textAlign = 'center'; c.fillStyle = '#d95c50'; c.font = 'bold 27px monospace'; c.fillText(result.code + ' / LITTLE JOY TYPE', 540, 482);
      c.fillStyle = ink; c.font = 'bold 66px "Microsoft YaHei",sans-serif'; c.fillText(result.title, 540, 568);
      c.fillStyle = '#9c826d'; c.font = '25px "Microsoft YaHei",sans-serif'; c.fillText(result.subtitle, 540, 621);
      c.fillStyle = '#faf0dc'; c.fillRect(105, 655, 870, 100); c.fillStyle = '#a15b46'; c.font = '31px "Microsoft YaHei",sans-serif'; wrap(c, '“' + result.quote + '”', 540, 698, 810, 41, 2);
      c.fillStyle = '#a18162'; c.font = '23px "Microsoft YaHei",sans-serif'; c.fillText(result.tags.map(function (t) { return '# ' + t; }).join('    '), 540, 803); c.textAlign = 'left';
      const colors = ['#d18a76', '#a9bd8e', '#e6b559', '#bea8c3'];
      E.axes.forEach(function (a, i) {
        const y = 864 + i * 69, score = result.scores[a.key]; c.fillStyle = '#977f68'; c.font = '21px "Microsoft YaHei",sans-serif'; c.fillText(a.left + ' ← ' + a.label + ' → ' + a.right, 110, y);
        c.textAlign = 'right'; c.fillText(score === 50 ? '混合偏好' : (score > 50 ? a.right : a.left) + '倾向', 968, y); c.textAlign = 'left';
        c.fillStyle = '#ede4d4'; c.fillRect(110, y + 15, 858, 11); c.fillStyle = colors[i]; c.fillRect(110, y + 15, 858 * score / 100, 11); c.fillStyle = ink; c.fillRect(110 + Math.min(852, 852 * score / 100), y + 11, 6, 19);
      });
      c.font = '17px "Microsoft YaHei",sans-serif'; c.fillStyle = '#b09b81'; c.fillText('0 偏向左端 / 100 偏向右端 / 50 混合偏好 · 不是概率', 110, 1141);
      const code = qr(shareUrl(result)), cells = code.getModuleCount(), module = 4, box = (cells + 8) * module, qx = 968 - box, qy = 1168;
      c.fillStyle = '#fff'; c.fillRect(qx, qy, box, box); c.fillStyle = '#281c21';
      for (let r = 0; r < cells; r++) for (let col = 0; col < cells; col++) if (code.isDark(r, col)) c.fillRect(qx + (col + 4) * module, qy + (r + 4) * module, module, module);
      c.fillStyle = ink; c.font = 'bold 31px "Microsoft YaHei",sans-serif'; c.fillText('你把日子，吃成了哪种浪漫？', 110, 1204);
      c.fillStyle = '#a48a71'; c.font = '23px "Microsoft YaHei",sans-serif'; c.fillText('扫码看我的结果，也测测你自己。', 110, 1252);
      c.font = '19px "Microsoft YaHei",sans-serif'; c.fillText('麦味拾光 · 8 道生活题 / 16 种原创人格', 110, 1316); c.font = '16px "Microsoft YaHei",sans-serif'; c.fillText('原创生活偏好小游戏 · 供娱乐和自我表达', 110, 1345);
      const blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
      if (!blob) throw new Error('图片生成失败');
      const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = '麦味拾光-' + result.title + '-人格卡.png'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      notify('人格卡已生成，图上的二维码可以接着玩。');
    } finally { control.disabled = false; control.textContent = original; }
  }
  async function action(event) {
    const control = event.target.closest('[data-kp]'); if (!control || !host.contains(control) || control.disabled) return;
    const name = control.dataset.kp;
    if (name === 'answer') {
      journey.answers[journey.step] = Number(control.dataset.index);
      host.querySelectorAll('[data-kp="answer"]').forEach(function (b) { b.setAttribute('aria-pressed', b === control ? 'true' : 'false'); });
      host.querySelector('[data-kp="next"]').disabled = false; return;
    }
    if (name === 'start') { journey.phase = 'quiz'; journey.step = 0; journey.answers = []; journey.preview = false; journey.error = ''; clearShareHash(); }
    else if (name === 'intro') { journey.phase = 'intro'; journey.preview = false; journey.error = ''; journey.friend = null; rememberFriend(null); clearShareHash(); }
    else if (name === 'preview') { journey.result = previewResult(control.dataset.id); if (!journey.result) return; journey.preview = true; journey.phase = 'result'; }
    else if (name === 'last' || name === 'compare-last') { useOwn(); return; }
    else if (name === 'prev') { journey.step = Math.max(0, journey.step - 1); }
    else if (name === 'review') { journey.step = Number(control.dataset.index); journey.phase = 'quiz'; }
    else if (name === 'next') {
      if (journey.answers[journey.step] == null) return;
      if (journey.step < 7) journey.step++;
      else { const result = E.calculate(journey.answers); if (!result) throw new Error('请先完成全部题目'); journey.result = result; journey.phase = 'result'; journey.preview = false; remember(result); clearShareHash(); }
    }
    else if (name === 'copy') { await copyText(shareUrl(journey.result), host.querySelector('#kp-result-url')); return; }
    else if (name === 'caption') { await copyText(caption(journey.result), host.querySelector('#kp-result-url')); return; }
    else if (name === 'share') { await share(journey.result); return; }
    else if (name === 'download') { await download(journey.result, control); return; }
    else if (name === 'journal') { const callback = context.onJournal, result = journey.result; callback(result); return; }
    else return;
    render(true);
  }
  function unmount() {
    if (host && listener) host.removeEventListener('click', listener);
    closeDialog(); host = null; context = null; listener = null; delete document.body.dataset.keepsView;
  }
  function mount(element, options) {
    unmount(); host = element; context = options; document.body.dataset.keepsView = 'persona';
    if (journey.hash !== location.hash) {
      journey.hash = location.hash;
      const incoming = E.readShareUrl(location.href);
      if (incoming) { journey.friend = incoming; rememberFriend(incoming); journey.result = incoming; journey.phase = 'friend'; journey.preview = false; journey.error = ''; }
      else if (location.hash.includes('?')) { journey.phase = 'intro'; journey.friend = null; rememberFriend(null); journey.error = '这张分享卡的链接已损坏或版本不支持。你仍然可以开始自己的测试。'; }
      else if (!journey.friend) {
        journey.friend = restoreFriend();
        if (journey.friend && journey.phase === 'intro') { journey.result = journey.friend; journey.phase = 'friend'; }
      }
    }
    listener = function (event) { action(event).catch(function (error) { notify(error.message || '这次操作没有完成，请重试。'); }); };
    host.addEventListener('click', listener); render(false);
  }
  function banner() {
    return '<aside class="kp-banner"><div class="kp-banner-art">' + Art.svg('fries', 2) + '</div><div class="kp-banner-copy"><small>麦门浪漫人格 / NEW</small><b>你把日子，吃成了哪种浪漫？</b><p>8 道生活题，领一张可以分享的像素人格卡。</p></div><button class="kp-btn" data-action="persona">测测我 ↗</button></aside>';
  }
  window.KeepsPersonaUI = { mount: mount, unmount: unmount, banner: banner };
})();
