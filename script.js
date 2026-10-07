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
  if (!stats) return;

  const visibilityTarget = stats.querySelector('.stats-list') ?? stats;
  const header = document.querySelector('.site-header');
  const counters = [...stats.querySelectorAll('.counter[data-target]')]
    .map((element) => ({
      element,
      target: Number(element.dataset.target),
    }))
    .filter(({ target }) => Number.isFinite(target) && target >= 0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!counters.length) return;

  const duration = 2000;
  const visibilityThreshold = 0.4;
  const animationFrames = new Map();
  let visibilityFrameId;
  let statsObserver;
  let hasAnimated = false;
  let pageLoaded = document.readyState === 'complete';
  let replayRequested = false;

  const renderProgress = (progress) => {
    counters.forEach(({ element, target }) => {
      element.textContent = String(
        progress === 1 ? target : Math.floor(target * progress),
      );
    });
  };

  const stopAnimation = () => {
    animationFrames.forEach((frameId) => window.cancelAnimationFrame(frameId));
    animationFrames.clear();
  };

  const resetCounters = () => {
    stopAnimation();
    hasAnimated = false;
    renderProgress(0);
  };

  const animateCounter = ({ element, target }) => {
    let startedAt;

    const updateCounter = (timestamp) => {
      startedAt ??= timestamp;
      // Elapsed time keeps the sample's steady count consistent across refresh rates.
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      element.textContent = String(
        progress < 1 ? Math.floor(target * progress) : target,
      );

      if (progress < 1) {
        animationFrames.set(
          element,
          window.requestAnimationFrame(updateCounter),
        );
      } else {
        animationFrames.delete(element);
      }
    };

    animationFrames.set(element, window.requestAnimationFrame(updateCounter));
  };

  const startAnimation = () => {
    resetCounters();
    hasAnimated = true;
    counters.forEach(animateCounter);
  };

  const updateVisibility = (replay = false) => {
    const bounds = visibilityTarget.getBoundingClientRect();
    // The sticky navbar covers part of the viewport when scrolling back.
    const viewportTop = Math.max(
      0,
      header?.getBoundingClientRect().bottom ?? 0,
    );
    const visibleHeight = Math.max(
      0,
      Math.min(bounds.bottom, window.innerHeight) -
        Math.max(bounds.top, viewportTop),
    );
    const isInView =
      bounds.height > 0 && visibleHeight >= bounds.height * visibilityThreshold;

    if (reducedMotion.matches) {
      stopAnimation();
      renderProgress(1);
    } else if (!pageLoaded || !isInView) {
      resetCounters();
    } else if (!hasAnimated || (replay && animationFrames.size === 0)) {
      startAnimation();
    }
  };

  const observeStats = () => {
    if (!('IntersectionObserver' in window)) return;
    statsObserver?.disconnect();

    const headerHeight = Math.max(
      0,
      header?.getBoundingClientRect().bottom ?? 0,
    );
    statsObserver = new IntersectionObserver(() => scheduleVisibilityCheck(), {
      threshold: [0, visibilityThreshold],
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    });
    statsObserver.observe(visibilityTarget);
  };

  const scheduleVisibilityCheck = (replay = false) => {
    replayRequested ||= replay;
    if (visibilityFrameId !== undefined) return;

    visibilityFrameId = window.requestAnimationFrame(() => {
      visibilityFrameId = undefined;
      const shouldReplay = replayRequested;
      replayRequested = false;
      updateVisibility(shouldReplay);
    });
  };

  // Replay on the next scroll after completion, including within the viewport.
  window.addEventListener('scroll', () => scheduleVisibilityCheck(true), {
    passive: true,
  });
  window.addEventListener('resize', () => {
    observeStats();
    scheduleVisibilityCheck();
  });
  window.addEventListener(
    'load',
    () => {
      pageLoaded = true;
      scheduleVisibilityCheck(true);
    },
    { once: true },
  );
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) scheduleVisibilityCheck(true);
  });

  reducedMotion.addEventListener('change', () => {
    stopAnimation();
    hasAnimated = false;
    updateVisibility(true);
  });

  renderProgress(reducedMotion.matches ? 1 : 0);
  observeStats();
  if (pageLoaded) updateVisibility();
}

function initializeReviewCarousels() {
  const section = document.querySelector('#reviews');
  if (!section) return;

  const toggle = section.querySelector('.reviews-motion-toggle');
  const toggleLabel = toggle?.querySelector('[data-reviews-toggle-label]');
  const browseHint = section.querySelector('#reviews-browse-hint');
  const rows = [...section.querySelectorAll('.reviews-row')]
    .map((element) => ({
      element,
      track: element.querySelector('.reviews-track'),
      group: element.querySelector('.reviews-group'),
    }))
    .filter(({ track, group }) => track && group?.children.length);

  if (!toggle || !toggleLabel || !browseHint || !rows.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pixelsPerSecond = 36;
  let paused = false;

  const refreshRows = () => {
    if (reducedMotion.matches) return;

    rows.forEach(({ element, track, group }) => {
      // Include the trailing gap so the last card joins the first without a jump.
      const distance = group.getBoundingClientRect().width;
      if (distance <= 0) return;

      const copiesNeeded = Math.max(1, Math.ceil(element.clientWidth / distance));
      const copies = [...track.querySelectorAll('[data-review-copy]')];

      if (copies.length !== copiesNeeded) {
        copies.forEach((copy) => copy.remove());
        for (let index = 0; index < copiesNeeded; index += 1) {
          const copy = group.cloneNode(true);
          copy.setAttribute('data-review-copy', '');
          copy.setAttribute('aria-hidden', 'true');
          copy.inert = true;
          copy.removeAttribute('id');
          copy.querySelectorAll('[id]').forEach((node) => {
            node.removeAttribute('id');
          });
          track.append(copy);
        }
      }

      track.style.setProperty('--reviews-distance', `${distance}px`);
      track.style.setProperty(
        '--reviews-duration',
        `${distance / pixelsPerSecond}s`,
      );
    });
  };

  const updateMotionPreference = () => {
    section.classList.remove('reviews-enhanced');
    toggle.hidden = reducedMotion.matches;
    browseHint.textContent = reducedMotion.matches
      ? 'Swipe a row or use the arrow keys to browse.'
      : 'Pause the motion, or focus a row, to browse at your own pace.';

    if (reducedMotion.matches) {
      rows.forEach(({ track }) => {
        track.querySelectorAll('[data-review-copy]').forEach((copy) => {
          copy.remove();
        });
      });
    } else {
      refreshRows();
      rows.forEach(({ element }) => {
        element.scrollLeft = 0;
      });
      section.classList.add('reviews-enhanced');
    }
  };

  section.dataset.reviewsPaused = 'false';
  toggle.addEventListener('click', () => {
    paused = !paused;
    section.dataset.reviewsPaused = String(paused);
    toggleLabel.textContent = paused ? 'Resume motion' : 'Pause motion';
    rows.forEach(({ element }) => {
      element.scrollLeft = 0;
    });
  });

  rows.forEach(({ element }) => {
    element.addEventListener('focusout', (event) => {
      if (
        !element.contains(event.relatedTarget) &&
        !paused &&
        !reducedMotion.matches
      ) {
        element.scrollLeft = 0;
      }
    });
  });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(refreshRows);
    rows.forEach(({ element }) => resizeObserver.observe(element));
  } else {
    window.addEventListener('resize', refreshRows, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    section.dataset.reviewsVisible = 'false';
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        section.dataset.reviewsVisible = String(entry.isIntersecting);
      },
      { rootMargin: '100px' },
    );
    visibilityObserver.observe(section);
  }

  reducedMotion.addEventListener('change', updateMotionPreference);
  updateMotionPreference();
}

initializeNavigation();
initializeCounters();
initializeReviewCarousels();
