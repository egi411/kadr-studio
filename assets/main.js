// ============================================================================
// Кадр — main.js. Три константы клиента ниже — единственный источник правды.
// Пустая строка = данных нет: CTA ведут на #contacts, ссылки скрыты, в разметку ничего не дописывается.
// ============================================================================
const CONTACTS = { phone: "", whatsapp: "", telegram: "", email: "", address: "", hours: "" };
const SOCIALS  = { vk: "", telegram: "", youtube: "", dzen: "", yandex: "", twogis: "", avito: "" };
const LEGAL    = { entity: "", inn: "", ogrn: "", legalAddress: "", email: "" };

// Единственная точка врезки счётчиков. Вызывается только после «Принимаю» в cookie-уведомлении.
function initAnalytics() {
  // Сюда вставляется код Яндекс Метрики / другого счётчика. Пока пусто.
}

(function () {
  'use strict';
  var d = document;
  var each = function (sel, fn) { Array.prototype.forEach.call(d.querySelectorAll(sel), fn); };
  var SOCIAL_LABELS = { vk: 'ВКонтакте', telegram: 'Telegram', youtube: 'YouTube', dzen: 'Дзен', yandex: 'Яндекс Карты', twogis: '2ГИС', avito: 'Авито' };

  // ——— 0. Контакты ———
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

  each('[data-cta]', function (a) {
    var key = a.getAttribute('data-cta');
    var h = key === 'primary' ? primary : href[key];
    if (h) { a.href = h; if (/^https?:/.test(h)) { a.target = '_blank'; a.rel = 'noopener'; } }
  });
  each('[data-link]', function (a) {
    var h = href[a.getAttribute('data-link')];
    if (h) { a.href = h; a.hidden = false; var row = a.closest('[data-contact-row]'); if (row) row.hidden = false; }
  });
  each('[data-contact]', function (el) {
    var v = CONTACTS[el.getAttribute('data-contact')];
    if (v) { el.textContent = v; el.hidden = false; var row = el.closest('[data-contact-row]'); if (row) row.hidden = false; }
  });
  var anyContact = primary || CONTACTS.address || CONTACTS.hours;
  if (anyContact) each('[data-state="empty"]', function (el) { el.hidden = true; });
  if (primary) each('[data-cta-needs-contact]', function (el) { el.hidden = false; });

  // ——— 0.1 Соцсети: ссылки в подвал + sameAs в разметку ———
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

  // ——— 0.2 Разметка: telephone / email / sameAs дописываются в оба блока #organization, только при наличии ———
  if (tel || mail || sameAs.length) {
    each('script[type="application/ld+json"]', function (ld) {
      try {
        var node = JSON.parse(ld.textContent);
        if (!node['@id'] || !/#organization$/.test(node['@id'])) return;
        if (tel) node.telephone = CONTACTS.phone;
        if (mail) node.email = mail;
        if (sameAs.length) node.sameAs = sameAs;
        ld.textContent = JSON.stringify(node);
      } catch (e) { /* блок остаётся как есть */ }
    });
  }

  // ——— 0.3 Реквизиты оператора (privacy.html) ———
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

  // ——— 1. Прелоадер: рамка кадра раскрывается в hero, затем появляется контент ———
  var loader = d.getElementById('loader');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready() { d.body.classList.remove('is-loading'); d.body.classList.add('is-ready'); }
  if (!loader || reduced || navigator.webdriver) {
    if (loader) loader.remove();
    requestAnimationFrame(function () { requestAnimationFrame(ready); });
  } else {
    var count = loader.querySelector('.loader__count'), started = Date.now(), n = 0;
    requestAnimationFrame(function () { loader.classList.add('is-in'); });
    var tick = setInterval(function () {
      n = Math.min(100, Math.round((Date.now() - started) / 11));
      if (count) count.textContent = (n < 10 ? '0' : '') + n;
      if (n >= 100) clearInterval(tick);
    }, 40);
    var hero = d.getElementById('heroImg');
    var waits = [new Promise(function (r) { setTimeout(r, 1250); })];
    if (d.fonts && d.fonts.ready) waits.push(d.fonts.ready);
    if (hero && hero.decode) waits.push(hero.decode().catch(function () {}));
    Promise.all(waits).then(function () {
      clearInterval(tick); if (count) count.textContent = '100';
      loader.classList.add('is-out');
      setTimeout(ready, 450);
      setTimeout(function () { loader.classList.add('is-gone'); }, 1000);
      setTimeout(function () { loader.remove(); }, 1600);
    });
  }

  // ——— 2. Шапка: состояние после 120px ———
  var hdr = d.getElementById('hdr');
  if (hdr && 'IntersectionObserver' in window) {
    var sentinel = d.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:120px;pointer-events:none;';
    d.body.prepend(sentinel);
    new IntersectionObserver(function (e) { hdr.classList.toggle('is-stuck', !e[0].isIntersecting); }, { threshold: 0 }).observe(sentinel);
  }

  // ——— 3. Мобильное меню ———
  var burger = d.getElementById('burger'), menu = d.getElementById('menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    d.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a').focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    each('#menu a', function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // ——— 4. Активный пункт навигации ———
  var links = {};
  each('.nav__list a[href^="#"]', function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window && Object.keys(links).length) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = links[en.target.id]; if (!a) return;
        for (var k in links) links[k].classList.remove('is-active');
        a.classList.add('is-active');
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    Object.keys(links).forEach(function (id) { var s = d.getElementById(id); if (s) secObs.observe(s); });
  }

  // ——— 5. Микроанимация № 2: появление заголовков секций и рамок, один раз ———
  var reveals = d.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); revObs.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(reveals, function (el) { revObs.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  }

  // ——— 6. Продукты: активная строка переключает липкое фото ———
  var products = d.querySelectorAll('.product[data-photo]');
  var photos = d.querySelectorAll('.media img[data-photo]');
  var mediaTag = d.querySelector('[data-media-tag]');
  function activate(id) {
    Array.prototype.forEach.call(products, function (p) { p.classList.toggle('is-active', p.getAttribute('data-photo') === id); });
    Array.prototype.forEach.call(photos, function (img) { img.classList.toggle('is-active', img.getAttribute('data-photo') === id); });
    var p = d.querySelector('.product[data-photo="' + id + '"]');
    if (mediaTag && p) mediaTag.textContent = p.getAttribute('data-tag') || '';
  }
  if (products.length) {
    activate(products[0].getAttribute('data-photo'));
    if ('IntersectionObserver' in window) {
      var prodObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) activate(en.target.getAttribute('data-photo')); });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      Array.prototype.forEach.call(products, function (p) { prodObs.observe(p); });
    }
  }

  // ——— 7. Cookie-согласие (контракт из references/legal-templates.md) ———
  var CK_KEY = 'kadr:cookie-consent';            // {choice:'all'|'necessary', at: Date.now(), v:1}
  var CK_TTL = 365 * 24 * 60 * 60 * 1000;        // 12 месяцев
  var box = d.getElementById('cookie');
  function readChoice() {
    try {
      var raw = JSON.parse(localStorage.getItem(CK_KEY) || 'null');
      if (raw && raw.choice && raw.at && Date.now() - raw.at < CK_TTL) return raw.choice;
    } catch (e) { /* нет доступа к localStorage */ }
    return null;
  }
  function applyChoice(choice) {
    window.SiteConsent = choice;
    d.documentElement.setAttribute('data-consent', choice);
    d.dispatchEvent(new CustomEvent('site:consent', { detail: choice }));
    // ЕДИНСТВЕННАЯ точка подключения счётчиков — и только при choice === 'all'.
    if (choice === 'all') initAnalytics();
  }
  function openBox() { if (box) { box.hidden = false; box.classList.add('is-open'); } }
  function closeBox() { if (box) { box.classList.remove('is-open'); box.hidden = true; } }
  var saved = readChoice();
  if (saved) applyChoice(saved);
  else if (box) setTimeout(openBox, 700);
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
