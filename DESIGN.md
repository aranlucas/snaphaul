---
name: Snaphaul
description: A contact-sheet studio for editable marketplace listing drafts.
colors:
  paper: "#f6f4ec"
  surface: "#fffef9"
  ink: "#172e25"
  muted: "#53665b"
  green: "#214d3a"
  green-hover: "#143624"
  mint: "#d5edb5"
  soft: "#e8ebe0"
  line: "#bcc5b5"
  coral: "#f1b39e"
  error: "#8a2924"
  error-bg: "#fae4dc"
  focus: "#b54b2d"
  text-on-ink: "#c4d3c4"
  text-on-mint: "#415a35"
  line-on-mint: "#a8bc8d"
  photo-caption: "#d6e2d4"
typography:
  display:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(3rem, 7.4vw, 6rem)"
    fontWeight: 750
    lineHeight: 1.01
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.3rem, 4.5vw, 3.6rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  studio-title:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.1rem, 4.5vw, 3.4rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  body-edit:
    fontFamily: "Geist, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    fontWeight: 550
    lineHeight: 1.55
  tag:
    fontFamily: "Geist, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Geist, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  container: "12px"
  control: "8px"
  field: "6px"
  chip: "4px"
  brand-mark: "9px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "36": "36px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  button-mint-hover:
    backgroundColor: "{colors.surface}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.soft}"
  button-disabled:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.muted}"
  button-small:
    rounded: "{rounded.control}"
    padding: "10px 13px"
    height: "44px"
  text-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
    height: "48px"
    width: "100%"
  description-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-edit}"
    rounded: "{rounded.field}"
    padding: "14px"
    height: "220px"
    width: "100%"
  marketplace-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "58px"
  marketplace-option-selected:
    backgroundColor: "{colors.mint}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.tag}"
    rounded: "{rounded.chip}"
    padding: "5px 10px"
  draft-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    padding: "24px"
  contact-sheet:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.container}"
    padding: "20px"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "12px 0"
---

# Design System: Snaphaul

## Overview

**Creative North Star: "The contact-sheet studio"**

Snaphaul treats an item as the starting material and the listing as a piece of editable work. Warm paper, green-black photo surfaces and mint guidance make the studio feel calm, direct and ready for use. The familiar camera mark anchors the identity; photographic evidence supplies the visual interest.

Large, tightly set Geist headlines give the landing page its confidence. The working interface shifts to clear labels, native controls and spacious prose. Flat surfaces and small corners keep the contact-sheet character legible without competing with the item.

**Key Characteristics:**

- Warm paper canvas with evergreen actions and mint task surfaces.
- Strong sans-serif headlines paired with readable editing text.
- A lead photo followed by numbered detail views.
- Flat containers, fine dividers and visible keyboard focus.
- Native form behavior, mobile stacking and reduced motion.

This record is extracted from `app/globals.css`, `app/page.tsx`, `app/app/page.tsx` and `app/components/studio-ui.tsx`; font loading is confirmed in `app/layout.tsx`. The selected direction is in `.impeccable/direction.md`. Saved desktop/mobile landing and studio captures in `.impeccable/review/` support the visual reading. No approved comp or selected challenger quality board is available. Values in the frontmatter are normative; descriptive names organize the implemented values rather than introduce a new palette.

## Colors

The palette combines warm cream and green neutrals with a light mint working surface. The frontmatter preserves the root color names and adds descriptive names for four reused literal colors.

### Primary

- **Evergreen** (`green`): primary actions, headline emphasis, selected radio marks and text carets.
- **Deep Evergreen** (`green-hover`): the darker hover state for evergreen buttons.
- **Working Mint** (`mint`): selected marketplaces, upload actions, price guidance, loading status and the landing example draft.

### Secondary

- **Apricot Coral** (`coral`): the factual illustrative-example label.
- **Rust Focus** (`focus`): keyboard and drag outlines.
- **Brick Error** (`error`) and **Blush Error Surface** (`error-bg`): readable error feedback.

### Neutral

- **Warm Paper** (`paper`): page background and light text on the photo surface.
- **Light Cream** (`surface`): editor, fields, photo captions and buttons on dark surfaces.
- **Green-Black Ink** (`ink`): primary text, photo contact sheet, camera mark and closing band.
- **Muted Sage Text** (`muted`): guidance, metadata and secondary navigation.
- **Soft Sage** (`soft`): empty drafts, neutral feedback and disabled controls.
- **Sage Line** (`line`): dividers, field strokes and outline controls.
- **Light Sage Text** (`text-on-ink`) and **Photo Caption Sage** (`photo-caption`): supporting text on green-black and photo-caption surfaces.
- **Olive Text** (`text-on-mint`) and **Olive Line** (`line-on-mint`): supporting text and divisions within mint surfaces.

**The Task Tone Rule.** Mint identifies a selection, a working surface or guidance; evergreen identifies an action. Preserve the distinction when extending a screen.

The sidecar's eight-step tonal ramps are generated preview metadata. The shipped CSS has no tonal scales; those ramp entries are not additional implementation tokens.

## Typography

**Display Font:** Geist (with sans-serif fallback).  
**Body Font:** Geist (with sans-serif fallback).

**Character:** One family spans bold landing statements and quiet working copy. Tight tracking belongs to headings; body copy keeps its natural spacing. Geist Mono is loaded by the application, but no visible role in these surfaces uses it.

### Hierarchy

- **Display:** the landing headline uses the `display` token. Below the narrow breakpoint it changes to `clamp(2.8rem, 10.8vw, 3.5rem)`.
- **Headline:** large explanatory sections use `headline`. The closing heading has its own observed fluid size (`clamp(2.5rem, 5vw, 4.5rem)`) with the same weight and tracking.
- **Studio title:** the `studio-title` token introduces the working screen.
- **Title:** editor titles use `title`, reducing to (26px) below the narrow breakpoint. Functional section headings use (17px, weight 600); editor section labels use (16px, weight 600).
- **Body:** ordinary copy uses `body`; description editing uses `body-edit`. Supporting copy is usually (14px), with factual notes at (12px–13px).
- **Label:** `label` covers navigation and common field-label sizing. Tags use the smaller `tag` role.
- **Editable title:** the title field uses (24px, weight 550, line-height 1.2, tracking −0.025em), reducing to (21px) on narrow screens.

**The Readable Copy Rule.** Keep the large, tight heading treatment out of descriptions and supporting prose. Editing text retains the observed body size and open line spacing.

## Layout

The shared page container is centered at a maximum (1248px). Its width is the viewport minus (40px), changing to viewport minus (80px) from (800px). The implementation uses repeated spacing values rather than a mathematical spacing scale; the frontmatter records the reused steps.

Landing sections begin as a single column. At (800px), the introduction becomes an asymmetric split (1.65fr / 1fr), the example pairs photo and draft (1.05fr / 1fr), and the workflow becomes two equal columns. Desktop section gaps reach (48px–72px); small screens reduce section padding and place supporting copy after the headline.

The studio stacks source and draft until (1024px), where it becomes (0.8fr / 1.2fr) with a (48px) gap. The source column remains narrower than the editing column. Native details fields use one column below (540px) and two columns above it; long-detail fields span the row. Marketplace options stay in a two-column grid.

The header keeps the brand and action or allowance together. Below (540px), the secondary “How it works” link is hidden, the header becomes shorter and the studio introduction wraps. Footer content wraps; its supporting sentence moves to a separate line on narrow screens. Editor labels and price controls reflow to preserve room for text.

Control heights in the frontmatter describe the source's minimum heights, not fixed clipping bounds. Standard buttons and fields have a minimum (48px); compact buttons and photo removal controls retain (44px); marketplace choices use (58px); the generation action uses (56px).

## Elevation & Depth

The implementation has no box shadows. Depth comes from the paper page, ink photo sheet, cream editor and mint guidance surfaces. Fine borders separate fields and copy sections; photo captions sit over the image on an opaque cream strip.

**The Flat Sheet Rule.** Use tonal surfaces and fine dividers for separation. Keep these recorded components shadow-free.

State transitions change background, text and border colors over (160ms, ease-out). The waiting marker alternates from a square to a rotated circle over (1.8s, cubic-bezier(0.16, 1, 0.3, 1)); this is a waiting signal, not provider progress. Reduced-motion preference disables that animation and control transitions and changes smooth scrolling to automatic.

## Shapes

Container corners use `container`, controls use `control`, fields and photo frames use `field`, and tags use `chip`. The camera-mark tile retains its distinct `brand-mark` corner. Forms and dividers use fine (1px) strokes. Circular radio marks identify choices; ordinary containers stay gently rectangular.

The lead photo spans both columns in the contact sheet and uses a (4:3) image area. Detail photos use an aspect ratio of (1.4). Uploaded photos use `object-fit: contain` so the whole image remains inspectable; the landing illustration uses `object-fit: cover`.

## Components

### Buttons

Confident and compact, with a clear task hierarchy.

- **Primary:** evergreen with cream text; the dark and green source variants share this treatment.
- **Mint:** light upload and closing actions; hover becomes cream.
- **Outline:** transparent with a sage stroke; hover adds a soft-sage fill and evergreen border.
- **Sizing:** use the frontmatter's standard or compact geometry. Icon gaps are (12px), reducing to (7px) for compact buttons.
- **Focus / Disabled:** keyboard outline is rust (3px), offset (4px). Disabled buttons become soft sage with muted text and a sage stroke. The upload control has a separate subdued dark-surface disabled treatment.

### Tags

Small, quiet descriptors. Tags have a sage stroke, muted text, compact padding and the `chip` corner. They wrap and allow long content to break. They are descriptive list items, not selectable controls.

### Cards / Containers

Flat sheets with task-specific tones. The editor uses cream; an empty draft uses soft sage; loading and price guidance use mint. Container corners remain consistent. The editor padding grows from (24px) to (30px) at (540px) and (32px) in the desktop studio.

### Inputs / Fields

Native controls with cream fill, sage stroke and green-black text. Text fields use the extracted `text-field` geometry; textareas use a field corner, (14px) inset and vertical resizing. Placeholders use muted text, and carets are evergreen. Preserve the global rust focus outline. Disabled fieldsets reduce opacity to (0.72); feedback errors use the error surface and error text.

### Navigation

The original Snaphaul camera mark and wordmark lead the header. Navigation links use the `label` role and underline on hover. The primary action stays in view when the secondary link is hidden on narrow screens. Legal links retain touch-sized rows in the footer. A focusable skip link precedes the header and becomes visible when focused.

### Marketplace Choices

Whole-tile labels contain native radios. The unselected tile is cream with a sage stroke; the selected tile is mint with an evergreen stroke and a thick evergreen radio ring. Keyboard focus outlines the entire tile. Preserve native keyboard selection, label activation and forced-color states.

### Contact Sheet

The signature photo component is an ink sheet with mint upload action, numbered captions and a prominent first view. Remove-photo controls sit within the image frame and retain a (44px) square target. Dragging applies the same rust outline used for focus.

### Disclosures and Status

Seller details and AI observations use native disclosure behavior. The seller-details row is divided with fine rules and has a plus/minus state marker. Loading status keeps its text visible beside the waiting marker. Copy feedback appears near the editable draft; it is hidden when empty.

## Do's and Don'ts

### Do:

- **Do** preserve the camera mark, wordmark and observed evergreen/mint action hierarchy.
- **Do** keep native radios, file inputs, disclosures and editable textareas operational.
- **Do** retain visible rust focus outlines and touch-sized controls.
- **Do** stack source and editor on small screens and let long copy and tags wrap.
- **Do** preserve reduced-motion and forced-color treatments.

### Don't:

- **Don't** add shadows to these flat sheet components.
- **Don't** turn descriptive tags into choice controls without an explicit interaction design.
- **Don't** apply display typography to editable descriptions or supporting guidance.
- **Don't** reintroduce decorative kickers above headings; the shipped headings start directly.

Not canonized: the removed “Photo notes” eyebrow is not a reusable pattern. No other craft-floor defect is established by the supplied finish review; no unrelated source repair is part of this documentation pass.
