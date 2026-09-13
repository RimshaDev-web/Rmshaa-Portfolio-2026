/* ============================================================
   Rimsha Arshad — shared behaviours
   ============================================================ */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- stylus cursor + ink trail ---------- */
  if (fine && !reduce) {
    const pen = document.getElementById('stylus');
    const dot = document.getElementById('dot');
    const cv  = document.getElementById('ink');
    if (pen && dot && cv) {
      const ctx = cv.getContext('2d');
      let W, H, pts = [], mx = -100, my = -100, px = -100, py = -100, rot = 0;
      const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
      size(); addEventListener('resize', size);

      addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        pts.push({ x: mx, y: my, life: 1 });
        if (pts.length > 42) pts.shift();
      });

      (function loop () {
        px += (mx - px) * .35; py += (my - py) * .35;
        const t = Math.max(-26, Math.min(26, (mx - px) * 1.1));
        rot += (t - rot) * .12;
        pen.style.transform = `translate3d(${px}px,${py}px,0) rotate(${rot}deg)`;
        dot.style.transform = `translate3d(${mx}px,${my}px,0) scale(${dot.classList.contains('on') ? 1 : .4})`;

        ctx.clearRect(0, 0, W, H);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          b.life *= .955;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,184,113,${b.life * .55})`;
          ctx.lineWidth = b.life * 3.2;
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        pts = pts.filter(p => p.life > .04);
        requestAnimationFrame(loop);
      })();

      document.querySelectorAll('a,button,[data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
          dot.classList.add('on');
          dot.textContent = el.dataset.cursor || '';
          document.body.classList.add('pen-hide');
        });
        el.addEventListener('mouseleave', () => {
          dot.classList.remove('on');
          document.body.classList.remove('pen-hide');
        });
      });
    }
  }

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const up  = document.getElementById('up');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (nav) {
      nav.classList.toggle('stuck', y > 40);
      nav.classList.toggle('up', y > lastY && y > 400 && !nav.classList.contains('open'));
    }
    if (up) up.classList.toggle('on', y > 900);
    lastY = y;
  }, { passive: true });
  document.getElementById('burger')?.addEventListener('click', () => nav.classList.toggle('open'));
  up?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-r]').forEach(el => io.observe(el));

  /* ---------- magnetic + tilt ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('[data-mag]').forEach(el => {
      el.style.transition = 'transform .45s cubic-bezier(.19,1,.22,1)';
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, sfx = el.dataset.suffix || '';
      let t0 = null;
      const step = t => {
        if (!t0) t0 = t;
        const p = Math.min((t - t0) / 1400, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + sfx;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ---------- pinned horizontal scroll (any [data-hs]) ---------- */
  document.querySelectorAll('[data-hs]').forEach(sec => {
    const rail  = sec.querySelector('.hs__rail');
    const track = sec.querySelector('.hs__track');
    const bar   = sec.querySelector('.hs__bar i');
    if (!rail || !track) return;
    const desktop = () => matchMedia('(min-width:901px)').matches;
    let dist = 0;

    const measure = () => {
      if (!desktop()) { track.style.transform = ''; rail.style.height = ''; return; }
      dist = Math.max(0, track.scrollWidth - innerWidth + innerWidth * .1);
      rail.style.height = (innerHeight + dist * 1.05) + 'px';
    };
    const onScroll = () => {
      if (!desktop()) return;
      const r = rail.getBoundingClientRect();
      const total = rail.offsetHeight - innerHeight;
      const p = Math.min(Math.max(-r.top / total, 0), 1);
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      if (bar) bar.style.width = (p * 100) + '%';
    };
    addEventListener('resize', () => { measure(); onScroll(); });
    addEventListener('load', () => { measure(); onScroll(); });
    measure(); onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  });

  /* ---------- work filters ---------- */
  const rows = [...document.querySelectorAll('.row')];
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      const f = chip.dataset.f;
      rows.forEach(r => r.classList.toggle('hide', !(f === 'all' || r.dataset.cat.split(' ').includes(f))));
      let i = 1;
      rows.forEach(r => { if (!r.classList.contains('hide')) r.querySelector('.row__n').textContent = String(i++).padStart(2, '0'); });
    });
  });

  /* ---------- hover peek ---------- */
  const peek = document.getElementById('peek');
  if (peek && fine && !reduce) {
    const pimg = peek.querySelector('img');
    rows.forEach(r => {
      r.addEventListener('mouseenter', () => { pimg.src = r.dataset.peek; peek.classList.add('on'); });
      r.addEventListener('mouseleave', () => peek.classList.remove('on'));
    });
    addEventListener('mousemove', e => { peek.style.left = e.clientX + 'px'; peek.style.top = e.clientY + 'px'; });
  }

  /* ---------- copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.classList.add('done');
        setTimeout(() => btn.classList.remove('done'), 1600);
      } catch (e) { /* clipboard blocked — ignore */ }
    });
  });

  /* ---------- local time ---------- */
  const now = document.getElementById('now');
  if (now) {
    const tick = () => {
      const t = new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi'
      }).format(new Date());
      now.textContent = `Right now it's ${t} in Lahore, PK`;
    };
    tick(); setInterval(tick, 20000);
  }

  /* ---------- 3D keyboard ---------- */
  const kb = document.getElementById('kb');
  if (kb) {
    const body   = kb.querySelector('.kb__body');
    const screen = kb.querySelector('.kb__screen');
    const kTag   = screen.querySelector('.k');
    const kName  = screen.querySelector('b');
    const kNote  = screen.querySelector('span');

    if (fine && !reduce) {
      kb.addEventListener('mousemove', e => {
        const r = kb.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        body.style.transform = `rotateX(${14 - y * 8}deg) rotateY(${x * 10}deg)`;
      });
      kb.addEventListener('mouseleave', () => { body.style.transform = 'rotateX(11deg)'; });
      body.style.transform = 'rotateX(11deg)';
    }

    const press = key => {
      key.classList.add('down');
      setTimeout(() => key.classList.remove('down'), 160);
      kTag.textContent = key.dataset.k || key.textContent.trim().slice(0, 2);
      kName.textContent = key.dataset.name || '';
      kNote.textContent = key.dataset.note || '';
    };

    kb.querySelectorAll('.key').forEach(key => {
      key.addEventListener('click', () => press(key));
    });

    addEventListener('keydown', e => {
      const match = [...kb.querySelectorAll('.key')].find(k => (k.dataset.k || '').toLowerCase()[0] === e.key.toLowerCase());
      if (match && kb.getBoundingClientRect().top < innerHeight && kb.getBoundingClientRect().bottom > 0) press(match);
    });
  }
})();
