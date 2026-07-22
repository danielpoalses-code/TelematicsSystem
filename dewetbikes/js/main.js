/* ============================================================
   De Wet Bikes — interactions
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Year ---------- */
  var yr = $('#year'); if (yr) yr.textContent = '2026';

  /* ---------- Sticky header shrink ---------- */
  var header = $('#header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ---------- Slide-in drawer ---------- */
  var drawer = $('#drawer'), overlay = $('#drawerOverlay'), burger = $('#hamburger'), closeBtn = $('#drawerClose');
  function openDrawer() {
    drawer.classList.add('is-open'); overlay.classList.add('is-open');
    burger.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('is-open'); overlay.classList.remove('is-open');
    burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  $$('.drawer__link').forEach(function (l) { l.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Hero slider ---------- */
  var slides = $$('.hero__slide'), dots = $$('#heroDots .dot'), cur = 0, timer;
  function go(n) {
    slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('is-active'); dots[cur].classList.add('is-active');
  }
  function next() { go(cur + 1); }
  function start() { timer = setInterval(next, 5000); }
  function reset() { clearInterval(timer); start(); }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); reset(); }); });
  start();

  /* ---------- Search card tabs ---------- */
  $$('.searchtab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.searchtab').forEach(function (x) { x.classList.remove('is-active'); });
      t.classList.add('is-active');
    });
  });

  /* ---------- Data: stock listings ---------- */
  var STOCK = [
    { cat: 'Motorcycle', make: 'KTM', model: '390 Duke', year: 2022, km: 8400, cc: '373cc', gears: '6-spd', price: 89900, badge: 'Low km', tone: 'orange' },
    { cat: 'Motorcycle', make: 'Kawasaki', model: 'Ninja 400', year: 2021, km: 12500, cc: '399cc', gears: '6-spd', price: 84900, badge: 'Popular', tone: 'green' },
    { cat: 'Off-road', make: 'Husqvarna', model: 'FE 350', year: 2023, km: 3100, cc: '350cc', gears: '6-spd', price: 149900, badge: 'New in', tone: 'blue' },
    { cat: 'Motorcycle', make: 'Honda', model: 'CB650R', year: 2020, km: 21000, cc: '649cc', gears: '6-spd', price: 112900, badge: '', tone: 'red' },
    { cat: 'Quad', make: 'Honda', model: 'TRX 420', year: 2021, km: 5400, cc: '420cc', gears: 'Auto', price: 96900, badge: 'Farm-ready', tone: 'red' },
    { cat: 'Scooter', make: 'Yamaha', model: 'NMAX 155', year: 2023, km: 2600, cc: '155cc', gears: 'CVT', price: 44900, badge: 'Great buy', tone: 'blue' },
    { cat: 'Off-road', make: 'KTM', model: '250 SX-F', year: 2022, km: 60, cc: '250cc', gears: '5-spd', price: 129900, badge: 'As new', tone: 'orange' },
    { cat: 'Motorcycle', make: 'BMW', model: 'G 310 R', year: 2021, km: 14800, cc: '313cc', gears: '6-spd', price: 74900, badge: '', tone: 'grey' },
    { cat: 'Scooter', make: 'Vespa', model: 'Primavera 150', year: 2022, km: 4100, cc: '150cc', gears: 'CVT', price: 69900, badge: 'Iconic', tone: 'teal' },
    { cat: 'Go-kart', make: 'GoBull', model: 'Racer 200', year: 2023, km: 200, cc: '196cc', gears: 'Auto', price: 32900, badge: 'Fun', tone: 'yellow' },
    { cat: 'Trailer', make: 'Venter', model: 'Bike Carrier', year: 2024, km: 0, cc: '2-bike', gears: 'Braked', price: 28900, badge: 'New', tone: 'grey' },
    { cat: 'Motorcycle', make: 'Kawasaki', model: 'Z900', year: 2020, km: 18700, cc: '948cc', gears: '6-spd', price: 154900, badge: 'Superbike', tone: 'green' }
  ];

  var TONES = {
    orange: ['#ff7a18', '#3d1200'], green: ['#22c55e', '#04331b'], blue: ['#1763e6', '#04173d'],
    red: ['#ef3e46', '#3a0206'], grey: ['#64748b', '#111827'], teal: ['#0ea5a5', '#032e2e'],
    yellow: ['#f4b400', '#3a2b00']
  };

  // Motorcycle silhouette path for the "photo" placeholder
  function bikeSvg(tone, label) {
    var c = TONES[tone] || TONES.blue;
    return '' +
      '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#g)"/>' +
      '<g fill="rgba(255,255,255,.10)"><circle cx="60" cy="40" r="90"/><circle cx="360" cy="270" r="70"/></g>' +
      '<g transform="translate(48,86) scale(1.35)" fill="rgba(255,255,255,.92)">' +
      '<path d="M5 40a15 15 0 1 0 30 0 15 15 0 0 0-30 0zm10 0a5 5 0 1 1 10 0 5 5 0 0 1-10 0z"/>' +
      '<path d="M155 40a15 15 0 1 0 30 0 15 15 0 0 0-30 0zm10 0a5 5 0 1 1 10 0 5 5 0 0 1-10 0z"/>' +
      '<path d="M20 40h35l18-22h26l6 10h20a20 20 0 0 1 20 22h-11a9 9 0 0 0-18 0h-2l-16-24H77L64 40l-4 3-8-6zM120 16l4 6h20l-3-6z"/>' +
      '<path d="M74 22c-14 2-26 8-30 16l7 4c5-7 15-12 27-14z"/>' +
      '</g>' +
      '<text x="200" y="285" text-anchor="middle" font-family="Poppins,Arial" font-size="13" font-weight="700" fill="rgba(255,255,255,.55)">' + label + '</text>' +
      '</svg>';
  }

  function fmt(n) { return 'R' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function cardHtml(v) {
    var badge = v.badge ? '<span class="card__badge">' + v.badge + '</span>' : '';
    var kmTxt = v.cat === 'Trailer' ? v.cc : (v.km === 0 ? 'Brand new' : (v.km.toLocaleString() + ' km'));
    return '' +
      '<article class="card" data-cat="' + v.cat + '" data-search="' + (v.make + ' ' + v.model).toLowerCase() + '">' +
      '<div class="card__media">' + bikeSvg(v.tone, v.make + ' ' + v.model) + badge +
      '<button class="card__fav" aria-label="Save">&#9825;</button></div>' +
      '<div class="card__body">' +
      '<span class="card__cat">' + v.cat + '</span>' +
      '<h3 class="card__title">' + v.year + ' ' + v.make + ' ' + v.model + '</h3>' +
      '<div class="card__specs">' +
      '<span class="card__spec"><span class="i i-cal"></span>' + v.year + '</span>' +
      '<span class="card__spec"><span class="i i-gauge"></span>' + kmTxt + '</span>' +
      '<span class="card__spec"><span class="i i-cog"></span>' + v.cc + '</span>' +
      '</div>' +
      '<div class="card__foot">' +
      '<span class="card__price">' + fmt(v.price) + '<small>or finance from ' + fmt(Math.round(v.price / 48)) + ' pm</small></span>' +
      '<button class="card__btn js-enquire">Enquire</button>' +
      '</div></div></article>';
  }

  var grid = $('#stockGrid'), empty = $('#stockEmpty');
  var activeCat = '', searchTerm = '';

  function render() {
    var list = STOCK.filter(function (v) {
      var okCat = !activeCat || v.cat === activeCat;
      var okSearch = !searchTerm || (v.make + ' ' + v.model).toLowerCase().indexOf(searchTerm) > -1;
      return okCat && okSearch;
    });
    grid.innerHTML = list.map(cardHtml).join('');
    empty.hidden = list.length > 0;
    // wire enquire buttons
    $$('.js-enquire', grid).forEach(function (b) {
      b.addEventListener('click', function () {
        showToast('Enquiry started — we\'ll be in touch shortly!');
        var el = $('#contact'); if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ---------- Filter chips ---------- */
  $$('#stockFilters .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      $$('#stockFilters .chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      activeCat = chip.getAttribute('data-cat');
      render();
    });
  });

  /* ---------- Stock search ---------- */
  var stockSearch = $('#stockSearch');
  if (stockSearch) stockSearch.addEventListener('input', function () {
    searchTerm = stockSearch.value.trim().toLowerCase(); render();
  });

  /* ---------- Hero search -> filter stock ---------- */
  var searchGo = $('#searchGo');
  if (searchGo) searchGo.addEventListener('click', function () {
    var cat = $('#fltCategory').value, maxP = parseInt($('#fltPrice').value, 10);
    // set category chip
    activeCat = cat || '';
    $$('#stockFilters .chip').forEach(function (c) {
      c.classList.toggle('is-active', c.getAttribute('data-cat') === activeCat);
    });
    render();
  });

  /* ---------- Categories grid ---------- */
  var CATS = [
    { name: 'Motorcycles', count: '120+ in stock', cat: 'Motorcycle', d: 'M5 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm14 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM5 11a4 4 0 0 0-1 .13L6.6 6H10v2H8l-.9 1.5A4 4 0 0 1 9 12h4.2l1.6-3.5A2 2 0 0 1 16.6 7H20v2h-3.4l-.8 1.7A4 4 0 1 1 12 14H9.9A4 4 0 0 1 5 11z' },
    { name: 'Quads', count: '30+ in stock', cat: 'Quad', d: 'M6 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 12l3-4h6l2 3h5v3h-2l-1 2H8l-1-2H4z' },
    { name: 'Scooters', count: '45+ in stock', cat: 'Scooter', d: 'M6 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm12 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM14 5h4l3 6v4h-3a3 3 0 0 0-6 0H9l3-6h-1V7l3-2z' },
    { name: 'Off-road', count: '60+ in stock', cat: 'Off-road', d: 'M5 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm14 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM6 12l3-5h4l2 3h4v2h-3l-2 3H9z' },
    { name: 'Go-karts', count: '15+ in stock', cat: 'Go-kart', d: 'M4 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM2 12h5l2-3h6l1 3h6v2h-2v1H6v-1H2z' },
    { name: 'Trailers', count: '20+ in stock', cat: 'Trailer', d: 'M2 8h14v6h-2a2 2 0 0 0-4 0H2zm16 2h2l2 3v1h-2a2 2 0 0 0-4 0h-.5V10z' }
  ];
  var catGrid = $('#catGrid');
  if (catGrid) {
    catGrid.innerHTML = CATS.map(function (c) {
      return '<button class="cat" data-cat="' + c.cat + '">' +
        '<span class="cat__ic"><svg viewBox="0 0 24 24" fill="#0a1f44"><path d="' + c.d + '"/></svg></span>' +
        '<span class="cat__name">' + c.name + '</span>' +
        '<span class="cat__count">' + c.count + '</span></button>';
    }).join('');
    $$('.cat', catGrid).forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCat = btn.getAttribute('data-cat');
        $$('#stockFilters .chip').forEach(function (c) {
          c.classList.toggle('is-active', c.getAttribute('data-cat') === activeCat);
        });
        render();
        $('#stock').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  render();

  /* ---------- Finance calculator ---------- */
  var cp = $('#calcPrice'), cd = $('#calcDeposit'), ct = $('#calcTerm'),
      cpO = $('#calcPriceOut'), cdO = $('#calcDepositOut'), res = $('#calcResult');
  function calc() {
    if (!cp) return;
    var price = +cp.value, dep = +cd.value / 100, term = +ct.value, rate = 0.135 / 12;
    var principal = price * (1 - dep);
    var m = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    cpO.textContent = fmt(price);
    cdO.textContent = cd.value + '%';
    res.textContent = fmt(Math.round(m)) + ' pm';
  }
  [cp, cd, ct].forEach(function (el) { if (el) el.addEventListener('input', calc); });
  calc();

  /* ---------- Stats counter ---------- */
  function animateCount(el) {
    var target = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '',
        start = 0, dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Reveal on scroll + counters ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          $$('.stat__num', e.target).forEach(animateCount);
          if (e.target.classList.contains('stat')) $$('.stat__num', e.target).forEach(animateCount);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
    // stats live outside .reveal wrappers too
    $$('.stat').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('.stat__num').forEach(animateCount);
  }

  /* ---------- Active nav link on scroll (scroll-spy) ---------- */
  var sections = ['stock', 'sell', 'finance', 'auctions', 'how', 'about', 'contact']
    .map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var navLinks = $$('.nav__link');
  window.addEventListener('scroll', function () {
    var y = window.scrollY + 120, id = '';
    sections.forEach(function (s) { if (s.offsetTop <= y) id = s.id; });
    navLinks.forEach(function (l) {
      l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
    });
  }, { passive: true });

  /* ---------- Toast ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(msg) {
    toast.innerHTML = '<span class="i i-check"></span>' + msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-show'); }, 3200);
  }

  /* ---------- Forms ---------- */
  ['#valueForm', '#contactForm'].forEach(function (sel) {
    var f = $(sel);
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast('Thanks! We\'ll get back to you within one business hour.');
      f.reset();
    });
  });

})();
