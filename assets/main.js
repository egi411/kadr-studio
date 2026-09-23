// Speed Websites — main.js. Константы клиента — единственный источник правды; пустая строка = данных нет.
const CONTACTS = { phone: "", whatsapp: "", telegram: "", email: "", address: "", hours: "" };
const SOCIALS  = { vk: "", telegram: "", youtube: "", dzen: "", yandex: "", twogis: "", avito: "" };
const LEGAL    = { entity: "", inn: "", ogrn: "", legalAddress: "", email: "" };
// Заявка уходит POST JSON на endpoint (Web3Forms: https://api.web3forms.com/submit + accessKey, Formspree, свой).
// Пустой endpoint — почта/WhatsApp из CONTACTS, иначе «не подключена».
const FORM     = { endpoint: "", accessKey: "" };

// Единственная точка врезки счётчиков — только после «Принимаю».
function initAnalytics() {
  // Код Яндекс Метрики — сюда. Пока пусто.
}

(function () {
'use strict';
var d = document, root = d.documentElement, w = window;
var each = function (sel, fn, ctx) { [].forEach.call((ctx || d).querySelectorAll(sel), fn); };
var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
var reduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
var canHover = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
var hasIO = 'IntersectionObserver' in w;
var SOCIAL_LABELS = { vk: 'ВКонтакте', telegram: 'Telegram', youtube: 'YouTube', dzen: 'Дзен', yandex: 'Яндекс Карты', twogis: '2ГИС', avito: 'Авито' };

// 0. Контакты
var tel = String(CONTACTS.phone || '').replace(/[^\d+]/g, '');
var wa = String(CONTACTS.whatsapp || '').replace(/\D/g, '');
var tg = String(CONTACTS.telegram || '').replace(/^@|^https?:\/\/t\.me\//, '');
var mail = String(CONTACTS.email || '').trim();
var href = {
  phone: tel && 'tel:' + tel,
  whatsapp: wa && 'https://wa.me/' + wa,
  telegram: tg && 'https://t.me/' + tg,
  email: mail && 'mailto:' + mail
};
var primary = href.telegram || href.whatsapp || href.phone || href.email || '';

each('[data-link]', function (a) {
  var h = href[a.getAttribute('data-link')];
  if (h) { a.href = h; a.hidden = false; if (/^https?:/.test(h)) { a.target = '_blank'; a.rel = 'noopener'; } var row = a.closest('[data-contact-row]'); if (row) row.hidden = false; }
});
each('[data-contact]', function (el) {
  var v = CONTACTS[el.getAttribute('data-contact')];
  if (v) { el.textContent = v; el.hidden = false; var row = el.closest('[data-contact-row]'); if (row) row.hidden = false; }
});

// 0.1 Соцсети
var sameAs = [];
var socialsList = d.querySelector('[data-socials]');
Object.keys(SOCIALS).forEach(function (k) {
  var url = String(SOCIALS[k] || '').trim();
  if (!url) return;
  sameAs.push(url);
  if (socialsList) {
    var li = d.createElement('li'), a = d.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = SOCIAL_LABELS[k] || k;
    li.appendChild(a); socialsList.appendChild(li);
  }
});
if (socialsList && sameAs.length) socialsList.hidden = false;

// 0.2 Разметка
if (tel || mail || sameAs.length) {
  each('script[type="application/ld+json"]', function (ld) {
    try {
      var node = JSON.parse(ld.textContent);
      if (!node['@id'] || !/#organization$/.test(node['@id'])) return;
      if (tel) node.telephone = CONTACTS.phone;
      if (mail) node.email = mail;
      if (sameAs.length) node.sameAs = sameAs;
      ld.textContent = JSON.stringify(node);
    } catch (e) { /* как есть */ }
  });
}

// 0.3 Реквизиты оператора
var legalTable = d.querySelector('[data-legal-table]');
if (legalTable) {
  var filled = 0;
  each('[data-legal]', function (el) {
    var v = String(LEGAL[el.getAttribute('data-legal')] || '').trim();
    var row = el.closest('tr');
    if (v) { el.textContent = v; if (row) row.hidden = false; filled++; }
    else if (row) { row.hidden = true; }
  });
  var emptyRow = d.querySelector('[data-legal-empty]');
  if (emptyRow) emptyRow.hidden = filled > 0;
}

// 1. Прелоадер
var perf = w.performance;
var now = function () { return perf && perf.now ? perf.now() : 0; };
var sec = function (ms) { return (ms / 1000).toFixed(2).replace('.', ','); };
var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var ready = function () { root.classList.add('is-ready'); };
var waits = [];
if (d.fonts && d.fonts.ready) waits.push(d.fonts.ready);
var heroImg = d.getElementById('heroImg');
if (heroImg && heroImg.decode) waits.push(heroImg.decode().catch(function () {}));
var loaded = Promise.all(waits).then(function () {
  var ms = now();
  each('[data-loadtime]', function (el) { el.textContent = sec(ms); });
  return ms;
});

var loader = d.getElementById('loader');
if (!loader || reduced || navigator.webdriver) {
  if (loader) loader.remove();
  requestAnimationFrame(function () { requestAnimationFrame(ready); });
} else {
  var num = loader.querySelector('.loader__num'), bar = loader.querySelector('.loader__bar'), state = loader.querySelector('.loader__state'), pct = loader.querySelector('[data-pct]');
  var raf, stopped = false;
  (function tick() {
    if (stopped) return;
    var t = now();
    var k = Math.min(.92, t / 1600);
    num.textContent = sec(t); bar.style.transform = 'scaleX(' + k + ')'; pct.textContent = Math.round(k * 100) + '%';
    raf = requestAnimationFrame(tick);
  })();
  var gate = Promise.race([loaded, wait(2600).then(now)]);
  gate.then(function (ms) {
    stopped = true; cancelAnimationFrame(raf);
    num.textContent = sec(ms);
    bar.style.transform = 'scaleX(1)'; pct.textContent = '100%';
    state.textContent = 'Сайт загрузился';
    loader.classList.add('is-done');
  });
  Promise.all([gate, wait(700)]).then(function () { return wait(480); }).then(function () {
    if (root.classList.contains('is-ready')) { loader.remove(); return; }
    loader.classList.add('is-out');
    setTimeout(ready, 260);
    setTimeout(function () { loader.remove(); }, 1500);
  });
}

// 2. Шапка
var hdr = d.getElementById('hdr');
if (hdr && hasIO && !hdr.classList.contains('hdr--slim')) {
  var sentinel = d.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:120px;pointer-events:none;';
  d.body.prepend(sentinel);
  new IntersectionObserver(function (e) { hdr.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(sentinel);
}

// 3. Мобильное меню
var menuList = d.querySelector('[data-menu]'), navList = d.querySelector('.nav__list');
if (menuList && navList) menuList.innerHTML = navList.innerHTML;
var burger = d.getElementById('burger'), menu = d.getElementById('menu');
function setMenu(open) {
  if (!burger || !menu) return;
  burger.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
  root.classList.toggle('menu-open', open);
  if (open) menu.querySelector('a').focus();
}
if (burger && menu) {
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  each('#menu a', function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
}

// 4. Активный пункт навигации
var links = {};
each('.nav__list a[href^="#"]', function (a) { links[a.getAttribute('href').slice(1)] = a; });
if (hasIO && Object.keys(links).length) {
  var secObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var a = links[en.target.id]; if (!a) return;
      if (en.isIntersecting) { for (var k in links) links[k].classList.remove('is-active'); a.classList.add('is-active'); }
      else a.classList.remove('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(links).forEach(function (id) { var s = d.getElementById(id); if (s) secObs.observe(s); });
}

// 5. Разбивка заголовков
each('.split', function (el) {
  var words = el.textContent.trim().split(' ');
  el.textContent = '';
  words.forEach(function (word, i) {
    var outer = d.createElement('span'), inner = d.createElement('span');
    outer.className = 'word'; inner.textContent = word; inner.style.setProperty('--i', i);
    outer.appendChild(inner); el.appendChild(outer);
    if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
  });
});
each('.footer__mark', function (el) {
  var text = el.textContent; el.textContent = '';
  text.split('').forEach(function (ch, i) {
    if (ch === ' ') { el.appendChild(d.createTextNode(' ')); return; }
    var s = d.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.setProperty('--i', i); el.appendChild(s);
  });
});

// 6. Появление при прокрутке
var reveals = d.querySelectorAll('.reveal, .split, .footer__mark, .gauges');
if (hasIO && !reduced) {
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.classList.contains('gauges')) runGauges(en.target);
      revObs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  [].forEach.call(reveals, function (el) { revObs.observe(el); });
} else {
  [].forEach.call(reveals, function (el) { el.classList.add('is-in'); if (el.classList.contains('gauges')) runGauges(el); });
}

// 7. Датчики PageSpeed
function runGauges(box) {
  each('.gauge', function (g, i) {
    var to = +g.getAttribute('data-value') || 0, out = g.querySelector('[data-count]');
    setTimeout(function () {
      g.style.setProperty('--v', to);
      if (reduced || !out) { if (out) out.textContent = to; return; }
      var t0 = now();
      (function step() {
        var k = clamp((now() - t0) / 1800, 0, 1), e = 1 - Math.pow(1 - k, 4);
        out.textContent = Math.round(to * e);
        if (k < 1) requestAnimationFrame(step);
      })();
    }, i * 120);
  }, box);
}

// 8. Мини-сцены услуг играют только на экране
var arts = d.querySelectorAll('.art');
if (hasIO && !reduced) {
  var artObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle('is-live', en.isIntersecting); });
  }, { threshold: 0.25 });
  [].forEach.call(arts, function (a) { artObs.observe(a); });
}

// 9. Бегущая строка
var track = d.querySelector('.ticker__track');
if (track && !reduced) {
  var group = track.children[0], gw = 0, x = 0, lastY = w.scrollY, vel = 0, dir = 1, skew = 0, tickerOn = false;
  var measure = function () {
    gw = group.getBoundingClientRect().width;
    while (gw && track.children.length < Math.ceil(w.innerWidth / gw) + 1) track.appendChild(group.cloneNode(true));
  };
  measure(); w.addEventListener('resize', measure);
  var loop = function () {
    var y = w.scrollY, dy = y - lastY; lastY = y;
    if (dy) dir = dy > 0 ? 1 : -1;
    vel += (dy - vel) * 0.14;
    x -= (0.7 + Math.min(Math.abs(vel) * 0.4, 22)) * dir;
    if (gw) { while (x <= -gw) x += gw; while (x > 0) x -= gw; }
    skew += (clamp(-vel * 0.3, -12, 12) - skew) * 0.12;
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
    if (tickerOn) requestAnimationFrame(loop);
  };
  if (hasIO) new IntersectionObserver(function (e) {
    var was = tickerOn; tickerOn = e[0].isIntersecting;
    if (tickerOn && !was) { lastY = w.scrollY; requestAnimationFrame(loop); }
  }).observe(track.parentNode);
}

// 10. «Как работаем»
var proc = d.getElementById('process');
if (proc) {
  var dayList = proc.querySelector('.days'), dayItems = proc.querySelectorAll('.day');
  var timerEl = proc.querySelector('[data-timer]'), capEl = proc.querySelector('[data-timer-cap]');
  var bars = proc.querySelectorAll('.progress i');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var procTick = false;
  var updateProc = function () {
    procTick = false;
    var r = dayList.getBoundingClientRect(), vh = w.innerHeight;
    var p = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
    var left = Math.round(72 * 3600 * (1 - p));
    timerEl.textContent = pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left % 3600 / 60)) + ':' + pad(left % 60);
    [].forEach.call(dayItems, function (el, i) {
      var a = p * 3 - i;
      el.classList.toggle('is-active', a > 0 && a < 1);
      el.classList.toggle('is-done', a >= 1);
    });
    [].forEach.call(bars, function (b, i) { b.style.setProperty('--f', clamp(p * 3 - i, 0, 1).toFixed(3)); });
    var launched = p >= 1;
    if (proc.classList.contains('is-launched') !== launched) {
      proc.classList.toggle('is-launched', launched);
      capEl.textContent = launched ? 'сайт запущен' : 'до запуска лендинга';
    }
  };
  var onScroll = function () { if (!procTick) { procTick = true; requestAnimationFrame(updateProc); } };
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', onScroll);
  updateProc();
}

// 11. Кейсы
each('.browser', function (b) {
  var img = b.querySelector('img'), view = b.querySelector('.browser__view');
  var prep = function () {
    var shift = Math.max(0, img.getBoundingClientRect().height - view.getBoundingClientRect().height);
    b.style.setProperty('--shift', shift.toFixed(0));
    b.style.setProperty('--t', Math.max(3, shift / 340).toFixed(1) + 's');
  };
  var on = function () { prep(); b.classList.add('is-scrolling'); };
  var off = function () { b.classList.remove('is-scrolling'); };
  if (canHover) {
    b.addEventListener('mouseenter', on); b.addEventListener('mouseleave', off);
    b.addEventListener('focus', on); b.addEventListener('blur', off);
  } else if (hasIO && !reduced) {
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) on(); else off(); }, { threshold: 0.7 }).observe(b);
  }
});

// 12. Курсор-подпись над кейсами
var cur = d.querySelector('.cursor');
if (cur && canHover && !reduced) {
  var label = cur.querySelector('span'), cx = 0, cy = 0, tx = 0, ty = 0, curOn = false, curRaf = 0;
  var follow = function () {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    curRaf = (curOn || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(follow) : 0;
  };
  d.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
  each('[data-cursor]', function (el) {
    el.addEventListener('mouseenter', function (e) {
      label.textContent = el.getAttribute('data-cursor');
      if (!curOn) { cx = tx = e.clientX; cy = ty = e.clientY; }
      curOn = true; cur.classList.add('is-on');
      if (!curRaf) curRaf = requestAnimationFrame(follow);
    });
    el.addEventListener('mouseleave', function () { curOn = false; cur.classList.remove('is-on'); });
  });
}

// 13. Форма заявки
var form = d.getElementById('lead-form');
if (form) {
  var statusEl = form.querySelector('.form__status');
  var doneEl = form.querySelector('.form__done');
  var submitText = form.querySelector('[data-submit-text]');
  var setStatus = function (msg, st) { statusEl.textContent = msg || ''; if (st) statusEl.setAttribute('data-state', st); else statusEl.removeAttribute('data-state'); };
  var isContact = function (v) {
    return v.replace(/\D/g, '').length >= 10 || /^@?[A-Za-z0-9_]{5,32}$/.test(v) || /t\.me\/\w+/.test(v) || /^\S+@\S+\.\S+$/.test(v);
  };
  var mark = function (input, bad) { var box = input.closest('.field') || input.closest('.check'); if (box) box.classList.toggle('is-invalid', bad); };
  var validate = function () {
    var first = null;
    var nm = form.elements.name, ct = form.elements.contact, cs = form.elements.consent;
    var badName = nm.value.trim().length < 2, badContact = !isContact(ct.value.trim()), badConsent = !cs.checked;
    mark(nm, badName); mark(ct, badContact); mark(cs, badConsent);
    if (badName) first = nm; else if (badContact) first = ct; else if (badConsent) first = cs;
    if (badConsent && !badName && !badContact) setStatus('Отметьте согласие на обработку данных', 'error');
    if (first) first.focus();
    return !first;
  };
  each('input, textarea', function (el) {
    el.addEventListener('input', function () { mark(el, false); if (statusEl.getAttribute('data-state') === 'error') setStatus(''); });
    el.addEventListener('change', function () { mark(el, false); });
  }, form);
  var finish = function () {
    form.classList.remove('is-sending');
    form.classList.add('is-sent');
    doneEl.hidden = false;
    form.reset();
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');
    if (!validate()) return;
    if (form.elements.company.value) { finish(); return; } // ловушка для ботов
    var checked = form.querySelector('input[name="type"]:checked');
    var data = {
      subject: 'Заявка с сайта Speed Websites',
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      type: checked ? checked.value : '',
      message: form.elements.message.value.trim(),
      page: location.href
    };
    if (!FORM.endpoint) {
      var text = data.subject + '\nЧто нужно: ' + data.type + '\nИмя: ' + data.name + '\nКонтакт: ' + data.contact + (data.message ? '\nЗадача: ' + data.message : '');
      if (mail) { location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(text); finish(); return; }
      if (wa) { w.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener'); finish(); return; }
      setStatus('Форма пока не подключена к почте — заявка не отправлена.', 'error');
      return;
    }
    if (FORM.accessKey) data.access_key = FORM.accessKey;
    form.classList.add('is-sending');
    submitText.textContent = 'Отправляем…';
    fetch(FORM.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); finish(); })
      .catch(function () {
        form.classList.remove('is-sending');
        setStatus('Не получилось отправить. Попробуйте ещё раз' + (primary ? ' или напишите нам напрямую.' : '.'), 'error');
      })
      .then(function () { submitText.textContent = 'Отправить заявку'; });
  });
}

// 14. Cookie-согласие
var CK_KEY = 'sw:cookie-consent';              // {choice:'all'|'necessary', at: Date.now(), v:1}
var CK_TTL = 365 * 24 * 60 * 60 * 1000;        // 12 месяцев
var box = d.getElementById('cookie');
function readChoice() {
  try {
    var raw = JSON.parse(localStorage.getItem(CK_KEY) || 'null');
    if (raw && raw.choice && raw.at && Date.now() - raw.at < CK_TTL) return raw.choice;
  } catch (e) { /* нет доступа */ }
  return null;
}
function applyChoice(choice) {
  w.SiteConsent = choice;
  root.setAttribute('data-consent', choice);
  d.dispatchEvent(new CustomEvent('site:consent', { detail: choice }));
      if (choice === 'all') initAnalytics();
}
function openBox() { if (box) { box.hidden = false; box.classList.add('is-open'); } }
function closeBox() { if (box) { box.classList.remove('is-open'); box.hidden = true; } }
var saved = readChoice();
if (saved) applyChoice(saved);
else if (box) setTimeout(openBox, 1600);
each('#cookie [data-consent]', function (b) {
  b.addEventListener('click', function () {
    var choice = b.getAttribute('data-consent');
    try { localStorage.setItem(CK_KEY, JSON.stringify({ choice: choice, at: Date.now(), v: 1 })); } catch (e) { /* приватный режим */ }
    closeBox(); applyChoice(choice);
  });
});
each('[data-cookie-settings]', function (b) {
  b.addEventListener('click', function () { openBox(); var first = box && box.querySelector('button'); if (first) first.focus(); });
});
})();
