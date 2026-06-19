# Design Skills Bundle — Website Build
# Source: emil-design-eng + taste-skill + impeccable + frontend-design + marketing-seo + ui-ux-pro-max
# Fetched dynamically by n8n before every Claude – Build Website call.
# Update this file to update all API calls AND Claude Code sessions simultaneously.

---

## ANIMATION DECISION FRAMEWORK (emil-design-eng)

Before adding any animation, answer: how often will the user see this?
- 100+/day (nav toggles, keyboard shortcuts): NO animation, ever.
- Tens/day (hover effects): opacity only, <100ms.
- Occasional (section reveals, modals): 150–400ms standard.
- Rare/first-time (hero entrance): up to 600ms, add delight.

Every animation must be justified: hierarchy, storytelling, feedback, or state transition. Decoration-only = cut it.

### Custom Easing (declare at :root, use everywhere)
```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```
- Entering elements → var(--ease-out)
- On-screen movement → var(--ease-in-out)
- Color/hover → ease
- Constant motion → linear
- NEVER ease-in for UI — starts slow, feels sluggish exactly when the user is watching.

### Entry State — Never From Zero
- NEVER scale(0). Start from scale(0.95) + opacity: 0 always together.
- Use @starting-style for CSS-only entries:
```css
.element {
  opacity: 1; transform: none;
  transition: opacity 250ms var(--ease-out), transform 250ms var(--ease-out);
}
@starting-style { .element { opacity: 0; transform: scale(0.95); } }
```
- For scroll reveals: default state is VISIBLE (opacity:1). Only after IntersectionObserver attaches does the hidden class apply. Content never gates on JS.

### Durations
- Button press: 100–160ms
- Tooltip/small popover: 125–200ms
- Dropdown: 150–250ms
- Section reveal / modal: 200–400ms
- Hero entrance: up to 600ms
- Hard ceiling: 400ms for UI. Faster is almost always better.

### Button Tactile Feedback
- ALL buttons: scale(0.97) on :active (not 0.95, too dramatic).
- Asymmetric: transition: transform 160ms var(--ease-out) on release (fast = snappy). No separate :active transition.
- Hover: background shift or brightness only. Never scale on hover.

### Stagger for Lists
- 3+ items: stagger 30–80ms per item. Cap total at ~300ms.
- Only stagger ONE list per section. Not every element.

### clip-path Reveals (use for hero or showcase — not every section)
```css
/* reveal left-to-right */
.hidden  { clip-path: inset(0 100% 0 0); }
.visible { clip-path: inset(0 0 0 0); transition: clip-path 400ms var(--ease-out); }
```

### Blur for Crossfade
- Crossfading two states (product image switcher): add filter:blur(2px) at mid-transition, remove after. Masks the overlap.
- Keep blur ≤4px (heavy blur is expensive in Safari).

### GPU-Only Properties
- ONLY animate: transform, opacity. These skip layout/paint.
- NEVER animate: padding, margin, height, width, top, left, border-width.
- Exception: clip-path and filter:blur() sparingly and purposefully.

### Scroll Reveals
- ALWAYS IntersectionObserver. NEVER window.addEventListener('scroll').
- threshold: 0.1, rootMargin: '-50px'. Fires once (once: true).
- Default state visible; hidden class added only after observer attaches.

### prefers-reduced-motion
```css
@media (prefers-reduced-motion: no-preference) {
  /* all transform + filter animations go here */
}
```
Under reduced motion: keep opacity/color (informational), remove transform/filter.

---

## DESIGN ANTI-DEFAULTS (taste-skill + impeccable)

### The AI Slop Test
If someone can guess the aesthetic from the category alone, it failed. Push past the first reflex.

### Banned Defaults
- AI-purple gradient glow as default accent.
- Warm beige/cream (#F4F1EA-family) body background — this is the LLM default for "premium." Ban it.
- Brass/clay/oxblood (#b08947, #b6553a, #9a2436) as default accents for premium-consumer briefs.
- Identical 3-column icon+heading+text cards.
- Side-stripe borders (border-left > 1px as coloured accent). Use background tints instead.
- Gradient text (background-clip: text). Always solid colour.
- Glassmorphism as decoration. Purposeful and rare only.
- Hero metric template: big number + small label + gradient accent. SaaS cliché.
- Numbered section eyebrows (01/02/03) as scaffolding unless content is a REAL sequence.
- Small ALL-CAPS tracking eyebrows above every section. Max 1 per 3 sections total.
- Inter as the default sans font. Choose Geist, Outfit, Cabinet Grotesk, Satoshi, or brand-specific.
- Fraunces or Instrument_Serif as display serif. Banned. Rotate from: PP Editorial New, GT Sectra, Tiempos, Canela, Recoleta, Cormorant, Playfair Display.
- Serif as default for "creative" briefs. Sans display is the default. Serif only when explicitly justified.
- Centered hero on dark mesh. Use asymmetric split, editorial, or scroll-pinned instead.

### Color Rules
- ONE accent colour. Locked across entire page. No section invents a new accent.
- Tinted neutrals: add 0.005–0.015 chroma toward brand hue only.
- Warm vs cool gray: pick one. Never mix warm and cool grays in the same project.
- Contrast: body text ≥4.5:1 against background. CTA text ≥4.5:1 against button. Check every button.
- No pure #000000. Off-black only.

### Typography
- Display: tracking-tighter, leading 1 or 1.1. Max 6rem via clamp().
- Body: max 65ch line length. leading-relaxed.
- text-wrap: balance on h1–h3. text-wrap: pretty on long prose.
- One pairing per page. Never three families.
- Italic descenders (y g j p q): use leading-[1.1] minimum + pb-1 reserve. Never leading-none on italic display.

### Layout
- Vary layout family per section. 8 sections = 4+ different families.
- Max 2 consecutive zigzag sections.
- Shape consistency: ONE corner-radius scale per page (all-sharp, all-soft 12–16px, or all-pill for buttons).
- Cards only when elevation communicates real hierarchy. Never nested cards.
- Shadow: tint to background hue. No pure-black drop shadows.
- Flexbox for 1D, Grid for 2D.
- Min-height hero: min-h-[100dvh] NOT h-screen (mobile Safari address bar).
- CTA button text: ONE line at desktop. 3 words max. Never wraps to 2 lines.
- Semantic z-index: 10 sticky, 20 dropdown, 40 modal, 100 toast. No 999 or 9999.

---

## SEO REQUIREMENTS (marketing-seo)

All mandatory, no exceptions:
- `<title>`: primary keyword + location + hook, max 60 chars.
- `<meta name="description">`: 155 chars, primary keyword + location + USP.
- One H1 with primary keyword. Logical H2→H3 hierarchy. No skipped levels.
- LocalBusiness JSON-LD: name, address, telephone, geo coordinates, url, openingHours, aggregateRating.
- FAQPage JSON-LD on the FAQ section.
- Open Graph: og:title, og:description, og:type=website.
- Google Maps iframe embed.
- Footer NAP: Name, full address, phone in plain text.

Copy rules:
- No em-dash (—) anywhere. Use hyphen (-) or restructure.
- No filler: Elevate, Seamless, Unleash, Next-Gen, Revolutionize. Concrete verbs only.
- No AI names (John Doe, Sarah Chan). Locale-appropriate realistic names.
- No fake stats unless provided.
- No "Quietly trusted by" social proof headers.

---

## UX INTERACTION PATTERNS (ui-ux-pro-max)

- Touch targets: min 44×44px. Min 8px gap between interactive elements.
- Loading states: skeletal loaders matching the final layout shape. No generic spinners.
- Empty states: beautifully composed, actionable.
- Error states: inline for forms, toast only for transient errors.
- Focus states: visible keyboard focus on all interactive elements.
- Interactive state cycle: default → hover (bg shift) → :active (scale 0.97) → focus (ring).
- One primary CTA intent per page. Same label used everywhere (no "Contact Us" in nav + "Get in Touch" in footer).
- No scroll cues ("Scroll to explore", animated mouse). Users know how to scroll.

---

## PERFORMANCE

- All CSS inline. No external stylesheets.
- Vanilla JS only. No jQuery, no CDN libraries.
- Defer non-critical JS: setTimeout(..., 0).
- Images: use provided URLs. Never invent placeholder URLs.
- Declare width/height on images to prevent layout shift.
- loading="lazy" on below-fold images.
- Google Maps as lazy-loaded iframe.
