# Maintaining Moments & Memories

The gallery lives in `#moments` in `index.html`, between Reviews and FAQ.
It intentionally has no navbar or sidebar link.

## Add a photo

1. Put the photo in `assets/images/moments/`.
2. Copy an existing `li.moments-card` inside `ul.moments-track`.
3. Update its image path, descriptive `alt` text, original `width` and `height`,
   and the short `figcaption` used below the selected photo.
4. Reload the page. The controls, photo count, and circular positions derive
   from the source cards automatically; no JavaScript count needs editing.

The order of the cards in HTML sets the browsing order. Do not add loop copies:
the gallery repositions the original cards.

## Photo and interaction conventions

The initial collection uses ten supplied moments photos. Portrait photos fit
the 3:4 frames best; other ratios are cropped with `object-fit: cover`. An
individual card can set `--moment-image-position` to adjust its crop. Keep
`loading="lazy"` and `decoding="async"` on gallery images.

Styles are grouped under the Moments & memories comment in `style.css`.
`initializeMomentsGallery()` in `script.js` handles arrows, wraparound,
Left/Right and Home/End keys, touch swipes, mouse dragging, and the accessible
current slide. A completed horizontal gesture advances one photo; a short drag
settles back to the current photo. Vertical touch scrolling remains available.

The enhanced gallery disables native scroll snapping so transformed slides
stay centered during wraparound. Native scroll snapping remains available in
the fallback gallery.

Motion is manual. Reduced-motion preferences switch photos immediately.
Without JavaScript, the source images remain available as a native horizontal
scrolling gallery. With fewer than two photos, the enhancement stays disabled.

## Check after changes

- From the first photo, the left arrow should center the last photo.
- Reload, then click the right arrow five times: the sixth photo should remain
  centered, and its caption and count should match.
- Browse a full cycle in both directions and confirm every selected photo is
  centered. Test touch swipes and mouse drags in both directions.
- A short or cancelled gesture should return to the same photo. Vertical touch
  scrolling should scroll the page without changing photos.
