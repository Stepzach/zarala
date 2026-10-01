# Zara Lake — connected website

Upload `index.html`, `styles.css`, `app.js` and `favicon.svg` together to the existing web host, replacing the previous versions. No build step is needed. This package has not been deployed by the editor.

## Live content

The site is configured to the published Google Sheet supplied on 30 September 2026:
https://docs.google.com/spreadsheets/d/e/2PACX-1vRqk41bIKnuD229OKMdksr3U0pM4By8EIIc9cKZc3NUvbS1Ym1gZZxLPK32uiPXRWwdAm9IebsCWcX8/pub?output=csv

| Section | Tab gid | Columns |
| --- | --- | --- |
| Gigs | 184492724 | date, venue, location, time, description, link, visible |
| Testimonials | 2133372136 | quote, name, location, order, visible |
| Setlist | 878801031 | song, artist, order, visible |
| Gallery | 635542522 | image_url, alt, order, visible |

Keep these headers in row 1. Add as many rows as needed below them: there is no fixed row range or card limit. Each visible valid row becomes an item on the site. Use TRUE to show an item and FALSE to hide it. Blank visibility also means visible. Lower order numbers appear first; ties retain sheet order. Gigs sort by date, with past dates omitted using the London calendar date.

Updates load on each visit, every 60 seconds while the page is visible, when returning to the browser tab, and when the connection comes back online. Google may take additional time to republish edits. Keep automatic republishing enabled in Google Sheets. Unchanged content is not rebuilt during refresh. A failed tab retains its last loaded content and retries at the next refresh; it does not block other tabs.

For gig dates, yyyy-mm-dd is recommended. UK dd/mm/yyyy and dates such as Thursday 1st Oct or 1 October 2026 also work. Dates without a year use the current London calendar year, so include a year for dates around New Year or historical records. The supplied gig currently has visible=FALSE and stays hidden until changed to TRUE.

Testimonials require quote and name; songs require song; images require image_url and alt. Incomplete rows are skipped so draft content does not block other rows. A valid empty tab hides its section; adding valid visible rows brings it back. Gallery URLs must point directly to publicly accessible images. Newly added images use the same lightbox and responsive grid as existing ones.

## Social and booking links

Instagram: https://www.instagram.com/zaralakemusic/
TikTok: https://www.tiktok.com/@zaralakemusic
SoundCloud: https://soundcloud.com/zaralakemusic/

The social cards use Font Awesome brand icons through the pinned 6.7.2 CDN stylesheet. Photos, fonts, icons and the published Sheet require internet access. Social URLs are also present in the HTML, so links work without JavaScript.

Booking enquiries use hello@zaralakemusic.com. To use a form later, set BOOKING_FORM_URL in app.js. On mobile, the navigation booking buttons are removed; the smaller hero booking button and booking section remain available. The mobile header has a three-line hamburger, and the hero type, copy, buttons and spacing are reduced to reveal more of the photo.

## Checks

All four live CSVs were retrieved and checked against the website parser. Row additions, unchanged refreshes, visibility, ordering, date formats, CSV escaping, unsafe links, fallback behaviour and gallery lightbox data were tested. HTML links, three-line hamburger markup and all three Font Awesome brand classes were checked.

A browser executable is unavailable in this environment, so final visual and interactive browser checks remain: review desktop/mobile layouts, open/close the menu and gallery, and verify external icons/photos after uploading. The live site itself has not been changed by this file delivery.

## Motion and interaction

The hero words enter gently and section titles rise 14px once when entering the viewport. The enhancement uses native IntersectionObserver and Web Animations APIs, with no animation library or scroll handler. Text stays visible if JavaScript or these APIs are unavailable. Changing the system reduced-motion preference cancels active title animations and disables decorative hover movement, smooth scrolling and the ticker.

Mouse/trackpad users get subtle button lift, link-arrow movement, photo zoom and social-card lift; these effects are limited to hover-capable, precise pointers. Keyboard users retain visible focus outlines and get static control feedback. Titles, text and essential actions are never gated behind an animation. The mobile ticker has a 44px pause/resume control and also pauses while its control has focus.
