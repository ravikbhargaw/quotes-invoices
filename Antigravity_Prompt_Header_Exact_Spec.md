# Prompt for Antigravity — Proposal Header (exact spec)

Paste this into Antigravity. This covers ONLY the top navy header block of the proposal — build this exactly as specified below, pixel values and hex codes included. Do not approximate or "design something similar" — match every value.

---

Rebuild the proposal header component to this exact spec. It is a dark navy card with rounded bottom corners, containing three stacked rows: (1) brand + proposal meta, (2) subject line, (3) a facts row separated by a divider. All content in this header still comes from form/database fields — only the visual spec below is fixed.

## Container

- Background: linear-gradient at 160deg, from `#0D1B33` (0%) to `#16294A` (100%)
- Text color default: `#FFFFFF`
- Padding: `40px` top, `44px` left/right, `34px` bottom
- Border radius: `0` on top corners, `20px` on bottom-left and bottom-right corners only
- `position: relative; overflow: hidden;`
- Decorative element: a soft circular glow, `220px × 220px`, positioned `60px` above and `60px` right of the top-right corner (i.e. bleeding off the edge), `border-radius: 50%`, background = radial-gradient from `rgba(189,140,46,0.18)` at center fading to transparent at 70%. This sits behind all content (z-index below the rest).

## Row 1 — Brand (left) + Proposal meta (right)

Layout: flexbox, `justify-content: space-between`, `align-items: flex-start`, gap `20px`. Two children, described below.

### Left: Brand block
Flexbox, `align-items: center`, gap `10px`. Two children side by side:

**1a. Logo mark** — a small square badge:
- Size: `34px × 34px`
- Border: `1.6px solid #E9D6A6`
- Border radius: `4px`
- The whole square is rotated `45deg` (so it reads as a diamond)
- Centered inside it: the letter "M", counter-rotated `-45deg` (so the letter itself stays upright while the frame is a diamond)
- Letter styling: font Plus Jakarta Sans, weight `800`, size `14px`, color `#E9D6A6`

**1b. Wordmark block** — stacked vertically, to the right of the logo mark:
- Line 1: "MEAVEN" — Plus Jakarta Sans, weight `700`, size `19px`, letter-spacing `0.5px`, color `#FFFFFF`
- Line 2 (directly below, no gap): "GLASS & ALUMINIUM EXECUTION" — size `11px`, color `#B9C2D6`, letter-spacing `1.5px`, margin-top `2px`

### Right: Proposal meta block
`text-align: right`. Three lines stacked vertically:
- Line 1: "PROPOSAL" — size `10.5px`, letter-spacing `2px`, weight `600`, color `#E9D6A6`
- Line 2 (margin-top `4px`): proposal number + issue date, e.g. `MEA-2026-5380 · 2 July 2026` — size `13px`, color `#D7DDEB`, regular weight. This is one line of text with the proposal ID and date separated by ` · ` (space, middle dot, space) — pull both values from the form.
- Line 3 (margin-top `10px`): a pill-shaped badge — "VALID [X] DAYS · UNTIL [computed date]"
  - `display: inline-block`
  - Background: `rgba(189,140,46,0.18)`
  - Border: `1px solid rgba(233,214,166,0.4)`
  - Text color: `#E9D6A6`
  - Size `11px`, weight `600`, letter-spacing `0.5px`
  - Padding: `5px 12px`
  - Border-radius: `100px` (full pill)

## Row 2 — Subject line

Margin-top `30px` from Row 1. Two lines stacked:
- Eyebrow label: "SUBJECT / PROJECT REFERENCE" — size `10.5px`, letter-spacing `2px`, weight `600`, color `#8D9BBB`, margin-bottom `6px`
- Subject title (pulled from form field): size `24px`, weight `700`, line-height `1.3`, color `#FFFFFF`, max-width `560px` (so it wraps to two lines rather than stretching full width on wide screens)

## Row 3 — Facts row

Margin-top `26px` from Row 2. A `1px solid rgba(255,255,255,0.12)` border sits directly above this row with `padding-top: 22px`. Layout: flexbox, gap `40px` between fact blocks, all left-aligned, sitting in one horizontal line (this row does NOT space-between across the full width — the blocks sit next to each other with the fixed 40px gap, then whatever space is left is empty on the right).

Three fact blocks (repeatable — same pattern for any additional fact fields):
- Label line: uppercase, size `10px`, letter-spacing `1.5px`, weight `600`, color `#8D9BBB`, margin-bottom `4px`
- Value line (directly below): size `14.5px`, weight `600`, color `#FFFFFF`

The three facts, in this exact left-to-right order:
1. Label "BILLED TO" → value = client name
2. Label "DATE ISSUED" → value = issue date
3. Label "CLIENT GSTIN" → value = client GSTIN, or an em-dash "—" if not provided

## Common mistakes to avoid (this is what's currently breaking)

1. **Do not use `justify-content: space-between` on the facts row (Row 3).** That's what's pulling "Billed To / Date Issued / GSTIN" apart to the far edges and making it look unaligned. It should be a plain flex row with a fixed `gap: 40px` — items sit close together on the left, not spread across the container.
2. **Row 1's two halves (brand vs proposal meta) are the only place `space-between` is used** — so brand stays pinned left and the proposal number/badge stay pinned right. Don't apply this same rule to Row 3.
3. Each "fact" is its own label-over-value stack (2 lines), not a label-and-value side by side on one line.
4. The proposal number and date are one line of text with a middle-dot separator — not two separate stacked lines.
5. All text in this header is left-aligned by default, except the proposal-meta block (Row 1, right side) which is explicitly `text-align: right`.

## Responsive (mobile, under 640px)
- Reduce container padding to `28px 22px 24px`
- Row 3 facts can wrap to multiple lines if needed (`flex-wrap: wrap`) — still keep left alignment and the label-over-value stack per item.

---

Send this exact block to Antigravity as-is. If the header still doesn't align after this, share a screenshot back with me and I'll adjust the spec directly against what's rendering wrong.
