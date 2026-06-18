/* ══════════════════════════════════════
   VOID STUDIO — 3D Interactive Script
   Three.js + GSAP ScrollTrigger
══════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ── Preloader ── */
(function () {
  const count  = document.getElementById('preloaderCount');
  const fill   = document.getElementById('preloaderFill');
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
        initReveal();
        startHeroCounter();
      }, 500);
    }
  }, 40);
})();

/* ══════════════════════════════════════
   THREE.JS — HERO CANVAS
══════════════════════════════════════ */
(function heroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 5;

  function resize() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* Icosahedron wireframe */
  const icoGeo  = new THREE.IcosahedronGeometry(1.6, 1);
  const icoMat  = new THREE.MeshBasicMaterial({ color: 0xc8ff00, wireframe: true, transparent: true, opacity: 0.18 });
  const ico     = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);

  /* Inner solid icosahedron */
  const innerGeo = new THREE.IcosahedronGeometry(1.2, 0);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xc8ff00, wireframe: true, transparent: true, opacity: 0.06 });
  const inner    = new THREE.Mesh(innerGeo, innerMat);
  scene.add(inner);

  /* Orbiting ring */
  const ringGeo = new THREE.TorusGeometry(2.2, 0.006, 2, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3cac, transparent: true, opacity: 0.35 });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  scene.add(ring);

  const ring2Geo = new THREE.TorusGeometry(2.6, 0.004, 2, 120);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.2 });
  const ring2    = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = -Math.PI / 4;
  ring2.rotation.y = Math.PI / 6;
  scene.add(ring2);

  /* Particle field */
  const COUNT  = 200;
  const pPos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i*3+2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xc8ff00, size: 0.025, transparent: true, opacity: 0.6 });
  const pts  = new THREE.Points(pGeo, pMat);
  scene.add(pts);

  /* Mouse influence */
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* GSAP scroll — shrink and fade the mesh on scroll */
  gsap.to([ico.scale, inner.scale, ring.scale, ring2.scale, pts.scale], {
    x: 0.3, y: 0.3, z: 0.3,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5,
    }
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    ico.rotation.x   = t * 0.12 + my * 0.3;
    ico.rotation.y   = t * 0.18 + mx * 0.3;
    inner.rotation.x = -t * 0.09;
    inner.rotation.y = t * 0.14;
    ring.rotation.z  = t * 0.22;
    ring2.rotation.z = -t * 0.16;
    pts.rotation.y   = t * 0.04;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ══════════════════════════════════════
   THREE.JS — ABOUT CANVAS
══════════════════════════════════════ */
(function aboutScene() {
  const canvas = document.getElementById('aboutCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;

  function resize() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* Torus knot */
  const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 180, 20, 2, 3);
  const knotMat = new THREE.MeshBasicMaterial({ color: 0xc8ff00, wireframe: true, transparent: true, opacity: 0.22 });
  const knot    = new THREE.Mesh(knotGeo, knotMat);
  scene.add(knot);

  const knotSolid = new THREE.TorusKnotGeometry(1.2, 0.35, 60, 8, 2, 3);
  const knotSolidMat = new THREE.MeshBasicMaterial({ color: 0xff3cac, wireframe: true, transparent: true, opacity: 0.08 });
  scene.add(new THREE.Mesh(knotSolid, knotSolidMat));

  /* Scroll-driven rotation */
  let scrollProgress = 0;
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: self => { scrollProgress = self.progress; }
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    knot.rotation.x = t * 0.15 + scrollProgress * Math.PI;
    knot.rotation.y = t * 0.22;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ══════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════ */
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function animFollower() {
  fx += (mx - fx) * 0.1;
  fy += (my - fy) * 0.1;
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
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

/* ══════════════════════════════════════
   NAV
══════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

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
  } else { spans[0].style.cssText = ''; spans[1].style.cssText = ''; }
});
mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileOpen = false; mobileNav.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => s.style.cssText = '');
  });
});

/* ══════════════════════════════════════
   SPLIT TEXT HEADINGS
══════════════════════════════════════ */
function splitHeadings() {
  document.querySelectorAll('[data-split]').forEach(el => {
    el.innerHTML = el.textContent.split('').map(ch => {
      if (ch === ' ') return `<span class="char" style="display:inline-block">&nbsp;</span>`;
      if (ch === '\n') return '<br>';
      return `<span class="char">${ch}</span>`;
    }).join('');
    el.querySelectorAll('.char').forEach((c, i) => {
      c.style.transitionDelay = (i * 0.018) + 's';
    });
  });
}
splitHeadings();

/* ══════════════════════════════════════
   GSAP SCROLL ANIMATIONS
══════════════════════════════════════ */
function initReveal() {

  /* Hero lines */
  document.querySelectorAll('.hero-line[data-split]').forEach((el, i) => {
    setTimeout(() => el.classList.add('in-view'), 100 + i * 150);
  });

  /* Generic [data-reveal] */
  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.closest('#hero')) {
      setTimeout(() => el.classList.add('revealed'), 600);
      return;
    }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => el.classList.add('revealed'),
    });
  });

  /* Section headers + h2 splits */
  document.querySelectorAll('.section-header, .about-text h2, .contact-text h2').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        el.classList.add('revealed');
        el.querySelectorAll('[data-split]').forEach(h => h.classList.add('in-view'));
      },
    });
  });

  /* Work cards — stagger */
  document.querySelectorAll('.work-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 90%',
      onEnter: () => {
        setTimeout(() => card.classList.add('in-view'), i * 100);
      }
    });
  });

  /* Service cards — stagger with 3D rise */
  document.querySelectorAll('.service-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      z: 0,
      duration: 0.7,
      delay: i * 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%' }
    });
  });

  /* Stats count-up */
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    ScrollTrigger.create({
      trigger: statsSection,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        statsSection.querySelectorAll('[data-count]').forEach((block, i) => {
          const target = parseInt(block.dataset.count);
          const suffix = block.dataset.suffix || '';
          const el     = block.querySelector('.stat-val');
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
      }
    });
  }

  /* About text paragraphs */
  document.querySelectorAll('.about-text [data-reveal], .about-text p, .about-text a').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        setTimeout(() => el.classList.add('revealed'), i * 120);
      }
    });
  });

  /* About h2 split */
  document.querySelectorAll('.about-text h2[data-split]').forEach(h => {
    ScrollTrigger.create({
      trigger: h, start: 'top 88%',
      onEnter: () => h.classList.add('in-view')
    });
  });

  /* Hero parallax */
  gsap.to('#heroContent', {
    y: 120,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });
}

/* ══════════════════════════════════════
   HERO COUNTER
══════════════════════════════════════ */
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

/* ══════════════════════════════════════
   WORK TRACK — drag scroll
══════════════════════════════════════ */
(function dragScroll() {
  const el = document.getElementById('workTrack');
  if (!el) return;
  let isDown = false, startX, scrollLeft;
  el.addEventListener('mousedown', e => {
    isDown = true; el.classList.add('active');
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });
  el.addEventListener('mouseleave', () => { isDown = false; });
  el.addEventListener('mouseup',   () => { isDown = false; });
  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeft - walk;
  });
})();

/* ══════════════════════════════════════
   WORK CARD TILT
══════════════════════════════════════ */
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const rx = ((e.clientY - cy) / (r.height / 2)) * -8;
    const ry = ((e.clientX - cx) / (r.width  / 2)) *  8;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(12px)`;
    card.style.boxShadow = `${-ry}px ${rx}px 40px rgba(200,255,0,0.12)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });
});

/* ══════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════ */
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

document.querySelector('.submit-btn')?.addEventListener('click', function (e) {
  const ripple = this.querySelector('.submit-ripple');
  const r = this.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;animation:rippleAnim 0.6s ease forwards`;
});
const style = document.createElement('style');
style.textContent = `@keyframes rippleAnim { from { transform:scale(0);opacity:0.4; } to { transform:scale(1);opacity:0; } }`;
document.head.appendChild(style);

/* ══════════════════════════════════════
   MARQUEE PAUSE ON HOVER
══════════════════════════════════════ */
const ticker = document.getElementById('tickerTrack');
if (ticker) {
  ticker.addEventListener('mouseenter', () => ticker.style.animationPlayState = 'paused');
  ticker.addEventListener('mouseleave', () => ticker.style.animationPlayState = 'running');
}
