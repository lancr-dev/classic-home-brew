# Scroll reveals

Selected headings and content groups opt in with `data-scroll-reveal`. Each group fades in and rises 12px over 560ms on its first entry into view. Scrolling back does not replay it.

- Content already visible when the page opens stays visible without a reveal.
- The hero, counters, navigation, footer, embedded map, review tracks, and moments gallery retain their existing behavior.
- About photos move as one collage; the bento photos move as one grid. Individual photos and menu items have no separate scroll effects.
- Content remains visible without JavaScript or IntersectionObserver support. It is never hidden while awaiting a scroll event.
- Reduced-motion preferences disable reveals, including when the preference changes while browsing. Keyboard focus immediately stops a group's reveal.

## Adding or changing a reveal

Add `data-scroll-reveal` to a static heading or content group in index.html. Use one attribute per group; avoid nested targets, elements with their own transforms or animations, sticky/fixed content, and carousel tracks. No JavaScript selector changes are needed.

The shared animation is in style.css (`section-reveal`). Initialization and one-time observation are in script.js (`initializeScrollReveals`). The observer starts the effect after a group enters 24px into the viewport; it does not change the page's scrolling speed or intercept scrolling.
