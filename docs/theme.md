# Website appearance

Light and dark appearances use the shared roles in `style.css`. The dark theme
is selected with `data-theme="dark"` on the root HTML element and uses the brand
navy background. Keep the brand palette unchanged; edit the theme role values
when adjusting text, surfaces, borders, or controls. Existing navy sections use
`--color-panel` and `--color-on-panel` so they stay readable in both themes.

`theme.js` runs before the stylesheet to apply the preferred appearance before
the page is painted. A visitor's choice is stored as `light` or `dark` under
`classic-home-brew-theme` in local storage. Until a choice is saved, the page
follows the device's color preference, including changes during the visit.
Invalid or missing preferences fall back to the device setting. When storage
is blocked, toggles continue to work for the current page. Other tabs update
when the saved preference changes.

Both navigation controls use `data-theme-toggle`, a stable “Dark mode” label,
and `aria-pressed` to communicate whether dark mode is enabled. They share
compact moon/sun icons; the sidebar control sits immediately before the close
button in `.drawer-actions`. The controls are hidden when JavaScript is
unavailable; the original light page and navigation remain usable.

The existing raster logo uses inversion with screen blending in dark mode to
keep its mark visible without changing the image file. Photographs and the
embedded Google Map retain their original colors.
