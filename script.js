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

function initializeActiveNavigation() {
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const drawer = document.querySelector('#mobile-navigation');
  const links = [
    ...document.querySelectorAll(
      '.navigation-links a[href^="#"], .drawer-links a[href^="#"]',
    ),
  ];
  const sections = [...(main?.querySelectorAll(':scope > section[id]') ?? [])];
  const linkedIds = new Set(
    links
      .map((link) => link.getAttribute('href').slice(1))
      .filter((id) => sections.some((section) => section.id === id)),
  );

  if (!links.length || !sections.length || !linkedIds.size) return;

  let frameId;
  let currentId;

  const updateCurrentSection = () => {
    frameId = undefined;
    const headerBottom = Math.max(
      0,
      header?.getBoundingClientRect().bottom ?? 0,
    );
    const scrollPadding =
      Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop,
      ) || 0;
    // A short reading area tolerates font/layout shifts after anchor jumps and resizing.
    const readingArea = Math.min(
      64,
      Math.max(0, window.innerHeight - headerBottom) * 0.15,
    );
    const activationLine = Math.min(
      window.innerHeight - 1,
      Math.max(headerBottom, scrollPadding) + readingArea,
    );
    let currentSection;
    let lastVisibleSection;

    sections.forEach((section) => {
      const bounds = section.getBoundingClientRect();
      if (bounds.height <= 0) return;
      lastVisibleSection = section;
      if (bounds.top <= activationLine) currentSection = section;
    });

    // The final section may be too short to reach the header on a tall viewport.
    const atPageBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;
    if (atPageBottom) currentSection = lastVisibleSection;

    const nextId = linkedIds.has(currentSection?.id) ? currentSection.id : null;
    if (nextId === currentId) return;
    currentId = nextId;

    links.forEach((link) => {
      if (link.getAttribute('href') === `#${currentId}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const scheduleUpdate = () => {
    if (frameId !== undefined) return;
    frameId = window.requestAnimationFrame(updateCurrentSection);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate, { once: true });
  drawer?.addEventListener('close', scheduleUpdate);

  if (header && 'ResizeObserver' in window) {
    const headerObserver = new ResizeObserver(scheduleUpdate);
    headerObserver.observe(header);
  }
  document.fonts?.ready.then(scheduleUpdate);
  scheduleUpdate();
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
  let hasAnimated = reducedMotion.matches;
  let pageLoaded = document.readyState === 'complete';

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
    if (hasAnimated) return;
    hasAnimated = true;
    stopAnimation();
    renderProgress(0);
    counters.forEach(animateCounter);
  };

  const updateVisibility = () => {
    if (!pageLoaded) return;

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

    // Re-arm only after fully leaving view, so threshold crossings cannot replay it.
    if (visibleHeight === 0) {
      hasAnimated = false;
    } else if (isInView && reducedMotion.matches) {
      hasAnimated = true;
    } else if (isInView) {
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

  const scheduleVisibilityCheck = () => {
    if (visibilityFrameId !== undefined) return;

    visibilityFrameId = window.requestAnimationFrame(() => {
      visibilityFrameId = undefined;
      updateVisibility();
    });
  };

  // Scroll checks track entry and exit; an animation runs only once per visit.
  window.addEventListener('scroll', scheduleVisibilityCheck, {
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
      scheduleVisibilityCheck();
    },
    { once: true },
  );
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) scheduleVisibilityCheck();
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      hasAnimated = true;
      stopAnimation();
      renderProgress(1);
    }
    scheduleVisibilityCheck();
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

      const copiesNeeded = Math.max(
        1,
        Math.ceil(element.clientWidth / distance),
      );
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

function initializeMomentsGallery() {
  const section = document.querySelector('#moments');
  if (!section) return;

  const gallery = section.querySelector('.moments-gallery');
  const viewport = section.querySelector('.moments-viewport');
  const track = section.querySelector('.moments-track');
  const cards = [...section.querySelectorAll('.moments-card')];
  const arrows = [...section.querySelectorAll('[data-moments-step]')];
  const status = section.querySelector('.moments-status');
  const caption = section.querySelector('.moments-current-caption');
  const count = section.querySelector('.moments-count');
  const instructions = section.querySelector('#moments-instructions');

  if (
    !gallery ||
    !viewport ||
    !track ||
    !status ||
    !caption ||
    !count ||
    !instructions ||
    cards.length < 2
  ) {
    return;
  }

  let currentIndex = 0;
  let pointerStart;
  let dragFrame;
  let dragDistance = 0;

  const resetDrag = () => {
    const pointerId = pointerStart?.id;
    pointerStart = undefined;
    if (dragFrame !== undefined) window.cancelAnimationFrame(dragFrame);
    dragFrame = undefined;
    section.classList.remove('moments-dragging');
    track.style.removeProperty('--moment-drag-offset');

    if (pointerId !== undefined && viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
  };

  const showPhoto = (index) => {
    resetDrag();
    currentIndex = ((index % cards.length) + cards.length) % cards.length;

    cards.forEach((card, cardIndex) => {
      // Circular offsets keep the next/previous photos beside the center at either end.
      let offset = (cardIndex - currentIndex + cards.length) % cards.length;
      if (offset > cards.length / 2) offset -= cards.length;

      const isCurrent = offset === 0;
      card.style.setProperty('--moment-offset', String(offset));
      card.dataset.momentCurrent = String(isCurrent);
      card.dataset.momentNeighbor = String(Math.abs(offset) === 1);
      card.dataset.momentVisible = String(Math.abs(offset) <= 2);
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute(
        'aria-label',
        `Photo ${cardIndex + 1} of ${cards.length}`,
      );
      card.setAttribute('aria-hidden', String(!isCurrent));
      card.inert = !isCurrent;
    });

    caption.textContent =
      cards[currentIndex].querySelector('figcaption')?.textContent.trim() ||
      'A moment at Classic Home Brew';
    count.textContent =
      `${String(currentIndex + 1).padStart(2, '0')} / ` +
      String(cards.length).padStart(2, '0');
  };

  arrows.forEach((arrow) => {
    arrow.hidden = false;
    arrow.addEventListener('click', () => {
      showPhoto(currentIndex + Number(arrow.dataset.momentsStep));
    });
  });

  gallery.addEventListener('keydown', (event) => {
    const destinations = {
      ArrowLeft: currentIndex - 1,
      ArrowRight: currentIndex + 1,
      Home: 0,
      End: cards.length - 1,
    };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    showPhoto(destinations[event.key]);
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    resetDrag();
    pointerStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: cards[currentIndex].getBoundingClientRect().width,
      dragging: false,
    };
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const horizontalDistance = event.clientX - pointerStart.x;
    const verticalDistance = event.clientY - pointerStart.y;

    if (!pointerStart.dragging) {
      if (
        Math.abs(horizontalDistance) < 8 ||
        Math.abs(horizontalDistance) <= Math.abs(verticalDistance) * 1.2
      ) {
        return;
      }
      pointerStart.dragging = true;
      section.classList.add('moments-dragging');
    }

    // One gesture advances one photo; bound the drag to avoid exposing empty space.
    dragDistance = Math.max(
      -pointerStart.width,
      Math.min(pointerStart.width, horizontalDistance),
    );
    if (dragFrame !== undefined) return;
    dragFrame = window.requestAnimationFrame(() => {
      dragFrame = undefined;
      track.style.setProperty('--moment-drag-offset', `${dragDistance}px`);
    });
  });

  viewport.addEventListener('pointerup', (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const horizontalDistance = event.clientX - pointerStart.x;
    const verticalDistance = event.clientY - pointerStart.y;
    const threshold = Math.max(40, pointerStart.width * 0.15);
    const shouldAdvance =
      pointerStart.dragging &&
      Math.abs(horizontalDistance) >= threshold &&
      Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.2;
    resetDrag();

    if (shouldAdvance) {
      showPhoto(currentIndex + (horizontalDistance < 0 ? 1 : -1));
    }
  });

  viewport.addEventListener('pointercancel', resetDrag);
  viewport.addEventListener('lostpointercapture', resetDrag);

  gallery.setAttribute('aria-roledescription', 'carousel');
  track.setAttribute('role', 'presentation');
  instructions.textContent =
    'Use the previous and next buttons, the Left and Right arrow keys, or swipe ' +
    'or drag to browse photos. Home selects the first photo; End selects the last.';
  showPhoto(0);
  status.hidden = false;
  section.classList.add('moments-enhanced');
}

function initializeScrollReveals() {
  const targets = [...document.querySelectorAll('[data-scroll-reveal]')];
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const activeClass = 'is-scroll-revealing';
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        // Reveal once per page visit, with no replay during small scroll changes.
        observer.unobserve(target);
        if (reducedMotion.matches || target.contains(document.activeElement)) {
          return;
        }
        target.classList.add(activeClass);
      });
    },
    { rootMargin: '0px 0px -24px 0px', threshold: 0 },
  );

  targets.forEach((target) => {
    const bounds = target.getBoundingClientRect();
    // Keep the first viewport (including restored scroll positions) fully visible.
    if (bounds.top < window.innerHeight && bounds.bottom > 0) return;
    observer.observe(target);
  });

  document.addEventListener('animationend', (event) => {
    if (event.animationName === 'section-reveal') {
      event.target.classList.remove(activeClass);
    }
  });

  document.addEventListener('focusin', (event) => {
    const target = event.target.closest('[data-scroll-reveal]');
    if (!target) return;
    // Keyboard users must never wait for content or focus indicators to appear.
    observer.unobserve(target);
    target.classList.remove(activeClass);
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      targets.forEach((target) => target.classList.remove(activeClass));
    }
  });
}

function initializeFooter() {
  const year = document.querySelector('.site-footer [data-copyright-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

initializeNavigation();
initializeActiveNavigation();
initializeCounters();
initializeReviewCarousels();
initializeMomentsGallery();
initializeFooter();
initializeScrollReveals();
