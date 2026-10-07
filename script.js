'use strict';

function initializeNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('#mobile-navigation');

  if (!menuToggle || !drawer || typeof drawer.showModal !== 'function') {
    return;
  }

  const closeButton = drawer.querySelector('.drawer-close');
  const mobileViewport = window.matchMedia('(max-width: 68rem)');

  const closeDrawer = () => {
    if (drawer.open) drawer.close();
  };

  menuToggle.addEventListener('click', () => {
    if (!mobileViewport.matches || drawer.open) return;

    drawer.showModal();
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('navigation-open');
  });

  closeButton.addEventListener('click', closeDrawer);

  // The native modal makes the background inert and supports Escape dismissal.
  drawer.addEventListener('close', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('navigation-open');
    if (mobileViewport.matches) menuToggle.focus({ preventScroll: true });
  });

  drawer.addEventListener('click', (event) => {
    if (event.target !== drawer) return;
    const bounds = drawer.getBoundingClientRect();
    const outsideDrawer =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outsideDrawer) closeDrawer();
  });

  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    const controls = [
      ...drawer.querySelectorAll('a[href], button:not([disabled])'),
    ].filter((element) => element.getClientRects().length > 0);
    const firstControl = controls[0];
    const lastControl = controls.at(-1);

    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl?.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl?.focus();
    }
  });

  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  mobileViewport.addEventListener('change', (event) => {
    if (!event.matches) closeDrawer();
  });

  menuToggle.hidden = false;
  document.documentElement.classList.add('navigation-enhanced');
}

function initializeCounters() {
  const stats = document.querySelector('#cafe-stats');
  const counters = [...document.querySelectorAll('[data-counter]')]
    .map((element) => ({
      element,
      target: Number(element.dataset.counter),
    }))
    .filter(({ target }) => Number.isFinite(target) && target >= 0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Leave the HTML's final values intact when animation is unavailable or unwanted.
  if (
    !stats ||
    !counters.length ||
    reducedMotion.matches ||
    !('IntersectionObserver' in window)
  ) {
    return;
  }

  const duration = 1600;
  let frameId;
  let startedAt;

  const renderProgress = (progress) => {
    counters.forEach(({ element, target }) => {
      element.textContent = String(Math.round(target * progress));
    });
  };

  const animate = (timestamp) => {
    startedAt ??= timestamp;
    const progress = Math.min((timestamp - startedAt) / duration, 1);
    renderProgress(1 - (1 - progress) ** 3);
    if (progress < 1) frameId = window.requestAnimationFrame(animate);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (
        reducedMotion.matches ||
        !entries.some((entry) => entry.isIntersecting)
      )
        return;
      observer.disconnect();
      frameId = window.requestAnimationFrame(animate);
    },
    { threshold: 0.35 },
  );

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    window.cancelAnimationFrame(frameId);
    renderProgress(1);
  });

  renderProgress(0);
  observer.observe(stats);
}

initializeNavigation();
initializeCounters();
