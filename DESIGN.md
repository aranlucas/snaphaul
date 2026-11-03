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

# The contact-sheet studio

Photos are the evidence; the listing is editable work. A prominent lead photo
and numbered detail views give resellers a familiar way to inspect one item.
Keep the camera mark and wordmark as the identity anchors.

- Mint marks selections, working surfaces and guidance; evergreen marks actions.
- Separate flat sheets with tonal surfaces and fine dividers rather than shadows.
- Reserve tight display typography for headings; give editable descriptions open line spacing.
- Keep native radios, file inputs, disclosures and textareas. Preserve keyboard focus,
  touch targets, mobile stacking, reduced motion and forced-color support.
- Loading indicators communicate waiting, not invented provider stages. Label
  hand-authored examples as illustrations.

The frontmatter retains the design tool's token reference; current layout and
breakpoints live in [app/globals.css](app/globals.css). Heights above are minimums,
not clipping bounds. The generated [.impeccable/design.json](.impeccable/design.json)
contains component previews; its tonal ramps are preview metadata, not shipped CSS tokens.
