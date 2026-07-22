/* ============================================================
   De Wet Bikes — shared layout (header, drawer, footer) + utils
   Injected on every page so the chrome stays consistent.
   Set <body data-page="buy"> to highlight the active nav item.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var page = document.body.getAttribute('data-page') || 'home';

  var NAV = [
    { key: 'buy', href: 'buy.html', label: 'Buy' },
    { key: 'sell', href: 'sell.html', label: 'Sell' },
    { key: 'finance', href: 'finance.html', label: 'Finance' },
    { key: 'auctions', href: 'auctions.html', label: 'Auctions' },
    { key: 'about', href: 'about.html', label: 'About' },
    { key: 'contact', href: 'contact.html', label: 'Contact' }
  ];

  function navLinks(cls) {
    return NAV.map(function (n) {
      var active = n.key === page ? ' is-active' : '';
      return '<a href="' + n.href + '" class="' + cls + active + '">' + n.label + '</a>';
    }).join('');
  }

  /* ---------- Top contact strip ---------- */
  var topbar = '' +
    '<div class="topbar"><div class="container topbar__inner">' +
    '<div class="topbar__left">' +
    '<a href="tel:+27128240071" class="topbar__link"><span class="i i-phone"></span> +27 12 824 0071</a>' +
    '<a href="https://wa.me/27797005732" class="topbar__link"><span class="i i-chat"></span> WhatsApp 079 700 5732</a>' +
    '<span class="topbar__link topbar__hours"><span class="i i-clock"></span> Mon–Fri 08:00–17:00 · Sat 08:00–13:00</span>' +
    '</div><div class="topbar__right">' +
    '<span class="topbar__loc"><span class="i i-pin"></span> 971 Steve Biko Rd, Wonderboom South, Pretoria</span>' +
    '<a href="#" class="topbar__social" aria-label="Facebook"><span class="i i-fb"></span></a>' +
    '<a href="#" class="topbar__social" aria-label="Instagram"><span class="i i-ig"></span></a>' +
    '</div></div></div>';

  /* ---------- Header ---------- */
  var header = '' +
    '<header class="header" id="header"><div class="container header__inner">' +
    '<a href="index.html" class="brand" aria-label="De Wet Bikes home">' +
    '<span class="brand__mark">DW</span><span class="brand__text">De Wet <strong>Bikes</strong></span></a>' +
    '<nav class="nav">' + navLinks('nav__link') + '</nav>' +
    '<div class="header__cta">' +
    '<a href="sell.html" class="btn btn--yellow btn--sm">Sell your bike</a>' +
    '<button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '</div></div></header>';

  /* ---------- Slide-in drawer ---------- */
  var drawer = '' +
    '<div class="drawer-overlay" id="drawerOverlay"></div>' +
    '<aside class="drawer" id="drawer" aria-hidden="true">' +
    '<div class="drawer__head"><span class="brand__text">De Wet <strong>Bikes</strong></span>' +
    '<button class="drawer__close" id="drawerClose" aria-label="Close menu">&times;</button></div>' +
    '<nav class="drawer__nav">' +
    '<a href="index.html" class="drawer__link' + (page === 'home' ? ' is-active' : '') + '">Home</a>' +
    navLinks('drawer__link') +
    '</nav>' +
    '<div class="drawer__foot">' +
    '<a href="tel:+27128240071" class="btn btn--navy btn--block">Call +27 12 824 0071</a>' +
    '<a href="https://wa.me/27797005732" class="btn btn--yellow btn--block">WhatsApp us</a>' +
    '</div></aside>';

  /* ---------- Footer ---------- */
  var footer = '' +
    '<footer class="footer"><div class="container footer__inner">' +
    '<div class="footer__col footer__brand">' +
    '<a href="index.html" class="brand brand--footer"><span class="brand__mark">DW</span><span class="brand__text">De Wet <strong>Bikes</strong></span></a>' +
    '<p>We buy, sell &amp; auction motorcycles, quads, scooters, trailers, vehicles and much more — right here in Pretoria.</p>' +
    '<div class="footer__social"><a href="#" aria-label="Facebook"><span class="i i-fb"></span></a>' +
    '<a href="#" aria-label="Instagram"><span class="i i-ig"></span></a>' +
    '<a href="https://wa.me/27797005732" aria-label="WhatsApp"><span class="i i-chat"></span></a></div></div>' +
    '<div class="footer__col"><h4>Explore</h4><a href="buy.html">Buy a bike</a><a href="sell.html">Sell your bike</a><a href="finance.html">Finance</a><a href="auctions.html">Auctions</a></div>' +
    '<div class="footer__col"><h4>Company</h4><a href="about.html">About us</a><a href="sell.html#how">How it works</a><a href="about.html#reviews">Reviews</a><a href="contact.html">Contact</a></div>' +
    '<div class="footer__col"><h4>Get in touch</h4><a href="tel:+27128240071">+27 12 824 0071</a><a href="https://wa.me/27797005732">WhatsApp 079 700 5732</a><a href="contact.html">971 Steve Biko Rd, Wonderboom South</a></div>' +
    '</div><div class="footer__bar"><div class="container footer__barinner">' +
    '<span>© <span id="year"></span> De Wet Bikes. All rights reserved.</span>' +
    '<span>Buy · Sell · Auction · Finance · Trade-ins</span>' +
    '</div></div></footer>';

  var fab = '<a href="https://wa.me/27797005732" class="fab" aria-label="Chat on WhatsApp"><span class="i i-chat"></span></a>';
  var toast = '<div class="toast" id="toast"></div>';

  /* ---------- Inject ---------- */
  document.body.insertAdjacentHTML('afterbegin', topbar + header + drawer);
  document.body.insertAdjacentHTML('beforeend', footer + fab + toast);

  var yr = $('#year'); if (yr) yr.textContent = '2026';

  /* ---------- Sticky header ---------- */
  var headerEl = $('#header');
  window.addEventListener('scroll', function () {
    headerEl.classList.toggle('is-scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ---------- Drawer ---------- */
  var drawerEl = $('#drawer'), overlay = $('#drawerOverlay'), burger = $('#hamburger'), closeBtn = $('#drawerClose');
  function openDrawer() {
    drawerEl.classList.add('is-open'); overlay.classList.add('is-open');
    burger.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true');
    drawerEl.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawerEl.classList.remove('is-open'); overlay.classList.remove('is-open');
    burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
    drawerEl.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    drawerEl.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Shared toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  window.dwToast = function (msg) {
    toastEl.innerHTML = '<span class="i i-check"></span>' + msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 3200);
  };

  /* ---------- Reveal on scroll + stat counters ---------- */
  function animateCount(el) {
    var target = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '', t0 = null, dur = 1400;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          $$('.stat__num', e.target).forEach(animateCount);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14 });
    $$('.reveal, .stat').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('.stat__num').forEach(animateCount);
  }

  /* ---------- Shared form handling ---------- */
  $$('form[data-toast]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      window.dwToast(f.getAttribute('data-toast') || 'Thanks! We\'ll be in touch shortly.');
      f.reset();
    });
  });
})();
