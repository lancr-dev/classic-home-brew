# Maintaining customer reviews

The review text comes from `GOOGLE_REVIEWS.md`. The published summaries live in
`index.html`, inside the two source `ul.reviews-group` lists in `#reviews`.
Editing the Markdown file alone does not change the website.

To add a review, copy an existing `li.review-card` into either source list, then
replace its summary, customer name, and avatar initials. Keep summaries concise,
faithful to the original feedback, and include any significant caveats. The
section identifies the text as summaries; individual star ratings are not
displayed because the supplied reviews do not include them.

Keep the rows roughly balanced. Their animation distance, speed, and number of
loop copies are calculated automatically by `initializeReviewCarousels()` in
`script.js`. Never add duplicate cards just to create the loop: generated copies
are hidden from assistive technology and made inert.

Component styles are grouped under the Reviews comment in `style.css`. Normal
motion travels right to left on the top row and left to right on the bottom row.
Hover pauses a row in place. The pause button or keyboard focus switches to
native horizontal browsing. Reduced-motion preferences and disabled JavaScript
also leave the original reviews available as horizontally scrollable lists.
