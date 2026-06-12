/* ==========================================================================
   KHULU DIGITAL — shared interaction engine
   Reveals · stagger · count-up · ripple · tilt · topo contours · progress
   ========================================================================== */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress bar ---------- */
  const bar = document.createElement('div');
  bar.id = 'progress';
  document.body.appendChild(bar);
  addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  }, { passive: true });

  /* ---------- nav: burger + active link + scrolled state ---------- */
  const nav = document.querySelector('nav.site');
  if (nav) {
    const burger = nav.querySelector('.nav-burger');
    if (burger) burger.addEventListener('click', () => nav.classList.toggle('open'));
    const darkEls = document.querySelectorAll('.dark-band,.cta-band,footer.site,[data-nav-dark]');
    let navRaf = null;
    const setScrolled = () => {
      nav.classList.toggle('scrolled', scrollY > 24);
      if (navRaf) return;
      navRaf = requestAnimationFrame(() => {
        const y = nav.offsetHeight / 2;
        let over = false;
        darkEls.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top <= y && r.bottom >= y) over = true;
        });
        nav.classList.toggle('over-dark', over);
        navRaf = null;
      });
    };
    addEventListener('scroll', setScrolled, { passive: true });
    addEventListener('resize', setScrolled, { passive: true });
    setScrolled();
    const here = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href === here || (here === 'index.html' && href === 'index.html')) a.classList.add('active');
    });
  }

  /* ---------- hero headline word reveal ---------- */
  if (!reduced) {
    document.querySelectorAll('.hero h1').forEach(h1 => {
      let wi = 0;
      (function split(node) {
        [...node.childNodes].forEach(child => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              const w = document.createElement('span'); w.className = 'w';
              const i = document.createElement('span'); i.className = 'wi';
              i.style.setProperty('--wi', wi++); i.textContent = part;
              w.appendChild(i); frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') split(child);
        });
      })(h1);
      requestAnimationFrame(() => h1.classList.add('words-go'));
    });
  }

  /* ---------- reveals + stagger ---------- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.hasAttribute('data-stagger')) {
        [...e.target.children].forEach((c, i) => {
          c.style.transitionDelay = (i * 0.07) + 's';
        });
      }
      io.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv,[data-stagger]').forEach(el => io.observe(el));

  /* ---------- count-up ---------- */
  const cu = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      cu.unobserve(e.target);
      const el = e.target, target = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
      const dec = (String(el.dataset.count).split('.')[1] || '').length;
      if (reduced) { el.textContent = target.toFixed(dec) + suf; return; }
      const t0 = performance.now(), dur = 1400;
      (function tick(t) {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: .5 });
  document.querySelectorAll('[data-count]').forEach(el => cu.observe(el));

  /* ---------- button ripple ---------- */
  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.btn,.chip,.filter-btn');
    if (!btn || reduced) return;
    const r = btn.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px;
      background:${btn.classList.contains('btn-red') || btn.classList.contains('btn-dark') ? 'rgba(255,255,255,.35)' : 'rgba(230,51,41,.18)'}`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 600);
  });

  /* ---------- card tilt (desktop only) ---------- */
  if (!reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      let raf = null;
      card.addEventListener('pointermove', e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          const y = (e.clientY - r.top) / r.height - .5;
          card.style.transform = `perspective(900px) rotateY(${x * 4.5}deg) rotateX(${-y * 4.5}deg)`;
          raf = null;
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
        card.style.transform = '';
        setTimeout(() => card.style.transition = '', 500);
      });
    });
  }

  /* ---------- topographic contour field ---------- */
  /* Add <div class="hero-topo" data-topo="light|dark"></div> inside a hero/band */
  document.querySelectorAll('.hero-topo').forEach(host => {
    const cv = document.createElement('canvas');
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    const darkMode = host.dataset.topo === 'dark';
    let W, H, t = Math.random() * 100, running = false;

    const hills = [
      { x: .12, y: .25, r: .42, sp: .00018, ph: 0 },
      { x: .46, y: .72, r: .38, sp: .00023, ph: 2.1 },
      { x: .74, y: .30, r: .46, sp: .00015, ph: 4.0 },
      { x: .95, y: .80, r: .36, sp: .00027, ph: 1.2 }
    ];
    function field(x, y, tm) {
      let v = 0;
      for (const h of hills) {
        const hx = h.x * W + Math.sin(tm * h.sp * 1000 + h.ph) * W * .04;
        const hy = h.y * H + Math.cos(tm * h.sp * 800 + h.ph) * H * .06;
        const dx = (x - hx) / (h.r * W), dy = (y - hy) / (h.r * W);
        const breathe = 1 + Math.sin(tm * h.sp * 600 + h.ph) * .12;
        v += Math.exp(-(dx * dx + dy * dy)) * breathe;
      }
      return v;
    }
    function resize() {
      const r = host.getBoundingClientRect();
      W = cv.width = Math.max(2, r.width) * devicePixelRatio;
      H = cv.height = Math.max(2, r.height) * devicePixelRatio;
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const levels = 11, step = Math.max(10, Math.round(W / 110));
      for (let li = 1; li <= levels; li++) {
        const iso = li / (levels + 1) * 1.45;
        const red = li === Math.floor(levels / 2);
        ctx.beginPath();
        /* marching squares-lite: scan rows, plot iso crossings */
        for (let y = 0; y < H; y += step) {
          let prev = field(0, y, t) - iso, started = false;
          for (let x = step; x < W; x += step) {
            const cur = field(x, y, t) - iso;
            if (prev * cur < 0) {
              const fx = x - step + step * (prev / (prev - cur));
              if (!started) { ctx.moveTo(fx, y); started = true; }
              else ctx.lineTo(fx, y);
            }
            prev = cur;
          }
        }
        ctx.lineWidth = devicePixelRatio * (red ? 1.2 : 1);
        if (red) {
          ctx.strokeStyle = darkMode ? 'rgba(230,51,41,.34)' : 'rgba(230,51,41,.30)';
          ctx.setLineDash([6 * devicePixelRatio, 7 * devicePixelRatio]);
          ctx.lineDashOffset = -t * 18;
        } else {
          ctx.strokeStyle = darkMode ? 'rgba(250,250,249,.07)' : 'rgba(12,10,9,.065)';
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
    }
    function loop() {
      if (!running) return;
      t += .016;
      draw();
      requestAnimationFrame(loop);
    }
    const vis = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting && !running && !reduced) { running = true; loop(); }
        else if (!e.isIntersecting) running = false;
      });
    });
    resize(); draw();
    if (reduced) { /* static frame only */ } else vis.observe(host);
    addEventListener('resize', () => { resize(); draw(); });
  });

  /* ---------- ticker: duplicate content for seamless loop ---------- */
  document.querySelectorAll('.ticker-track').forEach(tk => { tk.innerHTML += tk.innerHTML; });

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
