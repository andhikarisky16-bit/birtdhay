/* =========================================================
   HAPPY BIRTHDAY FARZANA — mini birthday adventure
   birthday_farzana.js  (vanilla JS, no framework, no audio)
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- helpers ---------------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var randInt = function (a, b) { return Math.floor(rand(a, b + 1)); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------------- elements ---------------- */
  var body = document.body;

  var canvas = $('#fx');
  var ctx = canvas.getContext('2d');

  var cursorGlow = $('#cursorGlow');
  var veil = $('#veil');
  var chapterEl = $('#chapter');
  var chapterText = $('#chapterText');
  var toastEl = $('#toast');

  var sceneIntro = $('#sceneIntro');
  var introDark = $('#introDark');
  var introBloom = $('#introBloom');
  var lightSwitch = $('#lightSwitch');

  var sceneRoom = $('#sceneRoom');
  var room = $('#room');
  var starfield = $('#starfield');
  var bulbsWrap = $('#bulbs');
  var bunting = $('#bunting');
  var banner = $('#banner');
  var nameplate = $('#nameplate');
  var wallClock = $('#wallClock');
  var wallLamp = $('#wallLamp');
  var wallFrame = $('#wallFrame');
  var balloonsWrap = $('#balloons');
  var cakeStage = $('#cakeStage');
  var cake = $('#cake');
  var candles = $('#candles');
  var giftMain = $('#giftMain');
  var giftLock = $('#giftLock');
  var partyHat = $('#partyHat');
  var ceiling = $('#ceiling');

  var hudChapter = $('#hudChapter');
  var roomHint = $('#roomHint');
  var wishText = $('#wishText');
  var magicText1 = $('#magicText1');
  var magicText2 = $('#magicText2');

  var quizModal = $('#quizModal');
  var quizBackdrop = $('#quizBackdrop');
  var quizIntro = $('#quizIntro');
  var quizBody = $('#quizBody');
  var quizTag = $('#quizTag');
  var quizQuestion = $('#quizQuestion');
  var quizOptions = $('#quizOptions');
  var quizFeedback = $('#quizFeedback');
  var quizProgress = $('#quizProgress');
  var quizLabel = $('#quizLabel');
  var startChallenge = $('#startChallenge');
  var introLater = $('#introLater');
  var giveUpBtn = $('#giveUp');
  var lockBadge = $('#lockBadge');

  var sceneEnding = $('#sceneEnding');
  var endingEyebrow = $('#endingEyebrow');
  var endingTitle = $('#endingTitle');
  var endingMsg = $('#endingMsg');
  var replayBtn = $('#replayBtn');

  /* ---------------- state machine ---------------- */
  var STATES = ['dark', 'light_on', 'exploring', 'cake', 'candle_out',
    'magical_moment', 'gift_locked', 'math_quiz', 'success', 'fail', 'ending'];
  var state = 'dark';

  var timers = [];
  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* ---------------- chapter / hud / hint / toast ---------------- */
  var CHAPTERS = {
    light_on: ['Lights On', 'Chapter 1 · Lights On'],
    exploring: ['The Birthday Room', 'Chapter 2 · The Birthday Room'],
    cake: ['Make a Wish', 'Chapter 3 · Make a Wish'],
    candle_out: ['The Wish', 'Chapter 4 · The Wish'],
    magical_moment: ['A Little Magic', 'Chapter 5 · A Little Magic'],
    gift_locked: ['The Locked Gift', 'Chapter 6 · The Locked Gift'],
    math_quiz: ['The 3 Challenges', 'The 3 Challenges'],
    success: ['Unlocked!', 'Chapter 7 · Unlocked!'],
    fail: ['The Gift Sleeps', 'A Little Surprise'],
    ending: ['Happy Birthday', 'Chapter 8 · Happy Birthday']
  };

  function showChapter(text) {
    chapterText.textContent = text;
    chapterEl.classList.add('is-show');
    later(function () { chapterEl.classList.remove('is-show'); }, 1750);
  }

  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2500);
  }

  var HINTS = {
    exploring: 'Klik benda-benda di ruangan · kalau siap, klik kue 🎂',
    cake: 'Tekan & tahan api lilin sampai padam ✨',
    candle_out: 'Tutup mata, buat harapanmu 🌟',
    magical_moment: 'Nikmati sedikit keajaiban...',
    gift_locked: 'Klik kado untuk membuka tantangan 🎁',
    math_quiz: 'Jawab 3 soal untuk membuka kadomu',
    success: 'Kadomu terbuka! 🎉',
    fail: ''
  };
  function setHint(text) {
    if (text) { roomHint.textContent = text; roomHint.classList.add('is-show'); }
    else { roomHint.classList.remove('is-show'); }
  }

  /* ---------------- state application ---------------- */
  function setState(next) {
    if (STATES.indexOf(next) === -1) return;
    state = next;
    body.setAttribute('data-state', next);

    var chap = CHAPTERS[next];
    if (chap) { hudChapter.textContent = chap[0]; }

    // room classes
    room.classList.toggle('is-busy', next !== 'exploring');
    room.classList.toggle('is-focus-cake', next === 'cake' || next === 'candle_out');
    room.classList.toggle('is-focus-gift', next === 'gift_locked' || next === 'math_quiz' || next === 'success');
    room.classList.toggle('is-magic', next === 'magical_moment' || next === 'gift_locked' ||
      next === 'math_quiz' || next === 'success' || next === 'fail' || next === 'ending');

    // gift
    var giftVisible = ['gift_locked', 'math_quiz', 'success', 'fail'].indexOf(next) !== -1;
    giftMain.classList.toggle('is-visible', giftVisible);
    giftMain.classList.toggle('is-active', next === 'gift_locked');

    setHint(HINTS[next] || '');
  }

  /* =========================================================
     PARTICLE ENGINE (canvas)
     ========================================================= */
  var particles = [];
  var MAX_P = reduceMotion ? 160 : 520;
  var dpr = 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  var CONFETTI_COLORS = ['#ffd25e', '#ff8fb1', '#a78bfa', '#7cc6ff', '#8fe3c4', '#ff9a7a', '#ffffff'];

  function addP(p) {
    if (particles.length >= MAX_P) return;
    particles.push(p);
  }

  function confetti(x, y, n, opts) {
    opts = opts || {};
    var spread = opts.spread == null ? 1 : opts.spread;
    for (var i = 0; i < n; i++) {
      var a = opts.up ? rand(-Math.PI * 0.85, -Math.PI * 0.15) : rand(0, Math.PI * 2);
      var sp = rand(1.4, 5.2) * spread;
      addP({
        t: 'confetti',
        x: x, y: y,
        vx: Math.cos(a) * sp * (opts.up ? rand(.6, 1.3) : 1),
        vy: Math.sin(a) * sp - (opts.up ? rand(1, 3) : 0),
        w: rand(5, 10), h: rand(4, 8),
        rot: rand(0, 6.28), vr: rand(-.22, .22),
        g: opts.g == null ? 0.09 : opts.g,
        life: 1, decay: rand(0.005, 0.012),
        c: opts.color || pick(CONFETTI_COLORS),
        sway: rand(.02, .08)
      });
    }
  }

  function sparkle(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2);
      var sp = rand(.4, 3.2);
      addP({
        t: 'sparkle',
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: rand(1.4, 3.4),
        rot: rand(0, 6.28), vr: rand(-.1, .1),
        life: 1, decay: rand(.014, .03),
        c: color || pick(['#ffe9a8', '#ffffff', '#ffd25e', '#ffc0e0'])
      });
    }
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2);
      var sp = rand(1.2, 6.5);
      addP({
        t: 'dot',
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - .6,
        r: rand(1.6, 4),
        g: .06, drag: .972,
        life: 1, decay: rand(.012, .024),
        c: color || pick(CONFETTI_COLORS)
      });
    }
    sparkle(x, y, Math.round(n / 2), color);
  }

  function dust(x, y, n) {
    for (var i = 0; i < n; i++) {
      addP({
        t: 'dust',
        x: x + rand(-120, 120), y: y + rand(-120, 120),
        vx: rand(-.2, .2), vy: rand(-.28, -.06),
        r: rand(.6, 2),
        life: 1, decay: rand(.002, .005),
        c: 'rgba(255,232,190,'
      });
    }
  }

  function smoke(x, y, n) {
    for (var i = 0; i < n; i++) {
      addP({
        t: 'smoke',
        x: x + rand(-6, 6), y: y + rand(-4, 4),
        vx: rand(-.25, .25), vy: rand(-1.1, -.45),
        r: rand(3, 7), gr: rand(.09, .2),
        life: 1, decay: rand(.008, .016),
        rot: rand(0, 6.28)
      });
    }
  }

  function ring(x, y, color) {
    addP({
      t: 'ring', x: x, y: y, r: 6, vr: rand(2.4, 3.4),
      life: 1, decay: .017, c: color || 'rgba(255,214,130,'
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      p.x += p.vx;
      p.y += p.vy;

      if (p.t === 'confetti') {
        p.vy += p.g;
        p.vx += Math.sin(p.y * p.sway) * .06;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot)));
        ctx.restore();
      } else if (p.t === 'sparkle') {
        p.vx *= .94; p.vy *= .94;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.c;
        var s = p.r * (0.5 + p.life);
        ctx.beginPath();
        ctx.moveTo(0, -s * 2); ctx.lineTo(s * .5, -s * .5);
        ctx.lineTo(s * 2, 0); ctx.lineTo(s * .5, s * .5);
        ctx.lineTo(0, s * 2); ctx.lineTo(-s * .5, s * .5);
        ctx.lineTo(-s * 2, 0); ctx.lineTo(-s * .5, -s * .5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.t === 'dot') {
        p.vy += p.g || 0;
        if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(p.life, 0, 1) * .95;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      } else if (p.t === 'dust') {
        p.x += Math.sin((p.y + p.x) * .01) * .2;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(p.life, 0, 1) * .5;
        ctx.fillStyle = p.c + '0.9)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      } else if (p.t === 'smoke') {
        p.r += p.gr;
        p.vx *= .99;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = clamp(p.life, 0, 1) * .22;
        ctx.fillStyle = '#d9d4e6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      } else if (p.t === 'ring') {
        p.r += p.vr;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(p.life, 0, 1) * .55;
        ctx.strokeStyle = p.c + '0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ambient confetti while the party is alive */
  var ambientOn = false;
  var lastAmbient = 0;
  function ambientAllowed() {
    return ['light_on', 'exploring', 'cake', 'candle_out', 'magical_moment',
      'gift_locked', 'math_quiz', 'success', 'ending'].indexOf(state) !== -1;
  }

  /* cursor glow */
  var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    cursorGlow.style.opacity = '1';
  }, { passive: true });
  window.addEventListener('pointerleave', function () { cursorGlow.style.opacity = '0'; });

  function loop(now) {
    drawParticles();

    gx += (tx - gx) * .16;
    gy += (ty - gy) * .16;
    cursorGlow.style.transform = 'translate(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px)';

    if (ambientOn && ambientAllowed() && now - lastAmbient > (state === 'magical_moment' ? 320 : 900)) {
      lastAmbient = now;
      confetti(rand(0, window.innerWidth), -12, reduceMotion ? 1 : 2, { g: .05, up: false });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* =========================================================
     MATH SYMBOLS ON EMPTY CLICK + TOUCH SPARKLE
     ========================================================= */
  var SYMBOLS = ['π', '√', '∞', '∑', '+', '−', '×', '÷'];
  var SYM_COLORS = ['#ffd25e', '#ff8fb1', '#a78bfa', '#7cc6ff', '#8fe3c4'];

  function spawnSymbol(x, y) {
    var s = document.createElement('span');
    s.className = 'math-sym';
    s.textContent = pick(SYMBOLS);
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--fs', randInt(18, 34) + 'px');
    s.style.setProperty('--sc', pick(SYM_COLORS));
    s.style.setProperty('--dx', rand(-46, 46).toFixed(0) + 'px');
    s.style.setProperty('--rot', randInt(-40, 40) + 'deg');
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1600);
  }

  function onRoomClick(e) {
    if (e.target.closest('.interactive, .gift--main, .cake, .candles, .opt, .btn')) return;
    if (state === 'dark') return;
    spawnSymbol(e.clientX, e.clientY);
    sparkle(e.clientX, e.clientY, 4);
  }
  sceneRoom.addEventListener('click', onRoomClick);
  sceneEnding.addEventListener('click', function (e) {
    if (e.target.closest('.btn')) return;
    spawnSymbol(e.clientX, e.clientY);
    sparkle(e.clientX, e.clientY, 4);
  });

  window.addEventListener('touchstart', function (e) {
    if (state === 'dark' || !e.touches.length) return;
    var t = e.touches[0];
    sparkle(t.clientX, t.clientY, 6);
  }, { passive: true });

  /* =========================================================
     ROOM DECOR BUILDERS
     ========================================================= */
  function buildBulbs() {
    bulbsWrap.innerHTML = '';
    var n = window.innerWidth < 640 ? 9 : 15;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('span');
      b.className = 'bulb';
      var t = i / (n - 1);
      b.style.setProperty('--bx', (3 + t * 94).toFixed(2) + '%');
      b.style.setProperty('--bt', (6 + Math.sin(t * Math.PI) * 14).toFixed(1) + 'px');
      b.style.setProperty('--bc', pick(['#ffe7b3', '#ffd0a8', '#ffc4d8', '#cfe6ff']));
      b.style.setProperty('--dur', rand(2.2, 4.4).toFixed(2) + 's');
      b.style.setProperty('--delay', rand(0, 3).toFixed(2) + 's');
      bulbsWrap.appendChild(b);
    }
  }

  function buildBunting() {
    $$('.flag', bunting).forEach(function (f) { f.remove(); });
    var n = window.innerWidth < 640 ? 9 : 16;
    var cols = ['#ff8fb1', '#ffd25e', '#7cc6ff', '#a78bfa', '#8fe3c4', '#ff9a7a'];
    for (var i = 0; i < n; i++) {
      var f = document.createElement('span');
      f.className = 'flag';
      var t = (i + .5) / n;
      f.style.setProperty('--fx', (t * 100).toFixed(2) + '%');
      f.style.setProperty('--ft', (2 + Math.sin(t * Math.PI) * 10).toFixed(1) + 'px');
      f.style.setProperty('--fc', cols[i % cols.length]);
      f.style.setProperty('--fdelay', rand(0, 3).toFixed(2) + 's');
      bunting.appendChild(f);
    }
  }

  /* --- stars --- */
  var specialStar = null;
  function buildStars() {
    starfield.innerHTML = '';
    var count = window.innerWidth < 640 ? 26 : 46;
    var interactiveCount = window.innerWidth < 640 ? 4 : 6;
    var placed = 0, guard = 0;
    var avoid = [
      { x1: 16, y1: 10, x2: 84, y2: 36 },   // banner + nameplate zone
      { x1: 80, y1: 6, x2: 100, y2: 26 },  // clock
      { x1: 0, y1: 6, x2: 18, y2: 26 },    // lamp
      { x1: 3, y1: 32, x2: 20, y2: 56 }    // frame
    ];

    function isFree(x, y) {
      for (var i = 0; i < avoid.length; i++) {
        var a = avoid[i];
        if (x > a.x1 && x < a.x2 && y > a.y1 && y < a.y2) return false;
      }
      return true;
    }

    while (placed < count && guard < count * 30) {
      guard++;
      var x = rand(2, 98), y = rand(3, 46);
      if (!isFree(x, y)) continue;

      var isSpecial = placed === 0;
      var interactive = isSpecial || placed < interactiveCount;
      var s = document.createElement(interactive ? 'button' : 'span');
      s.className = 'star' + (interactive ? ' star--interactive' : '') +
        (isSpecial ? ' star--gold' : '') + (placed % 3 === 0 ? ' star--night' : '');
      s.style.setProperty('--x', x.toFixed(2) + '%');
      s.style.setProperty('--y', y.toFixed(2) + '%');
      s.style.setProperty('--sz', (isSpecial ? randInt(5, 7) : randInt(2, 5)) + 'px');
      s.style.setProperty('--dur', rand(2, 5.5).toFixed(2) + 's');
      s.style.setProperty('--delay', rand(0, 4).toFixed(2) + 's');
      if (interactive) {
        s.setAttribute('type', 'button');
        s.setAttribute('aria-label', 'Bintang');
        s.dataset.interactive = 'star';
        if (isSpecial) s.dataset.special = '1';
      } else {
        s.setAttribute('aria-hidden', 'true');
      }
      starfield.appendChild(s);
      placed++;
      if (isSpecial) specialStar = s;
    }
  }

  /* --- balloons --- */
  var BALLOON_POS = [
    { x: 6, y: 24, s: .95 },
    { x: 16, y: 43, s: 1.05 },
    { x: 26, y: 28, s: .82 },
    { x: 73, y: 27, s: .88 },
    { x: 84, y: 42, s: 1.02 },
    { x: 93, y: 24, s: .9 },
    { x: 33, y: 52, s: .76 },
    { x: 66, y: 51, s: .8 },
    { x: 45, y: 22, s: .7 },
    { x: 56, y: 33, s: .72 }
  ];
  var BALLOON_COLORS = [
    ['#ff9fc0', '#e05f8c'],
    ['#ffd88a', '#e5a03a'],
    ['#b79bff', '#7c5cd6'],
    ['#8fd0ff', '#3f8fd8'],
    ['#9ff0d4', '#3fb894'],
    ['#ffb39a', '#e8704f'],
    ['#ffc2e0', '#d766a5'],
    ['#a8e8ff', '#4aa8d8'],
    ['#ffe6a0', '#d8a848'],
    ['#d4b5ff', '#9166e0']
  ];

  function buildBalloons() {
    balloonsWrap.innerHTML = '';
    var list = window.innerWidth < 640 ? BALLOON_POS.slice(0, 8) : BALLOON_POS;
    list.forEach(function (pos, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'balloon';
      b.style.setProperty('--x', pos.x + '%');
      b.style.setProperty('--y', pos.y + '%');
      b.style.setProperty('--s', pos.s);
      b.style.setProperty('--dur', rand(4.6, 7.6).toFixed(2) + 's');
      b.style.setProperty('--delay', ('-' + rand(0, 5).toFixed(2)) + 's');
      b.style.setProperty('--rot', rand(-7, 7).toFixed(1));
      b.style.setProperty('--c1', BALLOON_COLORS[i % BALLOON_COLORS.length][0]);
      b.style.setProperty('--c2', BALLOON_COLORS[i % BALLOON_COLORS.length][1]);

      var isSpecial = (i === 5);
      var isPlain = (i === 8 || i === 9);

      if (isSpecial) {
        b.classList.add('is-dancer');
        b.dataset.role = 'dancer';
        b.setAttribute('aria-label', 'Balon spesial');
      } else if (isPlain) {
        b.classList.add('is-plain');
        b.setAttribute('aria-hidden', 'true');
        b.tabIndex = -1;
      } else {
        b.dataset.role = 'poppable';
        b.setAttribute('aria-label', 'Balon, klik untuk meletuskannya');
      }

      b.innerHTML = '<span class="balloon__body"></span><span class="balloon__knot"></span><span class="balloon__string"></span>';
      balloonsWrap.appendChild(b);
    });
  }

  /* =========================================================
     CLOCK
     ========================================================= */
  var handH = $('#handH'), handM = $('#handM'), handS = $('#handS');
  function tickClock() {
    var d = new Date();
    var ms = d.getMilliseconds() / 1000;
    var s = d.getSeconds() + ms;
    var m = d.getMinutes() + s / 60;
    var h = (d.getHours() % 12) + m / 60;
    handS.style.transform = 'rotate(' + (s * 6) + 'deg)';
    handM.style.transform = 'rotate(' + (m * 6) + 'deg)';
    handH.style.transform = 'rotate(' + (h * 30) + 'deg)';
    requestAnimationFrame(tickClock);
  }
  requestAnimationFrame(tickClock);

  /* =========================================================
     LAMP FLICKER
     ========================================================= */
  function flickerLamp() {
    ceiling.classList.add('is-flicker');
    setTimeout(function () { ceiling.classList.remove('is-flicker'); }, 2100);
  }

  /* =========================================================
     1. DARK INTRO  →  LIGHT ON
     ========================================================= */
  function turnOnLight(e) {
    if (state !== 'dark') return;

    var rect = lightSwitch.getBoundingClientRect();
    var cx = (e && e.clientX) || (rect.left + rect.width / 2);
    var cy = (e && e.clientY) || (rect.top + rect.height / 2);

    lightSwitch.classList.add('is-on');
    introBloom.style.setProperty('--bx', cx + 'px');
    introBloom.style.setProperty('--by', cy + 'px');
    sceneIntro.classList.add('is-lit');

    dust(cx, cy, reduceMotion ? 6 : 26);
    sparkle(cx, cy, reduceMotion ? 4 : 14, '#ffe9b8');

    sceneRoom.classList.add('is-active');
    sceneRoom.setAttribute('aria-hidden', 'false');
    ambientOn = true;

    setState('light_on');
    showChapter(CHAPTERS.light_on[1]);

    later(function () {
      sceneIntro.classList.remove('is-active');
      sceneIntro.setAttribute('aria-hidden', 'true');
    }, 1700);

    later(function () {
      setState('exploring');
      scheduleRandomFlicker();
    }, 2200);
  }
  lightSwitch.addEventListener('click', turnOnLight);

  var flickerScheduled = false;
  function scheduleRandomFlicker() {
    if (flickerScheduled) return;
    flickerScheduled = true;
    later(function () {
      if (state === 'exploring') {
        flickerLamp();
        later(function () { if (state === 'exploring') toast('Lampunya kedip sebentar 💡'); }, 900);
      }
    }, randInt(11000, 17000));
  }

  /* =========================================================
     3-4. ROOM INTERACTIONS + EASTER EGGS
     ========================================================= */
  function centerOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  banner.addEventListener('click', function () {
    if (state !== 'exploring') return;
    banner.classList.remove('is-wobble');
    void banner.offsetWidth;
    banner.classList.add('is-wobble');
    var c = centerOf(banner);
    sparkle(c.x, c.y, 10, '#ffd7ea');
  });

  nameplate.addEventListener('click', function () {
    if (state !== 'exploring') return;
    nameplate.classList.remove('is-pop');
    void nameplate.offsetWidth;
    nameplate.classList.add('is-pop');
    var c = centerOf(nameplate);
    sparkle(c.x, c.y, 18, '#ffe6ae');
    ring(c.x, c.y, 'rgba(255,226,150,');
    toast('Happy birthday, FARZANA ✨');
  });

  wallClock.addEventListener('click', function () {
    if (state !== 'exploring') return;
    wallClock.classList.add('is-spin');
    var c = centerOf(wallClock);
    sparkle(c.x, c.y, 12, '#fff2c9');
    toast('Waktu berhenti sebentar hanya untuk Farzana ⏳');
    later(function () { wallClock.classList.remove('is-spin'); }, 1700);
  });

  wallLamp.addEventListener('click', function () {
    if (state !== 'exploring') return;
    flickerLamp();
    var c = centerOf(wallLamp);
    sparkle(c.x, c.y, 10, '#ffd68f');
    toast('Lampu pesta menyala hangat 🕯️');
  });

  wallFrame.addEventListener('click', function () {
    if (state !== 'exploring') return;
    var c = centerOf(wallFrame);
    sparkle(c.x, c.y, 14, '#e6d6ff');
    ring(c.x, c.y, 'rgba(200,170,255,');
    toast('Kenangan indah selalu layak dibingkai 📷');
  });

  partyHat.addEventListener('click', function () {
    if (state !== 'exploring') return;
    partyHat.classList.remove('is-hop');
    void partyHat.offsetWidth;
    partyHat.classList.add('is-hop');
    var c = centerOf(partyHat);
    confetti(c.x, c.y - 20, 14, { up: true, spread: 1.1 });
    toast('Topi pesta siap dipakai! 🎉');
  });

  starfield.addEventListener('click', function (e) {
    var s = e.target.closest('.star--interactive');
    if (!s || state !== 'exploring') return;
    s.classList.remove('is-flash');
    void s.offsetWidth;
    s.classList.add('is-flash');
    var c = centerOf(s);
    sparkle(c.x, c.y, s.dataset.special ? 22 : 10, s.dataset.special ? '#ffe19a' : '#ffffff');
    if (s.dataset.special) {
      ring(c.x, c.y, 'rgba(255,225,154,');
      toast('⭐ Kamu menemukan bintang keberuntungan Farzana!');
    }
    later(function () { s.classList.remove('is-flash'); }, 900);
  });

  balloonsWrap.addEventListener('click', function (e) {
    var b = e.target.closest('.balloon');
    if (!b || state !== 'exploring') return;

    if (b.dataset.role === 'dancer') {
      b.classList.remove('is-cheer');
      void b.offsetWidth;
      b.classList.add('is-cheer');
      var dc = centerOf(b);
      sparkle(dc.x, dc.y, 16, '#d4b5ff');
      toast('🎈 Balon ini sedang menari untuk Farzana!');
      later(function () { b.classList.remove('is-cheer'); }, 1800);
      return;
    }
    if (b.dataset.role !== 'poppable') return;

    var c = centerOf(b);
    var col = getComputedStyle(b).getPropertyValue('--c2').trim() || '#ff8fb1';
    b.classList.add('is-pop');
    burst(c.x, c.y, col, reduceMotion ? 8 : 20);
    later(function () { b.classList.add('is-gone'); }, 200);
  });

  /* cake click → focus */
  function focusCake() {
    if (state !== 'exploring') return;
    var c = centerOf(cake);
    sparkle(c.x, c.y - 20, 10, '#ffd7ea');
    setState('cake');
    showChapter(CHAPTERS.cake[1]);
  }
  cake.addEventListener('click', focusCake);
  cake.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusCake(); }
  });

  /* =========================================================
     7. CAKE & CANDLE — PRESS AND HOLD
     ========================================================= */
  var HOLD_MS = reduceMotion ? 900 : 1700;
  var holding = false;
  var holdStart = 0;
  var holdRAF = null;

  function setHold(v) {
    cakeStage.style.setProperty('--hold', v.toFixed(3));
  }

  function beginHold(e) {
    if (state !== 'cake') return;
    if (e.cancelable) e.preventDefault();
    holding = true;
    holdStart = performance.now();
    cakeStage.classList.add('is-holding');
    if (holdRAF) cancelAnimationFrame(holdRAF);
    holdRAF = requestAnimationFrame(holdTick);
  }

  function holdTick() {
    if (!holding) return;
    var p = clamp((performance.now() - holdStart) / HOLD_MS, 0, 1);
    setHold(p);
    if (p >= 1) { extinguish(); return; }
    holdRAF = requestAnimationFrame(holdTick);
  }

  function endHold() {
    if (!holding) return;
    holding = false;
    if (holdRAF) cancelAnimationFrame(holdRAF);
    cakeStage.classList.remove('is-holding');
    setHold(0);
  }

  candles.addEventListener('pointerdown', beginHold);
  window.addEventListener('pointerup', endHold);
  window.addEventListener('pointercancel', endHold);
  window.addEventListener('blur', endHold);

  cake.addEventListener('click', function () {
    if (state !== 'cake') return;
    var c = centerOf(cake);
    sparkle(c.x, c.y - 30, 8, '#ffe6ae');
    toast('Tahan apinya sampai benar-benar padam ✨');
  });

  function extinguish() {
    holding = false;
    if (holdRAF) cancelAnimationFrame(holdRAF);
    cakeStage.classList.remove('is-holding');
    cakeStage.classList.add('is-out');
    setHold(1);

    setState('candle_out');
    showChapter(CHAPTERS.candle_out[1]);
    flickerLamp();

    $$('.flame-wrap', candles).forEach(function (fw, i) {
      var c = centerOf(fw);
      smoke(c.x, c.y, reduceMotion ? 4 : 12);
      sparkle(c.x, c.y - 6, 8, '#fff3cf');
      ring(c.x, c.y, 'rgba(255,240,200,');
      later(function () { smoke(c.x + rand(-4, 4), c.y - 8, reduceMotion ? 2 : 5); }, 220 * i + 180);
    });

    confetti(window.innerWidth / 2, window.innerHeight * 0.5, reduceMotion ? 10 : 34, { up: true, spread: 1.25, g: .07 });
    sparkle(window.innerWidth / 2, window.innerHeight * 0.45, reduceMotion ? 8 : 24, '#ffe9b8');

    wishText.classList.add('is-show');

    later(function () {
      wishText.classList.remove('is-show');
      startMagic();
    }, 2700);
  }

  /* =========================================================
     8. MAGICAL MOMENT
     ========================================================= */
  function startMagic() {
    setState('magical_moment');
    showChapter(CHAPTERS.magical_moment[1]);
    body.classList.add('night');
    flickerLamp();

    veil.classList.add('is-show');
    later(function () { veil.classList.remove('is-show'); }, 1400);

    var w = window.innerWidth, h = window.innerHeight;
    for (var i = 0; i < (reduceMotion ? 6 : 18); i++) {
      later(function () {
        sparkle(rand(0, w), rand(h * .08, h * .6), 3, pick(['#ffe9b8', '#ffffff', '#cbb6ff']));
      }, i * 110);
    }
    confetti(w / 2, h * .3, reduceMotion ? 10 : 26, { up: true, g: .045, spread: 1.4 });

    magicText1.classList.add('is-show');
    later(function () { magicText1.classList.remove('is-show'); }, 2900);
    later(function () { magicText2.classList.add('is-show'); }, 3300);
    later(function () { magicText2.classList.remove('is-show'); }, 6100);

    later(function () {
      setState('gift_locked');
      showChapter(CHAPTERS.gift_locked[1]);
      var c = centerOf(giftMain);
      sparkle(c.x, c.y, 18, '#ffe19a');
      ring(c.x, c.y, 'rgba(255,214,130,');
    }, 6600);
  }

  /* =========================================================
     9-13. GIFT + MATH QUIZ (THE LOCK SYSTEM)
     ========================================================= */
  var QUESTIONS = [
    {
      tag: 'SOAL 1 · LOGARITMA',
      q: 'Tentukan nilai x yang memenuhi:\nlog₂ x + log₂ (x − 2) = 3',
      options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
      answer: 2
    },
    {
      tag: 'SOAL 2 · TRIGONOMETRI',
      q: 'Jika 0° < θ < 90° dan cos θ = 4/5,\nmaka nilai sin 2θ adalah...',
      options: ['12/25', '16/25', '24/25', '7/25'],
      answer: 2
    },
    {
      tag: 'SOAL 3 · SPL',
      q: 'Sistem persamaan:\nx + 2y = 11\n3x − y = 5\nBerapa nilai x + y ?',
      options: ['5', '6', '7', '8'],
      answer: 2
    }
  ];

  var qIndex = 0;
  var quizLocked = false;

  function openModal() {
    quizModal.classList.add('is-open');
    quizModal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    quizModal.classList.remove('is-open');
    quizModal.setAttribute('aria-hidden', 'true');
  }

  function buildProgress() {
    quizProgress.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement('span');
      dot.className = 'p-dot';
      quizProgress.appendChild(dot);
      if (i < 2) {
        var bar = document.createElement('span');
        bar.className = 'p-bar';
        quizProgress.appendChild(bar);
      }
    }
  }

  function updateProgress() {
    var dots = $$('.p-dot', quizProgress);
    var bars = $$('.p-bar', quizProgress);
    dots.forEach(function (d, i) {
      d.classList.toggle('is-done', i < qIndex);
      d.classList.toggle('is-current', i === qIndex && qIndex < 3);
    });
    bars.forEach(function (b, i) { b.classList.toggle('is-done', i < qIndex); });
    quizLabel.textContent = 'Challenge ' + Math.min(qIndex + 1, 3) + ' of 3';
  }

  function renderQuestion() {
    var q = QUESTIONS[qIndex];
    quizTag.textContent = q.tag;
    quizQuestion.textContent = q.q;
    quizFeedback.textContent = '';
    quizFeedback.className = 'quiz__feedback';
    quizOptions.innerHTML = '';

    q.options.forEach(function (opt, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.innerHTML = '<span class="opt__key">' + 'ABCD'[i] + '</span><span class="opt__text"></span>';
      b.querySelector('.opt__text').textContent = opt;
      b.addEventListener('click', function () { answer(i, b); });
      quizOptions.appendChild(b);
    });
    updateProgress();
  }

  function answer(i, btn) {
    if (state !== 'math_quiz' || quizLocked) return;
    var q = QUESTIONS[qIndex];

    if (i === q.answer) {
      quizLocked = true;
      btn.classList.add('is-correct');
      var c = centerOf(btn);
      sparkle(c.x, c.y, reduceMotion ? 8 : 20, '#8cf0bb');
      ring(c.x, c.y, 'rgba(140,240,187,');
      quizFeedback.textContent = pick(['Tepat sekali! ✨', 'Benar! Lanjut ke soal berikutnya 🔥', 'Hebat! Kuncinya makin longgar ✨']);
      quizFeedback.className = 'quiz__feedback is-show is-good';

      later(function () {
        if (qIndex < QUESTIONS.length - 1) {
          qIndex++;
          renderQuestion();
          quizLocked = false;
        } else {
          quizSuccess();
        }
      }, 1050);
    } else {
      btn.classList.remove('is-wrong');
      void btn.offsetWidth;
      btn.classList.add('is-wrong');
      var cc = centerOf(btn);
      sparkle(cc.x, cc.y, 6, '#ffb0c4');
      quizFeedback.textContent = 'Belum tepat, coba lagi ✨';
      quizFeedback.className = 'quiz__feedback is-show';
      later(function () { btn.classList.remove('is-wrong'); }, 600);
    }
  }

  function openGiftModal() {
    if (state !== 'gift_locked') return;
    setState('math_quiz');
    showChapter(CHAPTERS.math_quiz[1]);
    qIndex = 0;
    quizLocked = false;
    quizIntro.hidden = false;
    quizBody.hidden = true;
    lockBadge.textContent = '🔒';
    lockBadge.classList.remove('is-unlock');
    buildProgress();
    updateProgress();
    openModal();
  }

  function startQuiz() {
    quizIntro.hidden = true;
    quizBody.hidden = false;
    renderQuestion();
  }

  function quizSuccess() {
    quizLocked = true;
    qIndex = 3;
    updateProgress();
    lockBadge.textContent = '🔓';
    lockBadge.classList.add('is-unlock');
    var c = centerOf(lockBadge);
    sparkle(c.x, c.y, 22, '#ffe19a');
    ring(c.x, c.y, 'rgba(255,214,130,');
    quizFeedback.textContent = 'Gembok terbuka! 🎉';
    quizFeedback.className = 'quiz__feedback is-show is-good';

    later(function () {
      closeModal();
      openGift();
    }, 1250);
  }

  function giveUp() {
    closeModal();
    setState('fail');
    showChapter(CHAPTERS.fail[1]);

    var c = centerOf(giftMain);
    for (var i = 0; i < (reduceMotion ? 6 : 18); i++) {
      later(function () {
        sparkle(c.x + rand(-50, 50), c.y + rand(-50, 40), 3, pick(['#ffe19a', '#d4b5ff', '#ffffff']));
      }, i * 70);
    }
    giftMain.classList.add('is-gone');

    later(function () { showEnding('fail'); }, 1700);
  }

  giftMain.addEventListener('click', openGiftModal);
  startChallenge.addEventListener('click', startQuiz);
  giveUpBtn.addEventListener('click', giveUp);
  introLater.addEventListener('click', function () {
    closeModal();
    setState('gift_locked');
    toast('Kado menunggumu kapan saja 🎁');
  });
  quizBackdrop.addEventListener('click', function () {
    if (quizBody.hidden) { closeModal(); setState('gift_locked'); }
  });

  /* =========================================================
     14. GIFT OPENS
     ========================================================= */
  function openGift() {
    setState('success');
    showChapter(CHAPTERS.success[1]);

    giftMain.classList.add('is-unlocked');
    var c = centerOf(giftMain);

    later(function () {
      giftMain.classList.add('is-open');
      var g = centerOf(giftMain);
      var w = window.innerWidth, h = window.innerHeight;

      ring(g.x, g.y, 'rgba(255,236,180,');
      ring(g.x, g.y, 'rgba(255,214,130,');
      sparkle(g.x, g.y - 20, reduceMotion ? 12 : 40, '#ffe9b8');
      confetti(g.x, g.y - 30, reduceMotion ? 20 : 90, { up: true, spread: 1.9, g: .08 });

      for (var i = 0; i < (reduceMotion ? 8 : 26); i++) {
        later(function () {
          sparkle(rand(0, w), rand(h * .1, h * .85), 2, pick(['#ffe9b8', '#ffffff', '#ffc0e0', '#cbb6ff']));
        }, i * 55);
      }
      for (var j = 0; j < (reduceMotion ? 4 : 10); j++) {
        later(function () { confetti(rand(0, w), -10, reduceMotion ? 3 : 8, { g: .06 }); }, j * 160);
      }
    }, 500);

    later(function () { showEnding('success'); }, reduceMotion ? 1400 : 2100);
  }

  /* =========================================================
     15-16. ENDING + REPLAY
     ========================================================= */
  var endingLines = {
    success: [
      'Semoga hari ini menjadi salah satu hari yang paling menyenangkan buat kamu.',
      'Semoga semua hal baik datang satu per satu, dan semoga kamu selalu punya alasan untuk tersenyum.',
      'Selamat ulang tahun, FARZANA. Semoga langkahmu selalu ditemani hal-hal hangat. 🎂✨'
    ],
    fail: [
      'Walaupun kadonya belum terbuka, semoga hari ini tetap jadi hari yang menyenangkan untuk Farzana. 🎂✨',
      'Semoga semua hal baik datang satu per satu, dan semoga kamu selalu punya alasan untuk tersenyum.',
      'Kadonya masih menunggu kapan pun kamu mau mencobanya lagi.'
    ]
  };
  var endingTitles = {
    success: 'HAPPY BIRTHDAY, FARZANA! 🎉',
    fail: 'HAPPY BIRTHDAY, FARZANA! 🎂'
  };

  var typeTimer = null;
  function typeText(el, text, speed, done) {
    if (typeTimer) clearInterval(typeTimer);
    el.textContent = '';
    var caret = document.createElement('span');
    caret.className = 'caret';
    el.appendChild(caret);
    var i = 0;
    typeTimer = setInterval(function () {
      i++;
      el.textContent = text.slice(0, i);
      el.appendChild(caret);
      if (i >= text.length) {
        clearInterval(typeTimer);
        typeTimer = null;
        setTimeout(function () { caret.remove(); }, 700);
        if (done) done();
      }
    }, speed);
  }

  function buildEndingStars() {
    var wrap = $('.ending__stars');
    wrap.innerHTML = '';
    var n = window.innerWidth < 640 ? 24 : 44;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'star star--night';
      s.style.setProperty('--x', rand(1, 99).toFixed(2) + '%');
      s.style.setProperty('--y', rand(1, 99).toFixed(2) + '%');
      s.style.setProperty('--sz', randInt(2, 5) + 'px');
      s.style.setProperty('--dur', rand(2, 5).toFixed(2) + 's');
      s.style.setProperty('--delay', rand(0, 4).toFixed(2) + 's');
      wrap.appendChild(s);
    }
  }

  function showEnding(type) {
    setState('ending');
    showChapter(CHAPTERS.ending[1]);
    ambientOn = true;

    buildEndingStars();
    endingEyebrow.classList.remove('is-show');
    endingMsg.innerHTML = '';
    replayBtn.classList.remove('is-show');
    sceneEnding.classList.add('is-active');
    sceneEnding.setAttribute('aria-hidden', 'false');

    later(function () { endingEyebrow.classList.add('is-show'); }, 250);
    later(function () {
      typeText(endingTitle, endingTitles[type], reduceMotion ? 8 : 45, function () {
        var lines = endingLines[type];
        lines.forEach(function (txt, i) {
          var p = document.createElement('p');
          p.textContent = txt;
          endingMsg.appendChild(p);
          later(function () { p.classList.add('is-show'); }, 220 * (i + 1));
        });
        later(function () { replayBtn.classList.add('is-show'); }, 220 * lines.length + 500);
      });
    }, 900);
  }

  function resetAll() {
    clearTimers();
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    if (holdRAF) cancelAnimationFrame(holdRAF);
    holding = false;

    particles.length = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    sceneEnding.classList.remove('is-active');
    sceneEnding.setAttribute('aria-hidden', 'true');
    endingTitle.textContent = '';
    endingMsg.innerHTML = '';
    endingEyebrow.classList.remove('is-show');
    replayBtn.classList.remove('is-show');

    closeModal();
    quizIntro.hidden = false;
    quizBody.hidden = true;
    qIndex = 0;
    quizLocked = false;
    lockBadge.textContent = '🔒';
    lockBadge.classList.remove('is-unlock');
    quizFeedback.className = 'quiz__feedback';
    quizFeedback.textContent = '';

    sceneIntro.classList.remove('is-active', 'is-lit');
    sceneIntro.setAttribute('aria-hidden', 'false');
    lightSwitch.classList.remove('is-on');
    introBloom.style.removeProperty('--bx');
    introBloom.style.removeProperty('--by');

    sceneRoom.classList.remove('is-active');
    sceneRoom.setAttribute('aria-hidden', 'true');

    body.classList.remove('night');
    room.classList.remove('is-busy', 'is-focus-cake', 'is-focus-gift', 'is-magic');

    cakeStage.classList.remove('is-holding', 'is-out');
    cakeStage.style.removeProperty('--hold');

    wishText.classList.remove('is-show');
    magicText1.classList.remove('is-show');
    magicText2.classList.remove('is-show');
    toastEl.classList.remove('is-show');
    chapterEl.classList.remove('is-show');
    veil.classList.remove('is-show');

    giftMain.classList.remove('is-visible', 'is-active', 'is-unlocked', 'is-open', 'is-gone');
    giftMain.style.removeProperty('transform');

    banner.classList.remove('is-wobble');
    nameplate.classList.remove('is-pop');
    wallClock.classList.remove('is-spin');
    partyHat.classList.remove('is-hop');

    ambientOn = false;
    flickerScheduled = false;
    cursorGlow.style.opacity = '0';
    tx = gx = window.innerWidth / 2;
    ty = gy = window.innerHeight / 2;

    buildBalloons();
    buildStars();

    setState('dark');
    hudChapter.textContent = 'The Dark Room';
    setHint('');
  }

  replayBtn.addEventListener('click', function () {
    sparkle(window.innerWidth / 2, window.innerHeight / 2, 30, '#ffe9b8');
    resetAll();
    window.scrollTo(0, 0);
  });

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    buildBulbs();
    buildBunting();
    buildStars();
    buildBalloons();
    buildProgress();
    setState('dark');
    hudChapter.textContent = 'The Dark Room';
  }

  var rebuildTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(function () {
      if (state === 'dark') { buildBulbs(); buildBunting(); buildStars(); buildBalloons(); }
    }, 320);
  });

  init();
})();
