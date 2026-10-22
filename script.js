(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var T = window.__T || { lv: doc.title, ru: doc.title };
  var each = function (sel, fn) { Array.prototype.forEach.call(doc.querySelectorAll(sel), fn); };
  var isRu = function () { return root.classList.contains('ru'); };
  var hdr = doc.getElementById('hdr'), burger = hdr.querySelector('.burger'), mnav = doc.getElementById('mnav');

  /* language: ?lang=ru opens Russian; both versions are in the page, attributes are swapped here */
  var ATTRS = ['alt', 'aria-label', 'placeholder', 'content'];
  function setLang(l, write) {
    var ru = l === 'ru';
    root.classList.toggle('ru', ru);
    root.lang = ru ? 'ru' : 'lv';
    doc.title = ru ? T.ru : T.lv;
    ATTRS.forEach(function (a) {
      each('[data-ru-' + a + ']', function (el) {
        if (!el.hasAttribute('data-lv-' + a)) el.setAttribute('data-lv-' + a, el.getAttribute(a) || '');
        el.setAttribute(a, el.getAttribute(ru ? 'data-ru-' + a : 'data-lv-' + a));
      });
    });
    each('option[data-ru]', function (o) {
      if (!o.hasAttribute('data-lv')) o.setAttribute('data-lv', o.textContent);
      o.textContent = o.getAttribute(ru ? 'data-ru' : 'data-lv');
    });
    each('[data-set-lang]', function (a) {
      if (a.getAttribute('data-set-lang') === l) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    each('[data-toggle-lang]', function (a) {
      a.setAttribute('href', ru ? '?lang=lv' : '?lang=ru');
      a.setAttribute('hreflang', ru ? 'lv' : 'ru');
    });
    if (write) {
      try {
        var u = new URL(location.href);
        if (ru) u.searchParams.set('lang', 'ru'); else u.searchParams.delete('lang');
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) { /* file:// or an old browser: the class switch is enough */ }
    }
    setMenu(hdr.classList.contains('open'));
  }

  /* mobile menu */
  function setMenu(open) {
    hdr.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? (isRu() ? 'Закрыть меню' : 'Aizvērt izvēlni') : (isRu() ? 'Меню' : 'Izvēlne'));
  }
  burger.addEventListener('click', function () { setMenu(!hdr.classList.contains('open')); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && hdr.classList.contains('open')) { setMenu(false); burger.focus(); }
  });
  doc.addEventListener('click', function (e) {
    if (hdr.classList.contains('open') && !hdr.contains(e.target)) setMenu(false);
    var a = e.target.closest('[data-set-lang],[data-toggle-lang]');
    if (!a) return;
    e.preventDefault();
    setLang(a.hasAttribute('data-set-lang') ? a.getAttribute('data-set-lang') : (isRu() ? 'lv' : 'ru'), true);
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && hdr.classList.contains('open')) setMenu(false); });

  /* header turns solid once the page is scrolled */
  var onScroll = function () { hdr.classList.toggle('solid', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  setLang(isRu() ? 'ru' : 'lv', false);

  /* reveal on scroll (the steps wire draws itself when the list comes in) */
  var items = [].slice.call(doc.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  /* enquiry form -> the visitor's mail program (window.__noNav lets a test read the address without opening it) */
  var form = doc.getElementById('cform');
  if (form) {
    var err = form.querySelector('.f-err');
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); err.hidden = true; }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var M = isRu()
        ? { name: 'Напишите своё имя.', contact: 'Укажите телефон или e-mail.', msg: 'Коротко опишите объект и работы.',
            subj: 'Заявка с сайта', n: 'Имя: ', c: 'Телефон или e-mail: ', s: 'Услуга: ' }
        : { name: 'Lūdzu, ierakstiet savu vārdu.', contact: 'Lūdzu, norādiet tālruni vai e-pastu.', msg: 'Lūdzu, īsi aprakstiet objektu un darbus.',
            subj: 'Pieteikums no mājaslapas', n: 'Vārds: ', c: 'Tālrunis vai e-pasts: ', s: 'Pakalpojums: ' };
      var f = form.elements, name = f.name.value.trim(), contact = f.contact.value.trim(), msg = f.msg.value.trim();
      var svc = f.svc.options[f.svc.selectedIndex].textContent.trim();
      [f.name, f.contact, f.msg].forEach(function (x) { x.removeAttribute('aria-invalid'); });
      var okContact = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact) || contact.replace(/\D/g, '').length >= 8;
      var bad = name.length < 2 ? [f.name, M.name] : (!okContact ? [f.contact, M.contact] : (msg.length < 5 ? [f.msg, M.msg] : null));
      if (bad) { bad[0].setAttribute('aria-invalid', 'true'); err.textContent = bad[1]; err.hidden = false; bad[0].focus(); return; }
      err.hidden = true;
      var body = M.n + name + '\n' + M.c + contact + '\n' + M.s + svc + '\n\n' + msg;
      var url = 'mailto:' + form.getAttribute('data-mail') + '?subject=' + encodeURIComponent(M.subj + ': ' + svc) + '&body=' + encodeURIComponent(body);
      window.__mailto = url;
      if (!window.__noNav) window.location.href = url;
    });
  }
})();
