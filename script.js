/* ============================================================
   VOID STUDIO — Animations & Interactions
   ============================================================ */

/* ── Preloader ── */
(function () {
  const count = document.getElementById('preloaderCount');
  const fill  = document.getElementById('preloaderFill');
  const loader = document.getElementById('preloader');
  let n = 0;
  const tick = setInterval(() => {
    n += Math.random() * 4 + 1;
    if (n >= 100) { n = 100; clearInterval(tick); }
    count.textContent = String(Math.floor(n)).padStart(2, '0');
    fill.style.width  = n + '%';
    if (n === 100) {
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.remove('loading');
        startHeroCounter();
      }, 500);
    }
  }, 40);
})();

/* ── Custom Cursor ── */
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function animFollower() {
  fx += (mx - fx) * 0.12;
  fy += (my - fy) * 0.12;
  follower.style.left = fx + 'px';
  follower.style.top  = fy + 'px';
  requestAnimationFrame(animFollower);
})();

document.querySelectorAll('a, button, [data-magnetic]').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ── Magnetic buttons ── */
document.querySelectorAll('[data-magnetic]').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

/* ── Nav scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile nav ── */
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
let mobileOpen  = false;

burger.addEventListener('click', () => {
  mobileOpen = !mobileOpen;
  mobileNav.classList.toggle('open', mobileOpen);
  const spans = burger.querySelectorAll('span');
  if (mobileOpen) {
    spans[0].style.cssText = 'transform:rotate(45deg) translate(5px,5px)';
    spans[1].style.cssText = 'transform:rotate(-45deg) translate(5px,-5px)';
  } else {
    spans[0].style.cssText = '';
    spans[1].style.cssText = '';
  }
});

mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileOpen = false;
    mobileNav.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => s.style.cssText = '');
  });
});

/* ── Hero canvas — particle field ── */
(function heroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  const COUNT = 90;
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * 1500,
      y: Math.random() * 900,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random(),
    });
  }

  let mouseX = W / 2, mouseY = H / 2;
  document.getElementById('heroCanvas').addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      /* subtle mouse repulsion */
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.4;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx; p.y += p.vy;

      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,255,0,${p.a * 0.35})`;
      ctx.fill();
    });

    /* draw lines between close particles */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(200,255,0,${(1 - d / 110) * 0.08})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

/* ── Hero counter count up ── */
function startHeroCounter() {
  const el = document.getElementById('heroCounter');
  if (!el) return;
  let n = 0;
  const target = 120;
  const tick = setInterval(() => {
    n = Math.min(n + 2, target);
    el.textContent = String(n).padStart(2, '0');
    if (n >= target) clearInterval(tick);
  }, 20);
}

/* ── Text scramble ── */
class Scrambler {
  constructor(el) {
    this.el   = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#@abcdefghijklmnopqrstuvwxyz';
    this.original = el.dataset.scramble || el.textContent;
  }
  start() {
    let iter = 0;
    const interval = setInterval(() => {
      this.el.textContent = this.original.split('').map((ch, idx) => {
        if (ch === ' ') return ' ';
        if (idx < iter) return this.original[idx];
        return this.chars[Math.floor(Math.random() * this.chars.length)];
      }).join('');
      iter += 1 / 3;
      if (iter >= this.original.length) clearInterval(interval);
    }, 30);
  }
}

document.querySelectorAll('[data-scramble]').forEach(el => {
  setTimeout(() => new Scrambler(el).start(), 1000);
});

/* ── Split text heading animation ── */
function splitHeadings() {
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.innerHTML;
    el.innerHTML = text.split('').map(ch => {
      if (ch === '<' || ch === '>') return ch; // skip tags
      if (ch === ' ' || ch === '\n') return `<span class="char" style="display:inline-block"> </span>`;
      if (ch === '/') return ch;
      return `<span class="char">${ch}</span>`;
    }).join('');

    // Stagger delays
    el.querySelectorAll('.char').forEach((c, i) => {
      c.style.transitionDelay = (i * 0.018) + 's';
    });
  });
}

splitHeadings();

/* ── Intersection observer for reveals ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    if (el.hasAttribute('data-split')) el.classList.add('in-view');
    if (el.hasAttribute('data-reveal')) el.classList.add('revealed');
    if (el.hasAttribute('data-service')) el.classList.add('revealed');

    io.unobserve(el);
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-split], [data-reveal], [data-service]').forEach(el => io.observe(el));

/* ── Stats count-up ── */
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const blocks = entry.target.querySelectorAll('[data-count]');
    blocks.forEach((block, i) => {
      const target  = parseInt(block.dataset.count);
      const suffix  = block.dataset.suffix || '';
      const el      = block.querySelector('.stat-val');
      if (!el) return;
      let current = 0;
      const step  = Math.ceil(target / 60);
      setTimeout(() => {
        const tick = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = current + suffix;
          if (current >= target) clearInterval(tick);
        }, 20);
      }, i * 120);
    });
    statsObserver.unobserve(entry.target);
  });
}, { threshold: 0.4 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) statsObserver.observe(statsSection);

/* ── Contact form ── */
const form    = document.getElementById('contactForm');
const success = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    btn.querySelector('.submit-text').textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      btn.style.display = 'none';
      success.classList.add('show');
      form.querySelectorAll('.field').forEach(f => f.value = '');
    }, 1200);
  });
}

/* ── Submit button ripple ── */
document.querySelector('.submit-btn')?.addEventListener('click', function (e) {
  const ripple = this.querySelector('.submit-ripple');
  const r = this.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;animation:rippleAnim 0.6s ease forwards`;
});

const style = document.createElement('style');
style.textContent = `@keyframes rippleAnim { from { transform:scale(0);opacity:0.4; } to { transform:scale(1);opacity:0; } }`;
document.head.appendChild(style);

/* ── Parallax hero title on scroll ── */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const hero = document.querySelector('.hero-content');
  if (hero && y < window.innerHeight) {
    hero.style.transform = `translateY(${y * 0.3}px)`;
    hero.style.opacity   = 1 - y / (window.innerHeight * 0.65);
  }
}, { passive: true });

/* ── Project rows stagger reveal ── */
const projectObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    setTimeout(() => {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateX(0)';
    }, i * 80);
    projectObserver.unobserve(entry.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-project]').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateX(-20px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  el.style.transitionDelay = (i * 0.08) + 's';
  projectObserver.observe(el);
});

/* ── Slow ticker pause on hover ── */
const tickerTrack = document.getElementById('tickerTrack');
if (tickerTrack) {
  tickerTrack.addEventListener('mouseenter', () => tickerTrack.style.animationPlayState = 'paused');
  tickerTrack.addEventListener('mouseleave', () => tickerTrack.style.animationPlayState = 'running');
}
