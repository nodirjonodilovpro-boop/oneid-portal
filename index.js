/* ===== OneID — Davlat Raqamli Portali (SPA) ===== */
(function () {
  'use strict';

  // ---------- Demo data ----------
  const USER = {
    last: 'KARIMOV', first: 'AZIZBEK', middle: 'BAHODIROVICH',
    full: 'Karimov Azizbek Bahodirovich', short: 'Karimov Azizbek', initials: 'KA',
    pinfl: '31205840250019', birth: '12.05.1984', idNo: 'FA 9876543',
    idIssued: '15.08.2021', idExpiry: '15.08.2031', passNo: 'BA 4589201',
    passIssued: '15.08.2019', passExpiry: '15.08.2029', phone: '+998 90 ••• 45 67',
    email: 'a.karimov@my.gov.uz', address: 'Toshkent sh., Chilonzor tumani, Do\'mbirobod MFY, Katta Xirmontepa ko\'chasi 42-uy, 18-xonadon'
  };
  const DEMO_PIN = '12345';

  const store = {
    get(k, d) { try { const v = sessionStorage.getItem('oneid_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem('oneid_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  // Doimiy saqlash (brauzer yopilganda ham qoladi)
  const local = {
    get(k, d) { try { const v = localStorage.getItem('oneid_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('oneid_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const state = {
    authed: store.get('authed', false),
    stage: store.get('stage', 'none'), // none | password | done
    lang: ['uz', 'ru', 'en'].includes(local.get('lang', 'uz')) ? local.get('lang', 'uz') : 'uz',
    timers: []
  };
  const tr = (s) => (window.I18N ? window.I18N.tr(s, state.lang) : s);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function setTheme(mode) {
    // mode: 'light' | 'dark' | 'system'
    try { if (mode === 'system') localStorage.removeItem('oneid_theme'); else localStorage.setItem('oneid_theme', mode); } catch (e) { /* ignore */ }
    const dark = mode === 'dark' || (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    $$('[data-theme-toggle]').forEach(b => { b.innerHTML = ic(dark ? 'light_mode' : 'dark_mode'); b.title = tr(dark ? 'Kunduzgi rejim' : 'Tungi rejim'); });
  }
  function themeMode() { try { return localStorage.getItem('oneid_theme') || 'system'; } catch (e) { return 'system'; } }
  function setLang(lang) {
    if (lang === state.lang) return;
    local.set('lang', lang);
    location.reload();
  }
  function themeBtn() { return `<button class="icon-btn" data-theme-toggle aria-label="Tungi rejim" title="${isDark() ? 'Kunduzgi rejim' : 'Tungi rejim'}">${ic(isDark() ? 'light_mode' : 'dark_mode')}</button>`; }

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ic = (n, c = '') => `<span class="ms ${c}">${n}</span>`;
  const app = $('#app');

  function toast(msg, icon = 'check_circle') {
    const t = $('#toast');
    t.innerHTML = ic(icon, 'fill') + '<span>' + esc(tr(msg)) + '</span>';
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function every(fn, ms) { const id = setInterval(fn, ms); state.timers.push(id); return id; }
  function clearTimers() { state.timers.forEach(clearInterval); state.timers = []; }
  function go(path) { location.hash = '#/' + path; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function nowTime() { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }

  // Pseudo QR code (decorative, deterministic)
  function qrSVG(seed = 7, size = 25) {
    let s = seed * 9301 + 49297;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    let cells = '';
    const finder = (x, y) => x < 7 && y < 7 || x >= size - 7 && y < 7 || x < 7 && y >= size - 7;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (finder(x, y)) continue;
      if (rnd() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" fill="#0f1b3d">${cells}${f(0, 0)}${f(size - 7, 0)}${f(0, size - 7)}</svg>`;
  }
  // Portrait silhouette
  function personSVG(suit = '#1d2a44') {
    return `<svg viewBox="0 0 100 110"><circle cx="50" cy="38" r="20" fill="#c9a389"/><path d="M30 34c0-14 9-22 20-22s20 8 20 22c-3-6-9-9-20-9s-17 3-20 9z" fill="#2b2420"/><path d="M8 110c2-26 18-38 42-38s40 12 42 38z" fill="${suit}"/><path d="M42 72l8 16 8-16z" fill="#fff"/><path d="M48 76h4l2 22-4 5-4-5z" fill="#7a1d2c"/></svg>`;
  }
  function photo(tag, suit) { return `<div class="photo">${personSVG(suit)}${tag ? `<span class="tag">${tag}</span>` : ''}</div>`; }

  // ---------- Auth shell ----------
  function authShell(inner, single) {
    return `
    <div class="auth fade-in">
      <header class="auth-top">
        <a class="brand" href="#/login">
          <div class="brand-logo">${ic('verified_user', 'fill')}</div>
          <div><div class="t1">O'zbekiston Respublikasi</div><div class="t2">YAGONA IDENTIFIKATSIYA TIZIMI - ONEID</div></div>
        </a>
        <div class="row" style="gap:14px">
          <div class="call"><div class="icon-box green">${ic('support_agent', 'sm')}</div><div><div class="xs faint">24/7 Call Markaz</div><div class="bold small">+998 71 202-32-32 • 1120</div></div></div>
          ${langSwitch()}
          ${themeBtn()}
        </div>
      </header>
      <main class="auth-main ${single ? 'single' : ''}">${inner}</main>
      <footer class="auth-foot">
        <div class="row"><span class="ms primary">account_balance</span><div><div class="bold small">Raqamli Texnologiyalar Vazirligi</div><div class="xs muted">© ${new Date().getFullYear()} Yagona Identifikatsiya Tizimi. Barcha huquqlar himoyalangan.</div></div></div>
        <div class="row wrap"><span class="badge-out">${ic('lock', 'sm')} SSL/TLS 256-BIT SECURE</span><span class="badge-out">${ic('shield', 'sm')} KIBERXAVFSIZLIK MARKAZI AKKREDITATSIYALANGAN</span></div>
      </footer>
    </div>`;
  }
  function langSwitch() {
    return `<div class="lang">${[['uz', 'O\'ZB'], ['ru', 'РУС'], ['en', 'ENG']].map(l => `<button data-lang="${l[0]}" class="${state.lang === l[0] ? 'active' : ''}">${l[1]}</button>`).join('')}</div>`;
  }

  // ---------- LOGIN ----------
  function loginPage() {
    const a = Math.floor(Math.random() * 40) + 10, b = Math.floor(Math.random() * 9) + 1;
    state.captcha = a + b;
    return authShell(`
      <section class="stack">
        <span class="chip blue" style="align-self:flex-start"><span class="dot"></span> DAVLAT STANDARTI O'ZDST 2580:2020</span>
        <div>
          <div class="upper" style="color:var(--primary)">Elektron hukumat markazi</div>
          <h1 class="h1" style="margin-top:6px">Davlat va bank xizmatlariga yagona xavfsiz kalit</h1>
          <p class="muted" style="margin-top:10px">OneID ekotizimi orqali barcha davlat idoralari portallari, soliq, bojxona va moliyaviy tizimlarga yagona hisob yozuvi bilan xavfsiz kiring.</p>
        </div>
        <div class="card feature"><div class="icon-box">${ic('public')}</div><div><div class="h3">600+ Davlat xizmatlari</div><div class="small muted">MyGov, Davlat soliq, Bojxona, Kadastr va IIV interaktiv xizmatlariga uzluksiz integratsiyalashgan kirish.</div></div></div>
        <div class="card feature"><div class="icon-box green">${ic('lock', 'fill')}</div><div><div class="h3">256-Bit Kriptografik Himoya</div><div class="small muted">Davlat axborot xavfsizligi GOST 34.311 hamda xalqaro TLS/SSL shifrlash protokollari asosida to'liq muhofazalangan.</div></div></div>
        <div class="card feature"><div class="icon-box">${ic('fingerprint')}</div><div><div class="h3">Mobile-ID & Biometriya</div><div class="small muted">Smartfoningizdagi Face-ID yoki barmoq izi orqali parolsiz bir necha soniyada shaxsingizni tasdiqlang.</div></div></div>
        <div class="card row between" style="padding:12px 16px"><div class="row"><div class="icon-box green" style="width:32px;height:32px;border-radius:50%">${ic('verified', 'sm fill')}</div><div><div class="small bold">Real vaqtda kiber-monitoring faol</div><div class="xs muted">Sertifikat: UZ-CERT #4492-2024 • Markaziy Klaster OK</div></div></div><b class="green small">200 OK</b></div>
        <div class="alert-box">${ic('notifications_active', 'primary')}<div><div class="small bold">Muhim xavfsizlik ogohlantirishi:</div><div class="small muted">OneID ma'muriyati hech qachon fuqarolardan SMS orqali yuborilgan tasdiqlash kodini yoki parolini telefon orqali so'ramaydi!</div></div></div>
      </section>

      <section class="card pad stack" style="gap:18px">
        <div class="row between"><div><div class="h2" style="font-size:20px">Tizimga kirish</div><div class="small muted">Davlat raqamli portali va shaxsiy kabinetingizga kirish usulini tanlang</div></div><span class="chip green">${ic('lock', 'sm')} XAVFSIZ TIZIM</span></div>
        <div class="tabs" id="loginTabs">
          <button class="tab active" data-tab="pass">${ic('key', 'sm')}Login & Parol</button>
          <button class="tab" data-tab="eimzo">${ic('badge', 'sm')}E-IMZO</button>
          <button class="tab" data-tab="qr">${ic('qr_code_2', 'sm')}QR-kod</button>
          <button class="tab" data-tab="mobile">${ic('smartphone', 'sm')}Mobile-ID</button>
        </div>
        <div id="loginPanel"></div>
        <div class="divider">MUQOBIL IMKONIYATLAR</div>
        <div class="alt">
          <button data-tab-jump="qr"><div class="icon-box" style="width:34px;height:34px">${ic('phone_iphone', 'sm')}</div><div class="grow"><div class="small bold">OneID Mobile ilova</div><div class="xs muted">AppStore & PlayMarket</div></div>${ic('chevron_right', 'faint')}</button>
          <button data-tab-jump="eimzo"><div class="icon-box green" style="width:34px;height:34px">${ic('verified', 'sm')}</div><div class="grow"><div class="small bold">E-IMZO Moduli</div><div class="xs green">Faol ishlamoqda</div></div><b class="small">v4.8.2</b></button>
        </div>
        <div class="row between wrap" style="padding:12px 14px;border-radius:12px;background:var(--surface-2)"><span class="small">Hali hisobingiz yo'qmi? <a class="primary bold" href="#" data-toast="Ro'yxatdan o'tish uchun yaqin Davlat xizmatlari markaziga murojaat qiling">OneID tizimida ro'yxatdan o'tish</a></span><span class="small muted row" style="gap:4px">${ic('headset_mic', 'sm')} Yordam yoki 1120</span></div>
      </section>`);
  }

  const loginPanels = {
    pass: () => `
      <form id="passForm" class="stack" style="gap:14px" novalidate>
        <div class="field"><label><span>JShShIR (PINFL) yoki Login ${ic('help', 'sm faint')}</span><span class="faint" id="pinflCount">14 ta raqam</span></label>
          <div class="input">${ic('badge')}<input id="login" autocomplete="username" placeholder="Masalan: 31205840250019" maxlength="20">${ic('verified_user', 'green')}</div></div>
        <div class="field"><label><span>Maxfiy parol</span><a href="#" class="primary" data-toast="Parolni tiklash havolasi ${USER.phone} raqamiga yuborildi">Parolni unutdingizmi?</a></label>
          <div class="input">${ic('key')}<input id="password" type="password" autocomplete="current-password" placeholder="••••••••••••"><button type="button" id="eye" aria-label="Parolni ko'rsatish">${ic('visibility')}</button></div></div>
        <div class="captcha"><div class="icon-box" style="width:34px;height:34px">${ic('shield_person', 'sm')}</div><div class="grow"><div class="small bold">Kiber-himoya kodi</div><div class="xs muted">Robot emasligingizni tasdiqlang</div></div><div class="q" id="capQ">? + ? = <button type="button" id="capRefresh" aria-label="Yangilash">${ic('refresh', 'sm')}</button></div><input id="captcha" inputmode="numeric" placeholder="Javob"></div>
        <label class="check"><input type="checkbox" id="remember"> Meni ushbu kompyuterda eslab qolish (Eslatma: Begona yoki umumiy kompyuterlarda belgilamang)</label>
        <div id="loginErr" class="notice red" style="display:none">${ic('error')}<p></p></div>
        <button class="btn btn-primary btn-block" type="submit">${ic('lock', 'sm')} OneID orqali Kirish</button>
        <div class="xs faint" style="text-align:center">Demo: istalgan login va parol (4+ belgi) kiriting, keyingi bosqichda PIN: <b class="mono">${DEMO_PIN}</b></div>
      </form>`,
    eimzo: () => `
      <div class="stack" style="gap:12px">
        <div class="notice green">${ic('usb')}<div><div class="small bold">E-IMZO moduli aniqlandi (v4.8.2)</div><p>Kompyuteringizda 1 ta amal qiluvchi ERI kaliti topildi.</p></div></div>
        <label class="card row" style="padding:14px;cursor:pointer;border-color:var(--primary-2)"><input type="radio" name="key" checked style="accent-color:var(--primary)"><div class="icon-box">${ic('key', 'fill')}</div><div class="grow"><div class="bold small">${USER.full.toUpperCase()}</div><div class="xs muted">JShShIR: ${USER.pinfl} • Jismoniy shaxs</div><div class="xs green">Amal qilish muddati: 12.03.2027 gacha</div></div></label>
        <div class="field"><label><span>ERI kalit paroli</span></label><div class="input">${ic('password')}<input id="eriPass" type="password" placeholder="Kalit parolini kiriting"></div></div>
        <button class="btn btn-primary btn-block" id="eriBtn">${ic('badge', 'sm')} ERI kalit bilan kirish</button>
      </div>`,
    qr: () => `
      <div class="stack" style="gap:14px">
        <div class="qr-wrap"><div class="qr-frame">${qrSVG(41, 29)}<div class="scan-line"></div></div><div class="xs" style="color:#b8c7ea;margin-top:10px">Kod yangilanadi: <b id="qrTimer" class="mono" style="color:#fff">01:42</b></div></div>
        <ol class="small muted" style="padding-left:18px;display:grid;gap:4px"><li>Smartfoningizda <b>OneID Mobile</b> ilovasini oching</li><li>«QR Skaner» bo'limini tanlang va kodni skanerlang</li><li>Telefonda Face-ID yoki PIN orqali kirishni tasdiqlang</li></ol>
        <div id="qrSession"></div>
        <button class="btn btn-soft btn-block" id="qrSim">${ic('qr_code_scanner', 'sm')} Skanerlashni simulyatsiya qilish</button>
      </div>`,
    mobile: () => `
      <div class="stack" style="gap:14px">
        <div class="field"><label><span>Mobil telefon raqami</span><span class="faint">OneID'ga bog'langan</span></label><div class="input">${ic('call')}<b class="small" style="color:var(--text)">+998</b><input id="phone" inputmode="tel" placeholder="90 123 45 67" maxlength="12"></div></div>
        <div class="notice">${ic('info')}<p>Raqamingizga Mobile-ID so'rovi yuboriladi. Ilovada biometrik tasdiqlashdan so'ng avtomatik kirasiz.</p></div>
        <button class="btn btn-primary btn-block" id="mobileBtn">${ic('send_to_mobile', 'sm')} Mobile-ID so'rovini yuborish</button>
      </div>`
  };

  function mountLogin() {
    const panel = $('#loginPanel');
    const show = (tab) => {
      clearTimers();
      $$('#loginTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      panel.innerHTML = '<div class="fade-in">' + loginPanels[tab]() + '</div>';
      ({ pass: mountPass, eimzo: mountEri, qr: mountQr, mobile: mountMobile })[tab]();
      translate(panel);
    };
    $$('#loginTabs .tab').forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
    $$('[data-tab-jump]').forEach(b => b.addEventListener('click', () => show(b.dataset.tabJump)));
    show('pass');
  }
  function newCaptcha() {
    const a = Math.floor(Math.random() * 40) + 10, b = Math.floor(Math.random() * 9) + 1;
    state.captcha = a + b;
    $('#capQ').firstChild.textContent = `${a} + ${b} = `;
    $('#captcha').value = '';
  }
  function mountPass() {
    newCaptcha();
    $('#capRefresh').onclick = newCaptcha;
    $('#eye').onclick = () => {
      const p = $('#password'); const show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('#eye').innerHTML = ic(show ? 'visibility_off' : 'visibility');
    };
    $('#login').addEventListener('input', e => {
      const v = e.target.value; const digits = v.replace(/\D/g, '');
      $('#pinflCount').textContent = /^\d+$/.test(v) ? `${digits.length}/14 raqam` : '14 ta raqam';
    });
    $('#passForm').addEventListener('submit', e => {
      e.preventDefault();
      const err = $('#loginErr');
      const fail = (m) => { err.style.display = 'flex'; err.querySelector('p').textContent = tr(m); };
      const login = $('#login').value.trim(), pass = $('#password').value;
      if (login.length < 3) return fail('JShShIR yoki loginni kiriting.');
      if (/^\d+$/.test(login) && login.length !== 14) return fail('JShShIR (PINFL) 14 ta raqamdan iborat bo\'lishi kerak.');
      if (pass.length < 4) return fail('Parol kamida 4 ta belgidan iborat bo\'lishi kerak.');
      if (Number($('#captcha').value) !== state.captcha) { newCaptcha(); return fail('Kiber-himoya kodi noto\'g\'ri. Qaytadan urinib ko\'ring.'); }
      err.style.display = 'none';
      state.stage = 'password'; store.set('stage', 'password');
      go('pin');
    });
  }
  function mountEri() {
    $('#eriBtn').onclick = () => {
      if (!$('#eriPass').value) return toast('ERI kalit parolini kiriting', 'error');
      toast('ERI imzosi tekshirildi');
      completeLogin();
    };
  }
  function mountQr() {
    let sec = 102;
    every(() => {
      sec = sec <= 0 ? 120 : sec - 1;
      const t = $('#qrTimer'); if (t) t.textContent = pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
    }, 1000);
    $('#qrSim').onclick = () => {
      $('#qrSim').style.display = 'none';
      $('#qrSession').innerHTML = `
        <div class="card fade-in" style="padding:14px">
          <div class="row between"><div class="row"><div class="icon-box">${ic('computer')}</div><div><div class="upper">Aniqlangan sessiya</div><div class="bold">Yagona portal (my.gov.uz)</div></div></div><span class="chip blue">${ic('timer', 'sm')} 01:42</span></div>
          <div class="kv" style="margin-top:12px"><div><div class="k">Qurilma & brauzer</div><div class="v small">Chrome • Windows 11</div></div><div><div class="k">Hudud & IP</div><div class="v small">Toshkent (84.54.82.***)</div></div><div><div class="k">Fuqaro (F.I.Sh)</div><div class="v small">Azizbek B. Karimov</div></div><div><div class="k">JShShIR</div><div class="v small mono">${USER.pinfl}</div></div></div>
          <div class="row" style="margin-top:12px"><button class="btn btn-primary grow" id="qrOk">${ic('fingerprint', 'sm')} Kirishni tasdiqlash</button><button class="btn btn-ghost" id="qrNo">${ic('close', 'sm')} Bekor qilish</button></div>
        </div>`;
      translate($('#qrSession'));
      $('#qrOk').onclick = () => { toast('Telefon orqali tasdiqlandi'); completeLogin(); };
      $('#qrNo').onclick = () => { $('#qrSession').innerHTML = ''; $('#qrSim').style.display = ''; toast('Sessiya bekor qilindi', 'cancel'); };
    };
  }
  function mountMobile() {
    $('#mobileBtn').onclick = () => {
      const d = $('#phone').value.replace(/\D/g, '');
      if (d.length !== 9) return toast('Telefon raqamini to\'liq kiriting (9 ta raqam)', 'error');
      state.stage = 'password'; store.set('stage', 'password');
      state.pinTab = 'push';
      toast('Mobile-ID so\'rovi yuborildi');
      go('pin');
    };
  }
  function completeLogin() {
    state.stage = 'done'; store.set('stage', 'done');
    go('success');
  }

  // ---------- PIN (2FA) ----------
  function pinPage() {
    return authShell(`
      <section class="stack">
        <span class="chip blue" style="align-self:flex-start">${ic('shield', 'sm fill')} IKKI BOSQICHLI XAVFSIZLASH (2FA) • O'ZDST 2580:2020</span>
        <div><h1 class="h1">Shaxsiy hisobga kirishni xavfsiz tasdiqlash</h1>
        <p class="muted" style="margin-top:10px">Sizning hisobingiz kiberxavfsizlik talablariga muvofiq ikki bosqichli autentifikatsiya bilan himoyalangan. Kirish so'rovini tasdiqlash usulini tanlang va kodni kiriting.</p></div>
        <div class="card pad stack" style="gap:14px">
          <div class="row between"><span class="small bold row" style="gap:6px"><span class="dot green"></span> Aktiv kirish sessiyasi auditi</span><span class="chip green">GOST 34.311 (256-bit AES)</span></div>
          <div class="row" style="background:var(--primary-soft);padding:12px;border-radius:12px">${photo('', '#1d2a44').replace('class="photo"', 'class="photo" style="width:52px;height:60px"')}<div><div class="upper">Identifikatsiyalangan fuqaro</div><div class="bold">${USER.full}</div><div class="small primary mono bold">JShShIR: ${USER.pinfl}</div></div></div>
          <div class="kv"><div><div class="k">Platforma & tizim</div><div class="v small">${ic('desktop_windows', 'sm')} Desktop: my.gov.uz</div></div><div><div class="k">Qurilma / brauzer</div><div class="v small">${ic('language', 'sm')} Chrome 122 • Win 11</div></div><div><div class="k">Geolokatsiya / IP</div><div class="v small">${ic('location_on', 'sm')} Toshkent, UZ (84.54.82.***)</div></div><div><div class="k">So'rov vaqti</div><div class="v small">${ic('schedule', 'sm')} Bugun, <span id="reqTime">${nowTime()}</span></div></div></div>
        </div>
        <div class="alert-box red">${ic('gpp_maybe', 'red fill')}<div><div class="small bold red">Xavfsizlik ogohlantirishi</div><div class="small" style="color:#7a1b1b">Agar ushbu kirish so'rovi siz tomondan amalga oshirilmagan bo'lsa, zudlik bilan <a href="#" class="bold" style="text-decoration:underline" data-cancel>Sessiyani bekor qilish</a> tugmasini bosing va o'z parolingizni yangilang.</div></div></div>
        <div class="card row between" style="padding:12px 16px"><div class="row">${ic('phone_in_talk', 'primary')}<div><div class="xs muted">24/7 Kiber-nazorat markazi</div><div class="small bold">Yagona raqam: 1120 yoki +998 71 202-32-32</div></div></div><button class="btn btn-ghost btn-sm" data-toast="Operator bilan bog'lanilmoqda...">Tezkor aloqa</button></div>
      </section>

      <section class="card" style="overflow:hidden">
        <div class="row between" style="padding:18px 20px;background:var(--surface-2);border-bottom:1px solid var(--line)"><div class="row"><div class="icon-box" style="background:var(--primary);color:#fff">${ic('lock_person', 'fill')}</div><div><div class="upper">Davlat interaktiv xizmatlari</div><div class="h3" style="font-size:17px">Xavfsiz Autentifikatsiya</div></div></div><span class="chip green">${ic('verified_user', 'sm')} Tasdiqlanmoqda</span></div>
        <div class="pad stack" style="gap:16px">
          <div class="tabs" id="pinTabs">
            <button class="tab active" data-tab="pin">${ic('dialpad', 'sm')}PIN-kod (5 raqam)</button>
            <button class="tab" data-tab="sms">${ic('sms', 'sm')}SMS OTP kod</button>
            <button class="tab" data-tab="push">${ic('mobile_friendly', 'sm')}OneID Mobile Push</button>
          </div>
          <div id="pinPanel"></div>
          <div class="row" style="gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary grow" style="height:48px" id="pinSubmit">${ic('lock_open', 'sm')} Tasdiqlash va Tizimga kirish</button>
            <button class="btn btn-danger" style="height:48px" data-cancel>${ic('cancel', 'sm')} Kirishni bekor qilish</button>
          </div>
          <div class="row between wrap" style="padding:12px 14px;border-radius:12px;background:var(--surface-2)"><span class="xs muted row" style="gap:6px">${ic('verified', 'sm green')} O'zbekiston Respublikasi Kiberxavfsizlik markazi talablariga muvofiq barcha harakatlar audit qilinadi.</span><span class="badge-out" style="font-size:10px">${ic('lock', 'sm')} TLS 256-BIT ENCRYPTED</span></div>
        </div>
      </section>`, true);
  }
  const pinPanels = {
    pin: () => `
      <div class="stack" style="gap:16px">
        <div class="row between"><div><div class="bold">Maxfiy PIN-kodni kiriting</div><div class="small muted">OneID profilida o'rnatilgan 5 xonali raqamli xavfsizlik kodi</div></div><span class="chip red" id="attempts">${ic('timer', 'sm')} 3 ta urinish qoldi</span></div>
        <div class="pin-dots" id="dots">${[0, 1, 2, 3, 4].map(i => `<div class="pin-dot" data-i="${i}"></div>`).join('')}</div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-k="${n}">${n}<small>${['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'][n - 1]}</small></button>`).join('')}
          <button class="key" data-k="bio" aria-label="Biometriya" style="color:var(--primary)">${ic('fingerprint', 'lg')}</button><button class="key" data-k="0">0</button><button class="key" data-k="del" aria-label="O'chirish" style="background:var(--primary-soft)">${ic('backspace')}</button></div>
        <div class="xs faint" style="text-align:center">${ic('keyboard', 'sm')} Klaviatura orqali ham to'g'ridan-to'g'ri kiritish mumkin • Demo PIN: <b class="mono">${DEMO_PIN}</b></div>
        <div class="row between wrap small"><a href="#" class="primary bold" data-switch="sms">${ic('sms', 'sm')} SMS orqali OTP kod olish (${USER.phone})</a><a href="#" class="muted" data-toast="PIN-kodni tiklash uchun SMS yuborildi">PIN-kodni unutdingizmi?</a></div>
      </div>`,
    sms: () => `
      <div class="stack" style="gap:14px">
        <div><div class="bold">SMS orqali yuborilgan kodni kiriting</div><div class="small muted">${USER.phone} raqamiga 6 xonali bir martalik kod yuborildi</div></div>
        <div class="input" style="height:56px"><span class="ms">sms</span><input id="otp" inputmode="numeric" maxlength="6" placeholder="• • • • • •" style="font-size:22px;letter-spacing:.5em;font-family:var(--mono)"></div>
        <div class="row between small"><span class="muted">Kodni qayta yuborish: <b id="otpTimer" class="mono">00:59</b></span><button class="primary bold" id="resend" disabled style="opacity:.5">Qayta yuborish</button></div>
        <div class="notice">${ic('info')}<p>Demo rejimda istalgan 6 xonali kod qabul qilinadi.</p></div>
      </div>`,
    push: () => `
      <div class="stack" style="gap:14px;align-items:center;text-align:center;padding:10px 0">
        <div class="success-mark" style="background:var(--primary-soft);color:var(--primary)">${ic('send_to_mobile')}</div>
        <div><div class="bold">Telefoningizga tasdiqlash so'rovi yuborildi</div><div class="small muted">OneID Mobile ilovasini oching va kirishni Face-ID orqali tasdiqlang</div></div>
        <div class="progress" style="width:100%"><div id="pushBar" style="width:0%"></div></div>
        <div class="xs faint">Kutilmoqda... <span id="pushSec">60</span> soniya</div>
        <button class="btn btn-soft" id="pushOk">${ic('check_circle', 'sm')} Telefonda tasdiqlandi (simulyatsiya)</button>
      </div>`
  };
  function mountPin() {
    if (state.stage === 'none') return go('login');
    every(() => { const t = $('#reqTime'); if (t) t.textContent = nowTime(); }, 1000);
    $$('[data-cancel]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); state.stage = 'none'; store.set('stage', 'none'); toast('Kirish so\'rovi bekor qilindi', 'cancel'); go('login'); }));
    const panel = $('#pinPanel');
    let pin = '', attempts = 3, mode = 'pin', localTimers = [];
    const stopLocal = () => { localTimers.forEach(clearInterval); localTimers = []; };
    const drawDots = () => $$('.pin-dot').forEach((d, i) => { d.classList.toggle('filled', i < pin.length); d.classList.toggle('current', i === pin.length); });
    const submit = () => {
      if (mode === 'pin') {
        if (pin.length < 5) return toast('PIN-kodni to\'liq kiriting', 'error');
        if (pin === DEMO_PIN) return completeLogin();
        attempts--; pin = ''; drawDots();
        const dots = $('#dots'); dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
        $('#attempts').innerHTML = ic('timer', 'sm') + ' ' + esc(tr(`Noto'g'ri! ${attempts} ta urinish qoldi`));
        if (attempts <= 0) { toast('Urinishlar tugadi. Hisob 15 daqiqaga bloklandi', 'block'); state.stage = 'none'; store.set('stage', 'none'); go('login'); }
      } else if (mode === 'sms') {
        if ($('#otp').value.replace(/\D/g, '').length !== 6) return toast('6 xonali kodni kiriting', 'error');
        completeLogin();
      } else completeLogin();
    };
    const show = (m) => {
      stopLocal(); mode = m; pin = '';
      $$('#pinTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === m));
      panel.innerHTML = '<div class="fade-in">' + pinPanels[m]() + '</div>';
      if (m === 'pin') {
        drawDots();
        $$('.key').forEach(k => k.addEventListener('click', () => press(k.dataset.k)));
        $$('[data-switch]', panel).forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(a.dataset.switch); }));
      } else if (m === 'sms') {
        let s = 59; const r = $('#resend');
        localTimers.push(setInterval(() => { s--; const t = $('#otpTimer'); if (t) t.textContent = '00:' + pad(Math.max(s, 0)); if (s <= 0) { r.disabled = false; r.style.opacity = 1; } }, 1000));
        r.onclick = () => { toast('Yangi kod yuborildi'); show('sms'); };
        $('#otp').focus();
        $('#otp').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      } else {
        let s = 60;
        localTimers.push(setInterval(() => { s--; const b = $('#pushBar'), t = $('#pushSec'); if (b) b.style.width = ((60 - s) / 60 * 100) + '%'; if (t) t.textContent = s; if (s <= 0) { stopLocal(); toast('So\'rov muddati tugadi', 'timer_off'); show('push'); } }, 1000));
        $('#pushOk').onclick = () => { toast('Face-ID orqali tasdiqlandi'); completeLogin(); };
      }
      translate(panel);
    };
    const press = (k) => {
      if (k === 'del') pin = pin.slice(0, -1);
      else if (k === 'bio') { toast('Biometrik tasdiqlash muvaffaqiyatli (99.8%)', 'face'); return setTimeout(completeLogin, 700); }
      else if (pin.length < 5) pin += k;
      drawDots();
      if (pin.length === 5) setTimeout(submit, 250);
    };
    state.keyHandler = (e) => {
      if (mode !== 'pin') return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') submit();
    };
    document.addEventListener('keydown', state.keyHandler);
    $$('#pinTabs .tab').forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
    $('#pinSubmit').onclick = submit;
    const initial = state.pinTab || 'pin'; state.pinTab = null;
    show(initial);
    state.cleanup = () => { stopLocal(); document.removeEventListener('keydown', state.keyHandler); };
  }

  // ---------- SUCCESS ----------
  function successPage() {
    return authShell(`
      <section class="stack">
        <div class="row between wrap"><span class="chip green">${ic('verified', 'sm fill')} PROTOKOL: GOST R 34.11-2012 / AES-256-GCM</span><span class="xs bold muted mono">ID-TOKEN: UZ-ONEID-99214-2024-X0</span></div>
        <div class="card pad stack">
          <div class="upper row" style="gap:6px;color:var(--green)"><span class="dot"></span> Muvaffaqiyatli autentifikatsiya • GOST 34.311 (256-bit AES)</div>
          <div class="row" style="gap:18px;align-items:flex-start"><div class="success-mark">${ic('verified_user', 'fill')}</div><div><div class="upper">Davlat axborot xavfsizligi markazi tasdiqlagan</div><h1 class="h1" style="color:var(--primary);margin:4px 0 6px">Tizimga muvaffaqiyatli kirdingiz!</h1><p class="muted small">Sizning shaxsingiz OneID yagona identifikatsiya tizimi orqali to'liq tasdiqlandi. Boshqaruv paneli va davlat xizmatlariga xavfsiz yo'naltirilmoqdasiz.</p></div></div>
          <div style="background:var(--surface-2);border-radius:12px;padding:14px" class="stack">
            <div class="row between small"><span class="bold row" style="gap:6px">${ic('sync', 'sm primary')} Avtomatik yo'naltirish jarayoni:</span><span><b id="cd" style="font-size:18px">5</b> soniya qoldi</span></div>
            <div class="progress"><div id="cdBar" style="width:0%"></div></div>
            <div class="row between wrap xs muted"><span>${ic('lock', 'sm')} Shaxsiy Kabinet sessiyasi tiklandi (Yagona Darcha my.gov.uz)</span><button class="primary bold xs" id="pause">${ic('pause_circle', 'sm')} Kutish rejimiga olish</button></div>
          </div>
          <div class="row wrap" style="gap:10px"><a class="btn btn-primary grow" style="height:48px" href="#/dashboard">Hoziroq Shaxsiy Kabinetga o'tish ${ic('arrow_forward', 'sm')}</a><button class="btn btn-ghost" style="height:48px" data-toast="Kvitansiya PDF formatida yuklab olindi">${ic('receipt_long', 'sm')} Kvitansiya (PDF)</button></div>
        </div>
        <div class="card pad"><div class="row between"><div class="row">${ic('shield', 'primary fill')}<b class="small">Kiberxavfsizlik va Ehtiyot Choralari</b></div><b class="small">AVTO-CHIQISH: 30 MIN</b></div>
          <p class="small muted" style="margin-top:8px">Agar ushbu kirish qurilma umumiy, ishxona yoki begona kompyuter bo'lsa, xizmatlardan foydalanib bo'lgach albatta "Tizimdan chiqish" tugmasini bosing. Ushbu sessiya 30 daqiqa harakatsizlikdan so'ng xavfsizlik maqsadida avtomatik tarzda bekor qilinadi.</p>
          <div class="row between wrap small" style="margin-top:10px"><a href="#" class="red bold" data-logout>${ic('error', 'sm')} Bu men emasman (Sessiyani zudlik bilan to'xtatish)</a><a href="#" class="primary" data-toast="Yo'riqnoma ochildi">Xavfsizlik yo'riqnomasi →</a></div></div>
      </section>
      <section class="stack">
        ${citizenCard()}
        <div class="card pad"><div class="row between" style="margin-bottom:8px"><b class="row" style="gap:6px">${ic('fact_check', 'primary')} Sessiya Xavfsizlik Auditi</b><span class="chip blue mono">SESS-ID #88219</span></div>
          ${[['schedule', 'Kirish vaqti:', 'Bugun, ' + nowTime() + ' (UZT)'], ['location_on', 'IP manzil & Hudud:', '84.54.82.*** (Toshkent, UZ)'], ['devices', 'Qurilma & Brauzer:', 'Chrome 122 • Windows 11'], ['fingerprint', 'Autentifikatsiya usuli:', '<span class="chip green">2FA PIN + Biometriya</span>'], ['key', 'Shifrlash kaliti:', '<span class="mono">#SEC-98421-EID</span>'], ['workspace_premium', 'Audit sertifikati:', 'UZ-CERT #4492-2024']].map(r => `<div class="set-row" style="padding:10px 0">${ic(r[0], 'sm faint')}<span class="small muted grow">${r[1]}</span><b class="small" style="text-align:right">${r[2]}</b></div>`).join('')}
          <div class="row between xs" style="margin-top:6px"><span class="green">● Barcha faolliklar jurnalga yozildi</span><a href="#" class="primary bold" data-toast="Audit jurnali yuklanmoqda">Batafsil audit jurnali ›</a></div></div>
      </section>`, true);
  }
  function citizenCard() {
    return `<div class="idcard">
      <div class="row between"><div class="row"><span class="ms">account_balance</span><div><div class="lbl">O'zbekiston Respublikasi</div><div class="val">ONEID FUQARO ID</div></div></div><span class="xs" style="opacity:.8">${ic('nfc', 'sm')} NFC-EID</span></div>
      <div class="row" style="gap:16px;margin-top:16px;align-items:center">${photo('', '#1d2a44').replace('class="photo"', 'class="photo" style="width:80px;height:96px"')}<div><span class="chip solid-green xs">● Daraja 3 - To'liq Identifikatsiyalangan</span><div class="name" style="margin-top:6px">${USER.last}</div><div class="val">${USER.first} ${USER.middle}</div><div class="xs" style="opacity:.75;margin-top:2px">Tug'ilgan sanasi: 14.05.1984 • Jinsi: Erkak (M)</div></div></div>
      <div class="idgrid" style="margin-top:16px">${[['JShShIR (PINFL)', USER.pinfl], ['Hujjat seriya & raqam', USER.idNo], ['Bog\'langan telefon', USER.phone], ['Elektron pochta', USER.email]].map(r => `<div style="background:rgba(255,255,255,.08);border-radius:10px;padding:10px"><div class="lbl">${r[0]}</div><div class="val mono" style="font-size:12.5px;word-break:break-all">${r[1]}</div></div>`).join('')}</div>
      <div class="row between xs" style="margin-top:14px;opacity:.85"><span class="mono">UZB-EID &lt;&lt; KARIMOV &lt;&lt; AZIZBEK &lt;&lt;&lt;&lt;&lt;</span><span style="color:var(--green-bright)">${ic('verified', 'sm')} UZ-CERT TASDIQLANGAN</span></div>
    </div>`;
  }
  function mountSuccess() {
    if (state.stage !== 'done') return go('login');
    state.authed = true; store.set('authed', true);
    let s = 5, paused = false;
    every(() => {
      if (paused) return;
      s--;
      const c = $('#cd'), b = $('#cdBar');
      if (c) c.textContent = Math.max(s, 0);
      if (b) b.style.width = ((5 - s) / 5 * 100) + '%';
      if (s <= 0) go('dashboard');
    }, 1000);
    $('#pause').onclick = () => { paused = !paused; $('#pause').innerHTML = paused ? ic('play_circle', 'sm') + ' ' + tr('Davom ettirish') : ic('pause_circle', 'sm') + ' ' + tr('Kutish rejimiga olish'); };
  }

  // ---------- APP SHELL ----------
  const NAV = [
    ['dashboard', 'id_card', 'Boshqaruv & Pasport'],
    ['documents', 'folder_shared', 'Hujjatlar portfeli', '8'],
    ['assets', 'directions_car', 'Mulk va Transport'],
    ['travel', 'flight_takeoff', 'Sayohat & Chegara'],
    ['deadlines', 'notifications_active', 'Muddatlar & Eslatmalar', '3', 'red'],
    ['settings', 'shield', 'Xavfsizlik & Sozlamalar']
  ];
  const BOTTOM = [['dashboard', 'badge', 'Pasport'], ['documents', 'folder', 'Hujjatlar'], ['assets', 'home_work', 'Mulklarim'], ['travel', 'flight', 'Sayohatlar'], ['settings', 'settings', 'Sozlamalar']];

  function appShell(route, content) {
    return `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="#/dashboard"><div class="brand-logo">${ic('account_balance', 'fill')}</div><div><div class="t2">DAVLAT RAQAMLI</div><div class="t1" style="font-size:9.5px">Portali • OneID</div></div></a>
        <div class="nav-label">ASOSIY XIZMATLAR</div>
        <nav class="nav">${NAV.map(n => `<a href="#/${n[0]}" class="${route === n[0] ? 'active' : ''}">${ic(n[1])}<span>${n[2]}</span>${n[3] ? `<span class="badge ${n[4] || ''}">${n[3]}</span>` : ''}</a>`).join('')}</nav>
        <div class="side-foot">
          <div class="side-card">${ic('fingerprint', 'green')}<div class="grow"><b>E-IMZO Moduli</b><span class="green xs">Drayver faol</span></div><span class="dot green" style="color:var(--green)"></span></div>
          <div class="side-card">${ic('support_agent', 'primary')}<div class="grow"><b>Call-markaz 24/7</b><span class="xs muted">1000 • 1120</span></div><span class="chip green">Bepul</span></div>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <a class="brand mobile-brand" href="#/dashboard" style="display:none"><div class="brand-logo" style="width:34px;height:34px">${ic('verified_user', 'fill')}</div><div><div class="t2" style="font-size:14px">OneID Portal</div><div class="t1">Pasport</div></div></a>
          <label class="search">${ic('search')}<input id="gSearch" placeholder="Xizmatlar, arizalar, guvohnomalar..."><span class="kbd">Ctrl K</span></label>
          <nav class="top-links"><a href="#" data-toast="Elektron arizalar bo'limi tez orada">Elektron Arizalar</a><a href="#" data-toast="QR tekshiruv skaneri ishga tushirildi">QR Tekshiruv</a><a href="#" data-toast="To'lovlar tarixi yuklanmoqda">To'lovlar Tarixi</a></nav>
          <div class="top-right">
            ${langSwitch()}
            ${themeBtn()}
            <div style="position:relative"><button class="icon-btn" id="bell" aria-label="Bildirishnomalar">${ic('notifications')}<span class="count">3</span></button>
              <div class="dropdown card" id="notif">
                <div class="row between" style="padding:6px 10px 10px"><b>Bildirishnomalar</b><a href="#/deadlines" class="xs primary bold">Barchasi</a></div>
                <a class="dd-item" href="#/deadlines"><div class="icon-box red" style="width:34px;height:34px">${ic('car_crash', 'sm')}</div><div><div class="small bold">OSAGO sug'urtasi tugamoqda</div><div class="xs muted">Chevrolet Malibu-2 • 10 kun qoldi</div></div></a>
                <a class="dd-item" href="#/deadlines"><div class="icon-box amber" style="width:34px;height:34px">${ic('build', 'sm')}</div><div><div class="small bold">Texnik ko'rik muddati</div><div class="xs muted">24 kun qoldi • YHXX</div></div></a>
                <a class="dd-item" href="#/settings"><div class="icon-box green" style="width:34px;height:34px">${ic('login', 'sm')}</div><div><div class="small bold">Yangi kirish aniqlandi</div><div class="xs muted">Toshkent • Chrome 122 • Bugun</div></div></a>
              </div></div>
            <a class="user" href="#/settings"><div><b>${USER.short} ${ic('verified', 'sm green fill')}</b><small>JSHSHIR: ${USER.pinfl}</small></div><div class="avatar">${USER.initials}</div></a>
            <button class="icon-btn" data-logout aria-label="Chiqish" title="Tizimdan chiqish">${ic('logout')}</button>
          </div>
        </header>
        <main class="page fade-in">${content}</main>
      </div>
      <nav class="bottom-nav">${BOTTOM.map(b => `<a href="#/${b[0]}" class="${route === b[0] ? 'active' : ''}">${ic(b[1])}<span>${b[2]}</span></a>`).join('')}</nav>
    </div>`;
  }

  // ---------- DASHBOARD ----------
  function dashboardPage() {
    return `
      <section class="hero">
        <div class="row wrap" style="gap:8px"><span class="chip solid-green">${ic('verified', 'sm')} ONEID: BIOMETRIK DARAJA (YUQORI)</span><span class="chip">Sessiya faol • E-IMZO 4.8.2</span></div>
        <div class="row between wrap" style="margin-top:12px;gap:16px;align-items:flex-end">
          <div><h1 class="h1">Xush kelibsiz, Azizbek Bahodirovich Karimov</h1>
          <div class="row wrap small" style="margin-top:8px;color:rgba(255,255,255,.85);gap:16px"><span>JShShIR: <b class="mono">${USER.pinfl}</b></span><span>Tug'ilgan sana: <b>${USER.birth}</b></span></div>
          <div class="xs" style="margin-top:8px;color:var(--green-bright)">${ic('history', 'sm')} Oxirgi kirish: Bugun, 09:41 (Toshkent, IP: 84.54.82.***)</div></div>
          <button class="btn btn-white" data-toast="Guvohnoma havolasi 24 soatga yaratildi va nusxalandi">${ic('qr_code_2', 'sm')} QR Guvohnoma Ulashish</button>
        </div>
      </section>
      <section class="stats">
        ${stat('Faol hujjatlar', '6', 'barchasi tasdiqlangan', 'ID-karta, Pasport, Haydovchilik, INN', 'badge')}
        ${stat('Ro\'yxatdagi mulklar', '3', 'ob\'ekt ro\'yxatda', '1 ko\'chmas mulk, 2 ta avtotransport', 'home_work')}
        ${stat('Xorijiy safarlar', '12', 'taqiq yo\'q', 'Oxirgi safar: BAA (Dubay) • Noyabr', 'flight')}
        <a href="#/deadlines" class="card stat alert"><div><div class="upper red">Shoshilinch eslatma</div><div class="num red">1 <small class="red">10 kun qoldi</small></div><div class="xs muted">OSAGO Sug'urtasi (Malibu-2)</div></div><div class="icon-box red">${ic('health_and_safety')}</div></a>
      </section>
      <section class="grid-main">
        <div class="stack" style="gap:20px">
          <div class="idcard">
            <div class="row between" style="align-items:flex-start"><div class="row" style="align-items:flex-start"><div class="icon-box" style="background:rgba(255,255,255,.12);color:#fff">${ic('military_tech')}</div><div><div class="lbl">O'zbekiston Respublikasi / Republic of Uzbekistan</div><div class="name" style="font-size:17px">FUQAROLIK IDENTIFIKATSIYA ID-KARTASI</div><div class="lbl">Identity card • Bio-metric chip-enabled</div></div></div><div style="text-align:right"><span class="chip solid-green">● FAOL • AMAL QILMOQDA</span><div class="lbl" style="margin-top:6px">Turi: I / ID-UZB</div></div></div>
            <div class="row" style="gap:20px;margin-top:20px;align-items:flex-start">
              <div style="text-align:center">${photo('BIO-UZ 2025')}<div class="xs" style="margin-top:6px;opacity:.75">${ic('fingerprint', 'sm')} Barmoq izi & Foto verifikatsiya</div></div>
              <div class="grow idgrid">
                <div style="grid-column:1/-1"><div class="lbl">Familiyasi, ismi, otasining ismi</div><div class="name">${USER.last} ${USER.first}<br>${USER.middle}</div></div>
                <div><div class="lbl">Hujjat seriya & raqami</div><div class="val mono">${USER.idNo}</div></div><div><div class="lbl">Jinsi / Sex</div><div class="val">ERKAK / M</div></div>
                <div><div class="lbl">Tug'ilgan sana</div><div class="val">${USER.birth}</div></div><div><div class="lbl">Millati / Nationality</div><div class="val">O'ZBEK / UZB</div></div>
                <div><div class="lbl">Berilgan sana</div><div class="val">${USER.idIssued}</div></div><div><div class="lbl">Amal qilish muddati</div><div class="val" style="color:var(--green-bright)">${USER.idExpiry}</div></div>
                <div style="grid-column:1/-1"><div class="lbl">Bergan organ</div><div class="val">Toshkent shahar Chilonzor tumani IIB FMB</div></div>
              </div>
              <div class="qr-mini"><div class="row between xs bold" style="margin-bottom:4px"><span>DINAMIK QR</span><span class="mono" id="dynQr">01:48</span></div><div id="dynQrCode">${qrSVG(3)}</div><div class="xs muted" style="margin-top:4px">Davlat organlari uchun</div><div class="xs green bold">100% Yuridik kuchga ega</div></div>
            </div>
            <div class="row between wrap mrz"><span>I&lt;UZBKARIMOV&lt;&lt;AZIZBEK&lt;BAHODIROVICH&lt;&lt;<br>FA98765432UZB8405125M3108154312058402</span><span class="row" style="gap:4px;color:#fff">${ic('verified', 'sm')} ICAO 9303 XALQARO STANDART</span></div>
          </div>
          <div class="card row wrap" style="padding:14px 16px"><div class="icon-box green">${ic('description')}</div><div class="grow"><div class="bold small">Yuridik kuchga ega raqamli pasport nusxasi</div><div class="xs muted">Vazirlar Mahkamasining 400-son qaroriga asosan tenglashtirilgan</div></div><button class="btn btn-ghost btn-sm" data-copy="${USER.idNo}">${ic('content_copy', 'sm')} Nusxa olish</button><button class="btn btn-primary btn-sm" data-toast="ID-karta nusxasi PDF formatida yuklandi">${ic('download', 'sm')} PDF yuklash</button></div>
          <div class="card pad">
            <div class="row between" style="margin-bottom:10px"><b class="row h3" style="gap:8px">${ic('fingerprint', 'primary')} Fuqaro ma'lumotlari reestri</b><a href="#/settings" class="small primary bold">Tahrirlash</a></div>
            <div class="table-wrap"><table class="table"><tbody>
              ${[['Fuqaroligi', 'O\'zbekiston Respublikasi 🇺🇿'], ['Jinsi', 'Erkak / MALE'], ['ID-karta raqami', USER.idNo], ['Berilgan sana / joy', USER.idIssued + ' / Toshkent sh.'], ['Doimiy yashash joyi', USER.address], ['Oilaviy holati', 'Oilali (FHDYO reestri)'], ['STIR (INN)', '512 345 678']].map(r => `<tr><td class="muted" style="width:40%">${r[0]}</td><td class="bold">${r[1]}</td></tr>`).join('')}
            </tbody></table></div>
          </div>
        </div>
        <div class="stack" style="gap:20px">
          <div class="card pad"><div class="row between"><b class="row h3" style="gap:8px">${ic('flight_takeoff', 'primary')} Chegara Chiqish Holati</b><span class="dot" style="color:var(--green)"></span></div>
            <div class="notice green" style="margin-top:12px">${ic('verified_user', 'fill')}<div><div class="small bold">CHIQISHGA CHEKLOV YO'Q (RUXSAT BERILGAN)</div><p>MIB (Majburiy ijro byurosi), IIV, Davlat soliq qo'mitasi va Bojxona organlarida cheklovlar topilmadi.</p></div></div>
            <div class="row between xs muted" style="margin-top:10px"><span>Oxirgi avto-tekshiruv:</span><b style="color:var(--text)">Bugun, 08:00</b></div></div>
          <div class="card pad"><div class="row between"><div class="row"><div class="icon-box red">${ic('car_crash')}</div><div><div class="h3">Shoshilinch Eslatma</div><div class="xs red">10 kun qoldi</div></div></div><span class="chip red">OSAGO</span></div>
            <div style="background:var(--surface-2);border-radius:12px;padding:12px;margin-top:12px"><div class="upper">Transport vositasi</div><div class="bold">Chevrolet Malibu-2 (01 A 777 BA)</div><div class="small muted">Sug'urta kompaniyasi: "Gross Insurance" AJ</div><div class="row between small" style="margin-top:6px"><span class="red">Tugash sanasi:</span><b>15.03.2025</b></div></div>
            <button class="btn btn-primary btn-block" style="margin-top:12px;height:42px" data-toast="MyGov orqali OSAGO uzaytirish sahifasi ochilmoqda">${ic('bolt', 'sm')} 1 Bosishda Uzaytirish (MyGov)</button></div>
          <div class="card pad"><b class="h3">Tezkor davlat xizmatlari</b>
            ${[['receipt_long', 'Ma\'lumotnoma (Propiska)', 'Doimiy ro\'yxat haqida', 'documents'], ['account_balance_wallet', 'Soliq qarzdorligini tekshirish', 'Davlat soliq qo\'mitasi', 'deadlines'], ['gavel', 'MIB qarzdorlik holati', 'Majburiy ijro byurosi', 'travel'], ['local_hospital', 'Tibbiy karta', 'Elektron tibbiyot tizimi', 'documents']].map(s => `<a class="set-row" href="#/${s[3]}" style="padding:12px 0"><div class="icon-box" style="width:36px;height:36px">${ic(s[0], 'sm')}</div><div class="grow"><div class="small bold">${s[1]}</div><div class="xs muted">${s[2]}</div></div>${ic('chevron_right', 'faint')}</a>`).join('')}</div>
        </div>
      </section>`;
  }
  function stat(label, num, sub, desc, icon) {
    return `<div class="card stat"><div><div class="upper">${label}</div><div class="num">${num}<small>${sub}</small></div><div class="xs muted">${desc}</div></div><div class="icon-box">${ic(icon)}</div></div>`;
  }
  function mountDashboard() {
    let s = 108, seed = 3;
    every(() => {
      s--; if (s <= 0) { s = 120; seed++; const q = $('#dynQrCode'); if (q) q.innerHTML = qrSVG(seed); }
      const t = $('#dynQr'); if (t) t.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 1000);
  }

  // ---------- DOCUMENTS ----------
  const DOCS = [
    { cat: 'shaxsiy', icon: 'badge', title: 'Fuqaro ID-kartasi', org: 'IIV Migratsiya va fuqarolikni rasmiylashtirish', no: USER.idNo, issued: USER.idIssued, exp: USER.idExpiry, status: 'Faol', color: 'blue' },
    { cat: 'shaxsiy', icon: 'flight', title: 'Xorijga chiqish pasporti', org: 'Toshkent sh. IIBB • ICAO 9303', no: USER.passNo, issued: USER.passIssued, exp: USER.passExpiry, status: 'Taqiq yo\'q', color: 'green' },
    { cat: 'haydovchilik', icon: 'directions_car', title: 'Haydovchilik guvohnomasi', org: 'IIV YHXX • Toifalar: B, C', no: 'AF 1234567', issued: '10.06.2018', exp: '10.06.2028', status: 'Faol', color: 'blue' },
    { cat: 'shaxsiy', icon: 'child_care', title: 'Tug\'ilganlik haqida guvohnoma', org: 'FHDYO • Toshkent sh.', no: 'I-TN 0458921', issued: '20.05.1984', exp: 'Muddatsiz', status: 'Arxiv', color: 'gray' },
    { cat: 'talim', icon: 'school', title: 'Oliy ma\'lumot diplomi (Bakalavr)', org: 'TATU • Dasturiy injiniring', no: 'B № 2045871', issued: '30.06.2006', exp: 'Muddatsiz', status: 'Tasdiqlangan', color: 'green' },
    { cat: 'tibbiy', icon: 'medical_information', title: 'Elektron tibbiy karta', org: 'Sog\'liqni saqlash vazirligi', no: 'MED-31205840', issued: '01.02.2022', exp: 'Muddatsiz', status: 'Faol', color: 'blue' }
  ];
  // ---------- Modal forma (qo'shish / tahrirlash) ----------
  const toISO = (d) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  const fromISO = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; };
  function openForm({ title, fields, values = {}, onSave, onDelete }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    const field = (f) => {
      const v = values[f.name] == null ? '' : values[f.name];
      let control;
      if (f.type === 'select') control = `<select name="${f.name}">${f.options.map(o => `<option value="${esc(o[0])}" ${String(v) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
      else if (f.type === 'date') control = `<input type="date" name="${f.name}" value="${esc(toISO(v))}">`;
      else control = `<input name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" maxlength="${f.max || 80}">`;
      return `<div class="field ${f.full ? 'full' : ''}"><label><span>${esc(f.label)}${f.required ? ' <b class="red">*</b>' : ''}</span></label><div class="input">${f.icon ? ic(f.icon) : ''}${control}</div></div>`;
    };
    back.innerHTML = `
      <form class="card modal" novalidate>
        <div class="modal-head"><b class="h2">${esc(title)}</b><button type="button" class="icon-btn" data-close aria-label="Yopish">${ic('close')}</button></div>
        <div class="modal-body">${fields.map(field).join('')}</div>
        <div class="modal-foot">${onDelete ? `<button type="button" class="btn btn-danger" data-del style="margin-right:auto">${ic('delete', 'sm')} O'chirish</button>` : ''}<button type="button" class="btn btn-ghost" data-close>Bekor qilish</button><button type="submit" class="btn btn-primary">${ic('check', 'sm')} Saqlash</button></div>
      </form>`;
    document.body.appendChild(back);
    translate(back);
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', e => { if (e.target === back) close(); });
    $$('[data-close]', back).forEach(b => b.addEventListener('click', close));
    if (onDelete) $('[data-del]', back).addEventListener('click', () => { close(); onDelete(); });
    const first = $('input, select', back); if (first) first.focus();
    $('form', back).addEventListener('submit', e => {
      e.preventDefault();
      const data = {}; let ok = true;
      fields.forEach(f => {
        const el = back.querySelector(`[name="${f.name}"]`);
        let v = el.value.trim();
        if (f.type === 'date') v = fromISO(v);
        data[f.name] = v;
        const bad = f.required && !v;
        el.closest('.input').classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) return toast("Majburiy maydonlarni to'ldiring", 'error');
      close();
      onSave(data);
    });
  }
  function confirmDelete(name, onYes) {
    if (confirm(tr("O'chirish") + ': "' + name + '"?')) onYes();
  }

  // ---------- Foydalanuvchi qo'shgan hujjatlar ----------
  const DOC_CATS = [['shaxsiy', 'Shaxsiy'], ['haydovchilik', 'Haydovchilik'], ['talim', 'Ta\'lim'], ['tibbiy', 'Tibbiy'], ['boshqa', 'Boshqa']];
  const DOC_ICONS = { shaxsiy: 'badge', haydovchilik: 'directions_car', talim: 'school', tibbiy: 'medical_information', boshqa: 'description' };
  const userDocs = () => local.get('docs', []);
  const allDocs = () => DOCS.concat(userDocs().map(d => Object.assign({ icon: DOC_ICONS[d.cat] || 'description', status: 'Qo\'shilgan', color: 'amber', custom: true }, d)));
  function docForm(doc) {
    openForm({
      title: doc ? 'Hujjatni tahrirlash' : 'Yangi hujjat qo\'shish',
      values: doc || { cat: 'shaxsiy' },
      fields: [
        { name: 'title', label: 'Hujjat nomi', required: true, full: true, icon: 'description', placeholder: 'Masalan: Nikoh guvohnomasi' },
        { name: 'cat', label: 'Toifasi', type: 'select', options: DOC_CATS.map(c => [c[0], tr(c[1])]) },
        { name: 'no', label: 'Seriya va raqam', required: true, icon: 'tag', placeholder: 'AA 1234567', max: 30 },
        { name: 'issued', label: 'Berilgan sana', type: 'date' },
        { name: 'exp', label: 'Amal qilish muddati', type: 'date' },
        { name: 'org', label: 'Bergan tashkilot', full: true, icon: 'account_balance', placeholder: 'Masalan: FHDYO, Toshkent sh.' }
      ],
      onSave: (data) => {
        const list = userDocs();
        if (doc) Object.assign(list.find(d => d.id === doc.id) || {}, data);
        else list.unshift(Object.assign({ id: uid() }, data));
        local.set('docs', list);
        toast('Hujjat saqlandi');
        render();
      },
      onDelete: doc ? () => deleteDoc(doc) : null
    });
  }
  function deleteDoc(doc) {
    confirmDelete(doc.title, () => { local.set('docs', userDocs().filter(d => d.id !== doc.id)); toast("Hujjat o'chirildi", 'delete'); render(); });
  }

  function documentsPage() {
    const docs = allDocs();
    const count = (c) => docs.filter(d => d.cat === c).length;
    const cats = [['all', 'Barchasi', docs.length]].concat(DOC_CATS.map(c => [c[0], c[1], count(c[0])]).filter(c => c[2] > 0));
    return `
      <section class="card pad row wrap between" style="gap:16px">
        <div class="row" style="align-items:flex-start;gap:14px"><div class="icon-box" style="background:var(--primary);color:#fff;width:48px;height:48px">${ic('folder_shared', 'fill')}</div><div><div class="xs bold green">ADLIYA & IIV REESTRI • <span class="muted">Real vaqtda integratsiya</span></div><h1 class="h1" style="font-size:26px">Raqamli Hujjatlar Portfeli</h1><p class="small muted" style="max-width:560px">O'zbekiston Respublikasi Vazirlar Mahkamasining qaroriga muvofiq, ilovadagi barcha raqamli hujjatlar qog'oz nusxa bilan qonuniy teng kuchga ega.</p></div></div>
        <div class="row wrap"><span class="chip green" style="height:40px;padding:0 14px;border-radius:10px">${ic('task_alt', 'sm')} <span>${docs.length} ta faol davlat hujjati</span></span><button class="btn btn-soft" data-toast="Yagona QR-kod yaratildi (5 daqiqa amal qiladi)">${ic('qr_code_2', 'sm')} Yagona QR-kod</button><button class="btn btn-primary" id="addDoc">${ic('add', 'sm')} Hujjat qo'shish</button></div>
      </section>
      <section class="row wrap" style="gap:12px">
        <label class="search" style="max-width:none;flex:1;min-width:240px;background:#fff;border:1px solid var(--line)">${ic('search')}<input id="docSearch" placeholder="Hujjat nomi, seriyasi yoki turi bo'yicha qidirish"></label>
        <div class="pills" id="docPills">${cats.map((c, i) => `<button class="pill ${i === 0 ? 'active' : ''}" data-cat="${c[0]}">${c[1]}${c[2] ? ` <span class="count">${c[2]}</span>` : ''}</button>`).join('')}</div>
      </section>
      <section class="grid-2" id="docGrid"></section>`;
  }
  function docCard(d) {
    const chip = d.color === 'green' ? 'green' : d.color === 'gray' ? '' : d.color === 'amber' ? 'amber' : 'blue';
    const t = esc(d.title);
    const actions = d.custom
      ? `<button class="btn btn-ghost btn-sm" data-edit-doc="${d.id}">${ic('edit', 'sm')} <span>Tahrirlash</span></button><button class="btn btn-danger btn-sm" data-del-doc="${d.id}" aria-label="O'chirish">${ic('delete', 'sm')}</button>`
      : `<button class="btn btn-ghost btn-sm" data-toast="${t}: QR">${ic('qr_code', 'sm')} QR</button><button class="btn btn-soft btn-sm" data-toast="${t}: PDF">Ko'rish ${ic('chevron_right', 'sm')}</button>`;
    return `<div class="card fade-in" style="overflow:hidden">
      <div class="row" style="padding:16px 18px;border-bottom:1px solid var(--line)"><div class="icon-box">${ic(d.icon)}</div><div class="grow"><div class="bold">${t}</div><div class="xs muted">${esc(d.org) || '—'}</div></div><span class="chip ${chip}">${esc(d.status)}</span></div>
      <div style="padding:16px 18px" class="stack"><div class="kv"><div><div class="k">Seriya va raqam</div><div class="v mono">${esc(d.no)}</div></div><div><div class="k">Amal qilish muddati</div><div class="v">${esc(d.exp) || 'Muddatsiz'}</div></div><div><div class="k">Berilgan sana</div><div class="v">${esc(d.issued) || '—'}</div></div><div><div class="k">Egasi</div><div class="v">${USER.short}</div></div></div>
      <div class="row between wrap"><span class="xs ${d.custom ? 'muted' : 'green'} row" style="gap:4px">${ic(d.custom ? 'person' : 'verified', 'sm')} <span>${d.custom ? 'Qo\'shilgan' : 'Davlat reestri bilan sinxron'}</span></span><div class="row">${actions}</div></div></div>
    </div>`;
  }
  function mountDocuments() {
    let cat = 'all';
    const draw = () => {
      const q = $('#docSearch').value.toLowerCase();
      const docs = allDocs();
      const list = docs.filter(d => (cat === 'all' || d.cat === cat) && (tr(d.title) + d.title + d.no + (d.org || '')).toLowerCase().includes(q));
      const grid = $('#docGrid');
      grid.innerHTML = list.length ? list.map(docCard).join('') : `<div class="empty" style="grid-column:1/-1">${ic('search_off')} <span>Hech narsa topilmadi</span></div>`;
      $$('[data-toast]', grid).forEach(el => el.addEventListener('click', e => { e.preventDefault(); toast(el.dataset.toast); }));
      $$('[data-edit-doc]', grid).forEach(b => b.addEventListener('click', () => docForm(userDocs().find(d => d.id === b.dataset.editDoc))));
      $$('[data-del-doc]', grid).forEach(b => b.addEventListener('click', () => deleteDoc(userDocs().find(d => d.id === b.dataset.delDoc))));
      translate(grid);
    };
    $('#addDoc').onclick = () => docForm(null);
    $$('#docPills .pill').forEach(p => p.addEventListener('click', () => { $$('#docPills .pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); cat = p.dataset.cat; draw(); }));
    $('#docSearch').addEventListener('input', draw);
    const g = sessionQuery(); if (g) { $('#docSearch').value = g; }
    draw();
  }
  function sessionQuery() { const q = state.globalQuery; state.globalQuery = ''; return q; }

  // ---------- ASSETS ----------
  function assetsPage() {
    return `
      <section class="row between wrap" style="gap:16px;align-items:flex-end">
        <div><div class="upper" style="color:var(--green)">● Davlat kadastri • YHXX • O'zkomnazorat reestri</div><h1 class="h1" style="margin-top:4px">Mening Mulklarim va Transport Reestri</h1><p class="small muted" style="max-width:640px;margin-top:6px">Yagona Identifikatsiya Tizimi (OneID) orqali yuridik tasdiqlangan mulkiy huquqlar va ro'yxatga olingan aktivlar yagona monitoringi.</p></div>
        <div class="row wrap"><button class="btn btn-ghost" data-toast="Reestr ko'chirmasi (PDF) yuklandi">${ic('download', 'sm')} Reestr ko'chirma (PDF)</button><button class="btn btn-primary" data-add-asset>${ic('add_circle', 'sm')} Mulkni ro'yxatdan o'tkazish</button></div>
      </section>
      <section class="stats">
        ${stat('Transport vositalari', '1', 'ta avtomobil', 'Chevrolet Malibu-2 • 01 777 AAB', 'directions_car')}
        ${stat('Ko\'chmas mulk', '2', 'ta ob\'ekt', 'Toshkent sh., Toshkent vil.', 'home_work')}
        ${stat('SIM-kartalar', '3', 'ta raqam', 'Himoyalangan • 1 ta asosiy', 'sim_card')}
        ${stat('Ishonchnomalar', '1', 'ta berilgan', 'Notarial tasdiqlangan', 'assignment_ind')}
      </section>
      <div class="pills" id="assetPills">${[['all', 'Barchasi', 7 + userAssets().length], ['custom', 'Mening qo\'shganlarim', userAssets().length], ['transport', 'Transport', 1], ['realty', 'Ko\'chmas mulk', 2], ['sim', 'SIM-kartalar', 3], ['proxy', 'Ishonchnomalar', 1]].map((c, i) => `<button class="pill ${i === 0 ? 'active' : ''}" data-f="${c[0]}">${c[1]} <span class="count">${c[2]}</span></button>`).join('')}</div>

      <section data-sec="custom">
        <div class="section-title">${ic('add_home_work')} Qo'shilgan aktivlar <button class="btn btn-soft btn-sm" style="margin-left:auto;text-transform:none;letter-spacing:0" data-add-asset>${ic('add', 'sm')} Aktiv qo'shish</button></div>
        <div class="grid-2" id="assetList">${assetListHTML()}</div>
      </section>

      <section data-sec="transport">
        <div class="section-title">${ic('directions_car')} Transport vositasi (YHXX) <span class="chip green" style="margin-left:auto">${ic('verified', 'sm')} Tasdiqlangan</span></div>
        <div class="card asset">
          <div class="asset-head" style="background:var(--surface-2)"><div class="grow"><div class="upper">Yengil avtomobil</div><div class="h2" style="font-size:22px">Chevrolet Malibu-2</div><div class="small muted">2022-yil • Qora metallik • 2.0 Turbo AT • VIN: XUUJA69F...5201</div><div class="plate" style="margin-top:10px"><span class="reg">01 <small style="font-size:8px">UZ</small></span><span class="num">777 AAB</span></div></div><div class="thumb car" style="width:140px;height:96px">${ic('directions_car', 'lg')}</div></div>
          <div class="asset-body" style="padding-top:16px">
            <div class="row between" style="background:var(--surface-2);border-radius:10px;padding:10px 12px"><span class="small row" style="gap:6px">${ic('description', 'sm')} Texnik pasport (Texpasport):</span><b class="mono">AAF 3849102</b></div>
            <div class="kv"><div><div class="k">Sug'urta (OSAGO)</div><div class="v small red">${ic('shield', 'sm')} Gross (25.04.2025) — 10 kun</div></div><div><div class="k">Texnik ko'rik</div><div class="v small green">${ic('check_circle', 'sm')} Amalda (10.04.2025)</div></div></div>
            <div class="notice green">${ic('verified_user')}<div class="grow"><div class="small bold">YPX jarimalari mavjud emas</div><p>Barcha qoidabuzarliklar holati toza (0 so'm)</p></div>${ic('arrow_forward')}</div>
            <div class="row wrap"><button class="btn btn-primary grow" data-toast="E-Texpasport QR-kodi ko'rsatildi">${ic('qr_code_2', 'sm')} E-Texpasport</button><button class="btn btn-soft grow" data-toast="Ishonchnoma rasmiylashtirish oynasi ochildi">${ic('share', 'sm')} Ishonchnoma</button><button class="btn btn-ghost" data-toast="Egalik tarixi yuklandi" aria-label="Tarix">${ic('history', 'sm')}</button></div>
          </div>
        </div>
      </section>

      <section data-sec="realty">
        <div class="section-title">${ic('home_work')} Ko'chmas mulk (Davlat kadastri) <span class="chip blue" style="margin-left:auto">2 ta bino</span></div>
        <div class="grid-2">
          ${realty('house', 'Kvartira (Ko\'p qavatli)', '100% Mulk', 'green', 'Chilonzor 19, 42-uy, 18-xonadon', 'Toshkent shahri, Chilonzor tumani', ['86.4 m²', '3 xona', '4-qavat'], '10:01:05:01:02:0342:0018', 'Mulk solig\'i: To\'langan (2024 yillik)', ['Kadastr pasporti', 'Taqiq yo\'qligi'])}
          ${realty('land', 'Yer uchastkasi / Turar-joy', 'Meros', 'amber', 'Chinor MFY, Bog\'iston ko\'chasi 14', 'Toshkent viloyati, Qibray tumani', ['6.0 sotix', 'Hovli-joy', 'Umrbod egalik'], '11:04:02:04:01:1105', 'Yer solig\'i: To\'langan (2024)', ['Chegaralar rejasi', 'E-Ko\'chirma'])}
        </div>
      </section>

      <section data-sec="sim">
        <div class="section-title">${ic('sim_card')} Aloqa & SIM-kartalar (O'zkomnazorat) <span class="chip" style="margin-left:auto">3 operator</span></div>
        <div class="card pad stack" style="gap:10px">
          <p class="small muted">Pasportingizga rasmiylashtirilgan mobil raqamlar ro'yxati. Notanish raqam bo'lsa darhol bloklash talabini yuborishingiz mumkin.</p>
          <div id="simList">${[['+998 (90) 123-45-67', 'Beeline Uzbekistan • Asosiy raqam', '#f2b705', 'B', true], ['+998 (93) 987-65-43', 'Ucell (COSCOM) • Faol', '#7b2cbf', 'U'], ['+998 (97) 555-11-22', 'Mobiuz (UMS) • Faol', '#e63946', 'M']].map((s, i) => `<div class="sim" style="margin-bottom:8px"><div class="op" style="background:${s[2]}">${s[3]}</div><div class="grow"><div class="bold mono">${s[0]}</div><div class="xs muted">${s[1]}</div></div>${s[4] ? `<span class="chip blue">OneID</span>${ic('check_circle', 'green')}` : `<button class="btn btn-danger btn-sm" data-block="${i}">Bloklash</button>`}</div>`).join('')}</div>
          <div class="notice">${ic('security')}<p>Noma'lum SIM-karta ochilishidan SMS-ogohlantirish yoqilgan.</p></div>
        </div>
      </section>

      <section data-sec="proxy">
        <div class="section-title">${ic('assignment_ind')} Ishonchnomalar & Notariat <span class="chip green" style="margin-left:auto">1 ta faol</span></div>
        <div class="card pad stack" style="gap:12px">
          <div class="row between"><div><div class="upper">Avtotransport boshqarish ishonchnomasi</div><div class="h3" style="font-size:17px">Malikova Dilorom Olimovna ga</div><div class="small muted">Chevrolet Malibu-2 (01 777 AAB) boshqarish huquqi</div></div>${ic('verified', 'green lg')}</div>
          <div class="kv"><div><div class="k">Notarius reestr raqami</div><div class="v mono">№ 18-N/4092</div></div><div><div class="k">Amal qilish muddati</div><div class="v green">15.11.2025 gacha</div></div></div>
          <div class="row"><button class="btn btn-soft grow" data-toast="Ishonchnoma PDF ochildi">${ic('visibility', 'sm')} Ko'rish (PDF)</button><button class="btn btn-danger grow" id="revoke">${ic('block', 'sm')} Bekor qilish</button></div>
        </div>
      </section>`;
  }
  // ---------- Foydalanuvchi qo'shgan aktivlar ----------
  const ASSET_TYPES = [['car', 'Avtomobil', 'directions_car'], ['house', 'Kvartira / Uy', 'apartment'], ['land', 'Yer uchastkasi', 'cottage']];
  const userAssets = () => local.get('assets', []);
  function assetListHTML() {
    const list = userAssets();
    if (!list.length) return `<div class="empty" style="grid-column:1/-1">${ic('inventory_2', 'lg')}<div style="margin-top:6px">Hali aktiv qo'shilmagan. «Aktiv qo'shish» tugmasini bosing.</div></div>`;
    return list.map(a => {
      const t = ASSET_TYPES.find(x => x[0] === a.type) || ASSET_TYPES[0];
      const isCar = a.type === 'car';
      return `<div class="card asset fade-in"><div class="asset-head"><div class="thumb ${a.type}" style="width:84px;height:70px">${ic(t[2], 'lg')}</div><div class="grow"><div class="row between"><span class="upper">${t[1]}</span><span class="chip amber">Qo'shilgan</span></div><div class="bold" style="font-size:16px">${esc(a.name)}</div><div class="small muted">${esc(a.details) || '—'}</div></div></div>
        <div class="asset-body"><div class="row between" style="background:var(--surface-2);border-radius:10px;padding:10px 12px">${isCar ? `<span class="plate"><span class="num" style="font-size:14px">${esc(a.no)}</span></span>` : `<span class="small muted">Kadastr raqami:</span><b class="mono small">${esc(a.no)}</b>`}${a.date ? `<span class="xs muted">${esc(a.date)}</span>` : ''}</div>
        <div class="row"><button class="btn btn-ghost btn-sm grow" data-edit-asset="${a.id}">${ic('edit', 'sm')} <span>Tahrirlash</span></button><button class="btn btn-danger btn-sm" data-del-asset="${a.id}" aria-label="O'chirish">${ic('delete', 'sm')}</button></div></div></div>`;
    }).join('');
  }
  function assetForm(asset) {
    openForm({
      title: asset ? 'Aktivni tahrirlash' : 'Yangi aktiv qo\'shish',
      values: asset || { type: 'car' },
      fields: [
        { name: 'type', label: 'Aktiv turi', type: 'select', options: ASSET_TYPES.map(t => [t[0], tr(t[1])]), full: true },
        { name: 'name', label: 'Nomi / modeli', required: true, full: true, icon: 'label', placeholder: 'Masalan: Chevrolet Cobalt yoki Yunusobod 4-kvartal' },
        { name: 'no', label: 'Davlat raqami yoki kadastr raqami', required: true, icon: 'tag', placeholder: '01 A 123 BC', max: 30 },
        { name: 'date', label: 'Ro\'yxatga olingan sana', type: 'date' },
        { name: 'details', label: 'Qo\'shimcha ma\'lumot', full: true, icon: 'notes', placeholder: tr('Manzil yoki rangi, yili') }
      ],
      onSave: (data) => {
        const list = userAssets();
        if (asset) Object.assign(list.find(a => a.id === asset.id) || {}, data);
        else list.unshift(Object.assign({ id: uid() }, data));
        local.set('assets', list);
        toast('Aktiv saqlandi');
        render();
        setTimeout(() => { const s = $('[data-sec="custom"]'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      },
      onDelete: asset ? () => deleteAsset(asset) : null
    });
  }
  function deleteAsset(a) {
    confirmDelete(a.name, () => { local.set('assets', userAssets().filter(x => x.id !== a.id)); toast("Aktiv o'chirildi", 'delete'); render(); });
  }

  function realty(kind, type, own, ownColor, title, place, tags, cad, tax, btns) {
    return `<div class="card asset"><div class="asset-head"><div class="thumb ${kind}" style="width:96px;height:80px">${ic(kind === 'house' ? 'apartment' : 'cottage', 'lg')}</div><div class="grow"><div class="row between"><span class="upper">${type}</span><span class="chip ${ownColor}">${own}</span></div><div class="bold" style="font-size:16px">${title}</div><div class="small muted">${place}</div><div class="row wrap" style="gap:6px;margin-top:6px">${tags.map((t, i) => `<span class="chip ${i === 0 ? 'blue' : ''}">${t}</span>`).join('')}</div></div></div>
      <div class="asset-body"><div class="row between" style="background:var(--surface-2);border-radius:10px;padding:10px 12px"><span class="small muted">Kadastr raqami:</span><b class="mono small">${cad}</b></div>
      <div class="notice green" style="padding:10px 12px">${ic('task_alt', 'sm')}<div class="small bold">${tax}</div></div>
      <div class="row"><button class="btn btn-ghost grow btn-sm" data-toast="${btns[0]} yuklandi">${ic('description', 'sm')} ${btns[0]}</button><button class="btn btn-ghost grow btn-sm" data-toast="${btns[1]} yuklandi">${ic('download', 'sm')} ${btns[1]}</button></div></div></div>`;
  }
  function mountAssets() {
    $$('[data-add-asset]').forEach(b => b.addEventListener('click', () => assetForm(null)));
    $$('[data-edit-asset]').forEach(b => b.addEventListener('click', () => assetForm(userAssets().find(a => a.id === b.dataset.editAsset))));
    $$('[data-del-asset]').forEach(b => b.addEventListener('click', () => deleteAsset(userAssets().find(a => a.id === b.dataset.delAsset))));
    $$('#assetPills .pill').forEach(p => p.addEventListener('click', () => {
      $$('#assetPills .pill').forEach(x => x.classList.remove('active')); p.classList.add('active');
      $$('[data-sec]').forEach(s => s.style.display = (p.dataset.f === 'all' || s.dataset.sec === p.dataset.f) ? '' : 'none');
    }));
    $$('[data-block]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('Ushbu raqamni bloklash talabini yuborasizmi?')) return;
      b.outerHTML = '<span class="chip red">Bloklash so\'rovi yuborildi</span>';
      toast('Operatorga bloklash so\'rovi yuborildi');
    }));
    $('#revoke').onclick = () => { if (confirm('Ishonchnomani bekor qilasizmi? Bu amal notariusga yuboriladi.')) { $('#revoke').outerHTML = '<span class="chip amber grow" style="justify-content:center;height:32px">Bekor qilish so\'rovi ko\'rib chiqilmoqda</span>'; toast('So\'rov notariusga yuborildi'); } };
  }

  // ---------- TRAVEL ----------
  function travelPage() {
    return `
      <section class="card pad row wrap between" style="gap:16px">
        <div><div class="row wrap" style="gap:8px"><span class="chip solid-green">DXX CHEGARA QO'SHINLARI & IIV INTEGRATSIYASI</span><span class="xs muted">• Reestr kodi: UZ-BOR-2025/8812</span></div><h1 class="h1" style="margin-top:8px">Xorijga Chiqish Pasporti va Chegara Kesib O'tish Tarixi</h1><p class="small muted" style="margin-top:6px">Xalqaro biometrik sayohat hujjati (ICAO Doc 9303 standarti), viza reestri va chegara harakatlari onlayn monitoringi.</p></div>
        <div class="stack" style="gap:8px"><button class="btn btn-soft" id="recheck">${ic('sync', 'sm')} Taqiqni Qayta Tekshirish</button><button class="btn btn-soft" data-toast="Konsullik ma'lumotnomasi PDF yuklandi">${ic('verified', 'sm')} Konsullik Ma'lumotnomasi</button><button class="btn btn-primary" data-toast="Elektron QR-tekshiruv kodi yaratildi">${ic('qr_code_scanner', 'sm')} Elektron QR-Tekshiruv</button></div>
      </section>
      <section class="grid-main">
        <div class="idcard burgundy">
          <div class="row between"><div class="row">${ic('shield', 'lg')}<div><div class="lbl">O'zbekiston Respublikasi • Republic of Uzbekistan</div><div class="val">XORIJGA CHIQISH PASPORTI / PASSPORT</div></div></div><span class="chip" style="background:rgba(255,255,255,.12);color:#fff">${ic('contactless', 'sm')} ICAO 9303</span></div>
          <div class="row" style="gap:20px;margin-top:20px;align-items:flex-start">
            <div style="text-align:center">${photo('ICAO BIO', '#1d2a44')}<div class="xs" style="margin-top:6px;opacity:.75">${ic('nfc', 'sm')} RFID-Chip Faol</div></div>
            <div class="grow idgrid">
              <div><div class="lbl">Familiyasi / Surname</div><div class="name">${USER.last}</div></div><div><div class="lbl">Ismi / Given names</div><div class="name">${USER.first}</div></div>
              <div><div class="lbl">Pasport № / Doc No</div><div class="val gold mono">${USER.passNo}</div></div><div><div class="lbl">Millati / Nationality</div><div class="val">UZBEKISTAN</div></div>
              <div><div class="lbl">Tug'ilgan sana</div><div class="val">${USER.birth}</div></div><div><div class="lbl">Jinsi / Sex</div><div class="val">ERKAK / M</div></div>
              <div><div class="lbl">Berilgan sana</div><div class="val">${USER.passIssued}</div></div><div><div class="lbl">Amal qilish muddati</div><div class="val gold">${USER.passExpiry}</div></div>
              <div style="grid-column:1/-1;background:rgba(0,0,0,.2);border-radius:8px;padding:8px 10px" class="row between"><span class="xs">Amal qilish muddati tugashiga:</span><b class="gold small" id="passLeft"></b></div>
            </div>
          </div>
          <div class="mrz">P&lt;UZBKARIMOV&lt;&lt;AZIZBEK&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>BA45892017UZB8405125M2908154312058402&lt;42</div>
        </div>
        <div class="stack" style="gap:20px">
          <div class="card pad stack" style="gap:12px"><div class="row between"><span class="upper">Sovereign clearance status</span><span class="chip green">${ic('check_circle', 'sm')} FAOL • TOZA</span></div>
            <div class="notice green" id="clearance">${ic('flight_takeoff', 'fill')}<div><div class="bold">Xorijga chiqishga taqiq (Zapret) yo'q</div><p>Majburiy ijro byurosi (MIB), IIV, DXX va Soliq qo'mitasi bo'yicha cheklovlar aniqlanmagan.</p></div></div>
            <div class="kv" style="grid-template-columns:1fr 1fr 1fr"><div><div class="k">MIB qarzlari</div><div class="v green small">0.00 UZS</div></div><div><div class="k">Soliq holati</div><div class="v green small">Toza</div></div><div><div class="k">IIV qidiruv</div><div class="v green small">Mavjud emas</div></div></div>
            <div class="row between xs muted"><span>Oxirgi avtomatlashtirilgan tekshiruv: <b id="lastCheck">Bugun, 10:42</b></span><span class="green bold">Real-vaqt</span></div></div>
          <div class="card pad"><div class="row between"><b class="h3">Tezkor Ma'lumot va QR Tizimi</b>${ic('info', 'faint')}</div><p class="small muted" style="margin-top:6px">Pasportingiz xalqaro aeroportlarda e-Gate (elektron chegara o'tish turniketlari) uchun to'liq moslashtirilgan. ICAO Public Key Directory (PKD) tizimida ro'yxatga olingan.</p>
            <div class="row between" style="margin-top:10px"><span class="small row" style="gap:6px">${ic('public', 'sm green')} ICAO PKD Global Trust: <b class="green">Muvaffaqiyatli</b></span><button class="btn btn-soft btn-sm" data-toast="Sertifikat: UZ-CSCA-2019-04">Sertifikatni ko'rish</button></div></div>
        </div>
      </section>
      <section class="stats">
        ${stat('Tashrif davlatlari', '4', 'ta', 'Fransiya, BAA, Germaniya, Turkiya', 'public')}
        ${stat('Chegara kesib o\'tishlar', '12', 'marta', '6 ta kirish / 6 ta chiqish', 'sync_alt')}
        ${stat('Oxirgi xalqaro safar', '18.01', '2025', 'BAA - Dubay (DXB)', 'flight_land')}
        ${stat('Schengen 90/180', '74', 'kun qoldi', '16 kun foydalanildi', 'hourglass_top')}
      </section>
      <section class="grid-main">
        <div class="card pad"><div class="row between" style="margin-bottom:14px"><b class="row h3" style="gap:8px">${ic('timeline', 'primary')} Chegaradan o'tish tarixi (Border Crossing Timeline)</b><span class="chip blue">DXX reestri</span></div>
          <div class="timeline">${[['in', 'Toshkent (TAS) — Kirish', '18.01.2025 • 06:42', 'Dubay (DXB) reysi HY-252 • Xalqaro aeroport'], ['out', 'Toshkent (TAS) — Chiqish', '11.01.2025 • 22:15', 'Reys HY-251 → Dubay (DXB), BAA'], ['in', 'Toshkent (TAS) — Kirish', '02.10.2024 • 14:30', 'Istanbul (IST) reysi TK-370'], ['out', 'Toshkent (TAS) — Chiqish', '24.09.2024 • 09:05', 'Reys TK-371 → Istanbul (IST), Turkiya'], ['in', 'G\'ishtko\'prik quruqlik posti — Kirish', '15.06.2024 • 18:20', 'Avtomobil: Chevrolet Malibu-2 (01 777 AAB)'], ['out', 'Toshkent (TAS) — Chiqish', '03.06.2024 • 07:10', 'Reys HY-201 → Parij (CDG), Fransiya']].map(t => `<div class="tl-item ${t[0]}"><div class="row between wrap"><b class="small">${t[0] === 'in' ? ic('flight_land', 'sm green') : ic('flight_takeoff', 'sm primary')} ${t[1]}</b><span class="xs muted mono">${t[2]}</span></div><div class="xs muted">${t[3]}</div></div>`).join('')}</div></div>
        <div class="stack" style="gap:20px">
          <div class="card pad"><b class="h3">Amaldagi xorijiy vizalar</b>
            ${[['🇫🇷', 'Fransiya (Schengen Area)', 'C-tipdagi ko\'p martalik', '12.09.2025', 'green'], ['🇦🇪', 'BAA elektron vizasi', 'Turistik, 30 kun', 'Foydalanilgan', '']].map(v => `<div class="set-row"><span style="font-size:24px">${v[0]}</span><div class="grow"><div class="small bold">${v[1]}</div><div class="xs muted">${v[2]}</div></div><span class="chip ${v[4]}">${v[3]}</span></div>`).join('')}</div>
          <div class="card pad"><b class="h3 row" style="gap:6px">${ic('support', 'primary')} Xorijda konsullik yordami</b><p class="small muted" style="margin-top:6px">Fuqaro chet elda bo'lganda tezkor bog'lanish uchun O'zbekiston TIV qaynoq liniyasi.</p><button class="btn btn-soft btn-block" style="margin-top:10px;height:42px" data-toast="Qaynoq liniya: +998 71 233-28-28">${ic('call', 'sm')} Konsullik qaynoq liniyasi</button></div>
        </div>
      </section>`;
  }
  function mountTravel() {
    const exp = new Date(2029, 7, 15), now = new Date();
    let months = (exp.getFullYear() - now.getFullYear()) * 12 + exp.getMonth() - now.getMonth();
    $('#passLeft').textContent = months > 0 ? `${Math.floor(months / 12)} yil ${months % 12} oy qoldi` : 'Muddati tugagan';
    $('#recheck').onclick = () => {
      const b = $('#recheck'); b.disabled = true; b.innerHTML = ic('progress_activity', 'sm') + ' Tekshirilmoqda...';
      setTimeout(() => { b.disabled = false; b.innerHTML = ic('sync', 'sm') + ' Taqiqni Qayta Tekshirish'; $('#lastCheck').textContent = 'Bugun, ' + nowTime().slice(0, 5); toast('MIB, IIV, DXX, Soliq: cheklovlar topilmadi'); }, 1400);
    };
  }

  // ---------- DEADLINES ----------
  function deadlinesPage() {
    return `
      <section class="hero">
        <div class="row wrap" style="gap:8px"><span class="chip">● DAVLAT REESTR AXBOROT TIZIMI</span><span class="xs" style="opacity:.8">• Real vaqt sinxronizatsiyasi</span></div>
        <div class="row between wrap" style="gap:16px;margin-top:10px;align-items:flex-start">
          <div><h1 class="h1">Muddati tugayotgan hujjatlar va eslatmalar nazorati</h1><p style="margin-top:8px">Davlat reyestridagi barcha shaxsiy, mulkiy va sayohat hujjatlaringizning qonuniy amal qilish muddati avtomatlashtirilgan yagona monitoringi.</p></div>
          <div class="hero-side row" style="gap:12px"><div class="icon-box" style="background:var(--green-bright);color:#053b22">${ic('notifications_active')}</div><div><div class="lbl" style="font-size:10px;opacity:.7">AVTO-ESLATMALAR</div><b>SMS & Push faol</b></div><div style="text-align:right;margin-left:12px"><div class="xs" style="opacity:.7">Intervallar:</div><b class="small">30, 15 va 3 kun oldin</b></div></div>
        </div>
        <div class="row between wrap" style="margin-top:18px;gap:12px"><div class="hero-tabs" id="dlTabs"><button class="active" data-f="all">Barchasi <span class="n">6</span></button><button data-f="urgent">Shoshilinch <span class="n" style="background:var(--red);color:#fff">1</span></button><button data-f="soon">Yaqinlashmoqda <span class="n">2</span></button><button data-f="safe">Xavfsiz <span class="n">3</span></button></div><span class="xs" style="opacity:.85">${ic('verified_user', 'sm')} Yagona OneID tizimi orqali himoyalangan</span></div>
      </section>

      <section data-dl="urgent">
        <div class="row between" style="margin-bottom:10px"><b class="row" style="gap:6px;font-size:14px"><span class="dot red" style="color:var(--red)"></span> SHOSHILINCH CHORA TALAB QILINADI</b><span class="chip red">! Jarima xavfi mavjud</span></div>
        <div class="card urgent row wrap" style="padding:16px;gap:16px">
          <div class="icon-box red" style="width:52px;height:52px">${ic('directions_car', 'lg')}</div>
          <div style="min-width:180px"><span class="chip red">AVTOMOBIL SUG'URTASI</span> <span class="xs muted">• Mulkiy</span><div class="bold" style="font-size:16px;margin-top:4px">Majburiy Avtosug'urta (OSAGO)</div><div class="row small muted">Chevrolet Malibu-2 <span class="plate" style="font-size:11px"><span class="num" style="font-size:11px;padding:1px 6px">01 777 AAB</span></span></div></div>
          <div class="kv grow" style="grid-template-columns:repeat(3,1fr);min-width:300px"><div><div class="k">Holat</div><div class="v red">${ic('timer', 'sm')} <span id="osagoLeft">10 KUN QOLDI</span></div><div class="xs muted">25.04.2025 gacha</div></div><div><div class="k">Sug'urtalovchi</div><div class="v small">Gross Sug'urta AJ</div><div class="xs green">${ic('verified', 'sm')} Litsenziya</div></div><div><div class="k">Polis seriyasi</div><div class="v small mono">POL-8849201-UZ</div><div class="xs muted">Elektron E-POLIS</div></div></div>
          <div class="stack" style="gap:8px"><button class="btn btn-primary" id="renew">${ic('autorenew', 'sm')} Onlayn uzaytirish (MyGov)</button><div class="row"><button class="btn btn-ghost btn-sm grow" data-toast="Polis PDF yuklandi">${ic('download', 'sm')} Polisni yuklash</button><button class="btn btn-ghost btn-sm grow" data-toast="Eslatma 3 kunga keyinga surildi">${ic('snooze', 'sm')} Keyinga</button></div></div>
        </div>
      </section>

      <section data-dl="soon">
        <div class="row between" style="margin-bottom:10px"><b class="row" style="gap:6px;font-size:14px"><span class="dot" style="color:var(--amber)"></span> Yaqinlashayotgan muddatlar (30–90 kun ichida)</b><span class="xs muted">Rejali yangilash tavsiya etiladi</span></div>
        <div class="grid-2">
          ${soon('directions_car', 'DIQQAT QILING', 'YHXX • Texnik nazorat', 'Texnik ko\'rik guvohnomasi (YHXX)', 'Chevrolet Malibu-2 (01 777 AAB)', '24 kun qoldi', '10.04.2025', 'Majburiy yillik diagnostik tekshiruv talab etiladi', 'Toshkent sh., Mirobod t.', ['Navbatga onlayn yozilish', 'YHXX markazlari xaritasi'])}
          ${soon('flight', 'YAQINLASHMOQDA', 'Xalqaro viza • Shaxsiy', 'Xorijiy Viza (Schengen Multivisa)', 'Fransiya Respublikasi elchixonasi', '75 kun qoldi', '12.09.2025', 'Schengen hududida qolish muddati chegarasi nazorati', '90 kunlik limit', ['Elchixonaga viza arizasi', 'Muddatni tekshirish'])}
        </div>
      </section>

      <section data-dl="safe" class="card pad">
        <div class="row between wrap" style="margin-bottom:8px"><b class="row" style="gap:6px;font-size:14px"><span class="dot" style="color:var(--green)"></span> Muddati uzoq va xavfsiz hujjatlar</b><span class="xs green">${ic('verified', 'sm')} Barcha davlat standartlariga to'liq javob beradi</span></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Hujjat nomi va toifasi</th><th>Seriya / raqam</th><th>Berilgan sana</th><th>Amal qilish muddati</th><th>Qolgan davr</th><th>Holat</th><th></th></tr></thead><tbody>
          ${[['badge', 'Fuqaro ID-kartasi', 'Shaxsiy', USER.idNo, USER.idIssued, USER.idExpiry, '6 yil 9 oy'], ['flight', 'Xorijga chiqish pasporti', 'Sayohat', USER.passNo, USER.passIssued, USER.passExpiry, '4 yil 9 oy'], ['directions_car', 'Haydovchilik guvohnomasi', 'Transport', 'AF 1234567', '10.06.2018', '10.06.2028', '3 yil 1 oy']].map(r => `<tr><td><div class="row">${ic(r[0], 'primary')}<div><b>${r[1]}</b><div class="xs muted">${r[2]}</div></div></div></td><td class="mono">${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="green bold">${r[6]}</td><td><span class="chip green">Xavfsiz</span></td><td><button class="btn btn-ghost btn-sm" data-toast="${r[1]} ochildi">${ic('visibility', 'sm')}</button></td></tr>`).join('')}
        </tbody></table></div>
      </section>`;
  }
  function soon(icon, tag, cat, title, sub, left, date, note, place, btns) {
    return `<div class="card deadline"><div class="row" style="align-items:flex-start"><div class="icon-box">${ic(icon)}</div><div class="grow"><div><span class="chip amber">${tag}</span> <span class="xs muted">${cat}</span></div><div class="bold" style="font-size:15px;margin-top:4px">${title}</div><div class="xs muted">${sub}</div></div><div style="text-align:right"><b class="small" style="color:var(--amber)">${left}</b><div class="xs muted">${date}<br>gacha</div></div></div>
      <div class="row between" style="background:var(--surface-2);border-radius:10px;padding:10px 12px"><span class="xs muted row" style="gap:6px">${ic('info', 'sm')} ${note}</span><b class="xs primary">${place}</b></div>
      <div class="row"><button class="btn btn-primary btn-sm grow" data-toast="${btns[0]}: ariza yuborildi">${btns[0]}</button><button class="btn btn-ghost btn-sm grow" data-toast="${btns[1]} ochildi">${btns[1]}</button></div></div>`;
  }
  function mountDeadlines() {
    $$('#dlTabs button').forEach(b => b.addEventListener('click', () => {
      $$('#dlTabs button').forEach(x => x.classList.remove('active')); b.classList.add('active');
      $$('[data-dl]').forEach(s => s.style.display = (b.dataset.f === 'all' || s.dataset.dl === b.dataset.f) ? '' : 'none');
    }));
    $('#renew').onclick = () => {
      const b = $('#renew'); b.disabled = true; b.innerHTML = ic('progress_activity', 'sm') + ' To\'lov tayyorlanmoqda...';
      setTimeout(() => { b.outerHTML = `<span class="chip green" style="height:40px;justify-content:center">${ic('check_circle', 'sm')} Uzaytirildi: 25.04.2026 gacha</span>`; $('#osagoLeft').textContent = '1 YIL'; $('#osagoLeft').parentElement.classList.replace('red', 'green'); toast('OSAGO polisi 1 yilga uzaytirildi'); }, 1500);
    };
  }

  // ---------- SETTINGS ----------
  function settingsPage() {
    const toggles = [['twofa', 'Ikki bosqichli autentifikatsiya (2FA)', 'Har bir kirishda PIN-kod yoki SMS kod talab qilinadi', true], ['bio', 'Face-ID / Biometrik kirish', 'OneID Mobile ilovasi orqali tasdiqlash', true], ['sms', 'SMS eslatmalar', 'Hujjat muddatlari bo\'yicha 30, 15 va 3 kun oldin', true], ['push', 'Push bildirishnomalar', 'Yangi kirish va xavfsizlik hodisalari haqida', true], ['email', 'Elektron pochta xabarnomalari', USER.email, false]];
    return `
      <section class="row between wrap" style="gap:16px"><div><div class="upper" style="color:var(--primary)">Shaxsiy kabinet</div><h1 class="h1">Xavfsizlik & Sozlamalar</h1></div><button class="btn btn-danger" data-logout>${ic('logout', 'sm')} Tizimdan chiqish</button></section>
      <section class="grid-main">
        <div class="stack" style="gap:20px">
          <div class="card pad row wrap" style="gap:16px"><div class="avatar" style="width:64px;height:64px;font-size:22px">${USER.initials}</div><div class="grow"><div class="h2">${USER.full}</div><div class="small muted mono">JShShIR: ${USER.pinfl}</div><div class="row wrap" style="margin-top:6px;gap:6px"><span class="chip green">${ic('verified', 'sm')} Daraja 3 • To'liq</span><span class="chip blue">${USER.phone}</span><span class="chip">${USER.email}</span></div></div><button class="btn btn-soft" data-toast="Ma'lumotlarni o'zgartirish uchun Davlat xizmatlari markaziga murojaat qiling">${ic('edit', 'sm')} Tahrirlash</button></div>
          <div class="card pad"><b class="h3">Xavfsizlik sozlamalari</b>${toggles.map(t => `<div class="set-row"><div class="grow"><div class="small bold">${t[1]}</div><div class="xs muted">${t[2]}</div></div><label class="switch"><input type="checkbox" data-set="${t[0]}" ${store.get('set_' + t[0], t[3]) ? 'checked' : ''}><span></span></label></div>`).join('')}</div>
          <div class="card pad"><div class="row between" style="margin-bottom:6px"><b class="h3">Faol sessiyalar</b><button class="btn btn-ghost btn-sm" id="killAll">Boshqalarini tugatish</button></div>
            <div id="sessions">${[['desktop_windows', 'Chrome 122 • Windows 11', 'Toshkent, UZ • 84.54.82.*** ', 'Joriy sessiya', true], ['phone_iphone', 'OneID Mobile • iPhone 15', 'Toshkent, UZ • 2 soat oldin'], ['laptop_mac', 'Safari • macOS', 'Samarqand, UZ • 3 kun oldin']].map(s => `<div class="set-row">${ic(s[0], 'primary')}<div class="grow"><div class="small bold">${s[1]}</div><div class="xs muted">${s[2]}</div></div>${s[4] ? `<span class="chip green">${s[3]}</span>` : `<button class="btn btn-ghost btn-sm" data-kill>Tugatish</button>`}</div>`).join('')}</div></div>
        </div>
        <div class="stack" style="gap:20px">
          <div class="card pad"><b class="h3">Xavfsizlik darajasi</b><div class="row" style="margin-top:12px"><div class="success-mark" style="width:60px;height:60px">${ic('shield', 'fill')}</div><div><div class="h2 green">Yuqori</div><div class="xs muted">5 ta tavsiyadan 4 tasi bajarilgan</div></div></div><div class="progress" style="margin-top:12px"><div style="width:80%"></div></div></div>
          <div class="card pad"><b class="h3">PIN-kodni o'zgartirish</b><div class="field" style="margin-top:12px"><div class="input">${ic('dialpad')}<input id="newPin" type="password" inputmode="numeric" maxlength="5" placeholder="Yangi 5 xonali PIN"></div></div><button class="btn btn-primary btn-block" style="margin-top:10px;height:42px" id="savePin">Saqlash</button></div>
          <div class="card pad"><b class="h3">Interfeys tili</b><div class="tabs" style="margin-top:12px">${[['uz', 'O\'zbekcha'], ['ru', 'Русский'], ['en', 'English']].map(l => `<button class="tab ${state.lang === l[0] ? 'active' : ''}" data-l="${l[0]}">${l[1]}</button>`).join('')}</div></div>
          <div class="card pad"><b class="h3">Mavzu</b><div class="tabs" style="margin-top:12px">${[['light', 'light_mode', 'Kunduzgi'], ['dark', 'dark_mode', 'Tungi'], ['system', 'contrast', 'Tizim']].map(m => `<button class="tab ${themeMode() === m[0] ? 'active' : ''}" data-mode="${m[0]}">${ic(m[1], 'sm')}<span>${m[2]}</span></button>`).join('')}</div></div>
        </div>
      </section>`;
  }
  function mountSettings() {
    $$('[data-set]').forEach(c => c.addEventListener('change', () => { store.set('set_' + c.dataset.set, c.checked); toast(c.checked ? 'Yoqildi' : 'O\'chirildi', c.checked ? 'toggle_on' : 'toggle_off'); }));
    $$('[data-kill]').forEach(b => b.addEventListener('click', () => { b.closest('.set-row').remove(); toast('Sessiya tugatildi'); }));
    $('#killAll').onclick = () => { $$('[data-kill]').forEach(b => b.closest('.set-row').remove()); toast('Boshqa barcha sessiyalar tugatildi'); };
    $('#savePin').onclick = () => { const v = $('#newPin').value; if (!/^\d{5}$/.test(v)) return toast('PIN 5 ta raqamdan iborat bo\'lishi kerak', 'error'); $('#newPin').value = ''; toast('PIN-kod yangilandi'); };
    $$('[data-l]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.l)));
    $$('[data-mode]').forEach(b => b.addEventListener('click', () => { $$('[data-mode]').forEach(x => x.classList.toggle('active', x === b)); setTheme(b.dataset.mode); }));
  }

  // ---------- Router ----------
  const ROUTES = {
    login: { auth: true, view: loginPage, mount: mountLogin },
    pin: { auth: true, view: pinPage, mount: mountPin },
    success: { auth: true, view: successPage, mount: mountSuccess },
    dashboard: { view: dashboardPage, mount: mountDashboard, title: 'Boshqaruv & Pasport' },
    documents: { view: documentsPage, mount: mountDocuments, title: 'Hujjatlar portfeli' },
    assets: { view: assetsPage, mount: mountAssets, title: 'Mulk va Transport' },
    travel: { view: travelPage, mount: mountTravel, title: 'Sayohat & Chegara' },
    deadlines: { view: deadlinesPage, mount: mountDeadlines, title: 'Muddatlar & Eslatmalar' },
    settings: { view: settingsPage, mount: mountSettings, title: 'Xavfsizlik & Sozlamalar' }
  };

  function render() {
    clearTimers();
    if (state.cleanup) { state.cleanup(); state.cleanup = null; }
    let route = location.hash.replace(/^#\/?/, '') || (state.authed ? 'dashboard' : 'login');
    if (!ROUTES[route]) route = state.authed ? 'dashboard' : 'login';
    const r = ROUTES[route];
    if (!r.auth && !state.authed) { go('login'); return; }
    if (route === 'login' && state.authed) { go('dashboard'); return; }
    app.innerHTML = r.auth ? r.view() : appShell(route, r.view());
    document.title = (r.title ? tr(r.title) + ' — ' : '') + 'OneID Davlat Raqamli Portali';
    window.scrollTo(0, 0);
    bindCommon();
    r.mount && r.mount();
    translate(app);
  }

  // Sahifadagi matnlarni tanlangan tilga o'girish
  function translate(root) { if (window.I18N && state.lang !== 'uz') window.I18N.apply(root, state.lang); }

  function logout() {
    state.authed = false; state.stage = 'none';
    store.set('authed', false); store.set('stage', 'none');
    toast('Tizimdan xavfsiz chiqildi', 'logout');
    go('login');
  }

  function bindCommon() {
    $$('[data-toast]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); toast(el.dataset.toast); }));
    $$('[data-copy]').forEach(el => el.addEventListener('click', () => {
      const v = el.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast('Nusxalandi: ' + v), () => toast('Nusxalandi: ' + v));
    }));
    $$('[data-logout]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); logout(); }));
    $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark')));
    const bell = $('#bell');
    if (bell) {
      bell.addEventListener('click', e => { e.stopPropagation(); $('#notif').classList.toggle('open'); });
      document.onclick = (e) => { const n = $('#notif'); if (n && !n.contains(e.target)) n.classList.remove('open'); };
    }
    const s = $('#gSearch');
    if (s) s.addEventListener('keydown', e => { if (e.key === 'Enter' && s.value.trim()) { state.globalQuery = s.value.trim(); if (location.hash === '#/documents') render(); else go('documents'); } });
  }

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { const s = $('#gSearch'); if (s) { e.preventDefault(); s.focus(); } }
  });
  window.addEventListener('hashchange', render);
  document.documentElement.lang = state.lang;
  translate(document.querySelector('.demo-banner') || document.body);
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSys = () => { if (themeMode() === 'system') setTheme('system'); };
    mq.addEventListener ? mq.addEventListener('change', onSys) : mq.addListener(onSys);
  }
  render();
})();
