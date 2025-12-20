# Espresso Engineered – UI Execution Standard

## 1. Purpose

This document defines the **UI execution rules** for Espresso Engineered. It is a steering specification for humans and AI agents (Kiro) to ensure consistent, high‑quality UI decisions without improvisation.

This is not a design theory document. It is an execution reference.

---

## 2. Vision & Feel (Non‑Negotiable)

**Adjectives**

* Typewriter
* Leather
* Masculine
* Classy
* Rich warmth
* Simple
* Sultry, mature, intimate

**What this means in practice**

* Material‑driven UI, not flat digital chrome
* Warm neutrals, no cool grays
* Contrast through value, not color
* Calm, editorial pacing
* Interfaces that feel *written*, not *rendered*
* Copy that feels *spoken quietly*, not announced

**What this explicitly avoids**

* Bright whites or pure blacks
* Noisy dashboards
* Playful, jokey, or gamified language
* Over‑familiar or flirtatious copy
* Legacy database / admin UI patterns

---

## 3. Reference Model (Adapted)

Primary structural inspiration is **Notion‑style layout discipline**, adapted to:

* Dark‑first, material UI
* Stronger hierarchy
* Fewer visible controls
* Clear separation between *structure* and *content*

Key principles borrowed from Notion:

* One primary content column
* Generous vertical rhythm
* Low‑friction CRUD
* Controls appear only when relevant

---

## 4. Layout Rules

### 4.1 Page Structure

All pages follow a consistent vertical stack:

1. Page header (title + minimal actions)
2. Primary content column
3. Optional secondary column (rare)

Rules:

* Content is centered, never edge‑to‑edge
* Max readable width enforced
* Secondary actions never compete with primary content

---

### 4.2 Content Width

* Reading / editing surfaces use a **narrow, paper‑like column**
* Browsing and discovery may expand slightly wider
* Full‑width layouts are disallowed

The page should feel like a *desk*, not a dashboard.

---

### 4.3 Cards and Surfaces

* Cards exist to group information, not decorate
* No heavy borders
* Separation is achieved via surface color and spacing
* Paper surfaces float above darker materials

Cards should disappear visually when empty or simple.

---

### 4.4 CRUD Patterns

#### Create / Edit

* Always performed on paper surfaces
* Single primary column
* Inline validation, no modal overload
* Foreign key fields follow explicit selection rules (defined later)

#### View / Read

* Read‑only views emphasize typography and spacing
* Actions are secondary and visually quiet

---

### 4.5 Lists, Tables, and Browsing

* Lists default to vertical, text‑forward layouts
* Tables are allowed but styled like ledgers, not spreadsheets
* Row separators are subtle or implied via spacing

Sorting and filtering are present but visually restrained.

---

## 5. Color System

All colors are defined as **design tokens**. No additional colors may be introduced without updating this document.

### 5.1 Core Materials

**Leather Base (App Shell)**

* Token: `bg.app.base`
* Hex: `#402B15`
* Usage:

  * Global background
  * Navigation rails
  * Page chrome

**Secondary Surface (Structure / Cards)**

* Token: `bg.surface.secondary`
* Hex: `#715C3B`
* Usage:

  * Cards
  * Panels
  * Grouped sections

**Paper Surface (Primary Work Surface)**

* Token: `bg.surface.paper.primary`
* Hex: `#E4D6BF`
* Usage:

  * Create/Edit screens
  * Reading views
  * Brew notes

**Paper Surface (Secondary / Dense)**

* Token: `bg.surface.paper.secondary`
* Hex: `#D8C9AF`
* Usage:

  * Long-form reading
  * Dense tables

---

### 5.2 Ink / Text Colors

**Primary Ink (Body Text)**

* Token: `text.ink.primary`
* Hex: `#2B2118`
* Usage:

  * Paragraphs
  * Table content
  * Primary labels on paper

**Secondary Ink (Metadata / Labels)**

* Token: `text.ink.secondary`
* Hex: `#4A3A2C`
* Usage:

  * Field labels
  * Timestamps
  * Secondary headers

**Muted Ink (Hints / Disabled)**

* Token: `text.ink.muted`
* Hex: `#6A5A4A`
* Usage:

  * Helper text
  * Placeholders
  * Disabled states

**Inverted Ink (Text on Dark)**

* Token: `text.ink.inverted`
* Hex: `#D6C7AE`
* Usage:

  * Navigation text
  * Buttons on leather

**Inverted Ink (Muted)**

* Token: `text.ink.inverted.muted`
* Hex: `#B9AA92`
* Usage:

  * Secondary text on dark surfaces

---

### 5.3 Accent & Semantics

**Primary Accent (Stamp / Brass)**

* Token: `accent.primary`
* Hex: `#B08A5A`
* Usage:

  * Discovery highlights
  * Suggestions
  * Ratings

**Success**

* Token: `semantic.success`
* Hex: `#55624A`

**Warning**

* Token: `semantic.warning`
* Hex: `#8A6A3E`

**Error**

* Token: `semantic.error`
* Hex: `#7A3E2F`

---

---

## 6. Typography

Typography carries most of the aesthetic weight. It should feel **printed, editorial, and deliberate**.

### 6.1 Fonts

**Primary Content Font**

* Name: Libre Baskerville
* Source: Google Fonts
* Usage:

  * Brew notes
  * Descriptions
  * Voice messages

**UI Font**

* Name: IBM Plex Sans
* Source: Google Fonts
* Usage:

  * Navigation
  * Forms
  * Tables

**Optional Mono (Restricted)**

* Name: IBM Plex Mono
* Usage:

  * Measurements
  * Grind size
  * Ratios

---

### 6.2 Text Types (Explicit)

**Voice Text**

* Font: Libre Baskerville
* Color: `text.ink.secondary` or `text.ink.inverted`
* Size: 14–16px
* Line height: 1.7

**Body Text**

* Font: Libre Baskerville
* Color: `text.ink.primary`
* Size: 16px
* Line height: 1.6–1.7

**Primary Heading (H1)**

* Font: Libre Baskerville
* Color: `text.ink.primary`
* Size: ~31px
* Weight: Regular

**Secondary Heading (H2/H3)**

* Font: IBM Plex Sans
* Color: `text.ink.secondary`
* Weight: Medium

**Labels / Metadata**

* Font: IBM Plex Sans
* Color: `text.ink.secondary`
* Size: 14px

**Helper / Placeholder**

* Font: IBM Plex Sans
* Color: `text.ink.muted`
* Size: 14px

---

---

## 7. Interaction, Motion & Voice

### 7.1 Motion

* Subtle, slow, intentional
* No spring or bounce
* Duration: 120–180ms

---

### 7.2 Voice (Execution Rules)

Voice appears only in **quiet moments**.

**Allowed Locations**

* Home header
* Empty states
* Post-save confirmations
* Return greetings

**Disallowed Locations**

* Errors
* Validation
* Data tables

**Tone Rules**

* Feminine, restrained
* Respectful
* Sentence case
* No punctuation flourish

---

---

## 8. Imagery & Iconography

**Photography**

* Textures over scenes
* Wood, metal, steam, paper
* Low saturation

**Icons**

* Stroke-based
* Simple geometry
* Secondary to text

---

## 9. Page Templates

### Home

* Leather background
* Optional voice header
* Discovery cards on secondary surface

### Brew Entry

* Paper surface
* Single column
* Voice text optional at top

### Brew Detail

* Paper surface
* Typography-forward
* Minimal actions

### Discovery

* Wider layout
* Cards on secondary surface

---

## 10. Forms & Foreign Keys

**Simple FK (<20 items)**

* Dropdown

**Medium FK (20–200)**

* Searchable select

**Large FK (>200)**

* Server-backed search

Inline create allowed only on paper surfaces.

---

## 11. Enforcement

This document is the source of truth.

If ambiguous:

1. Default to restraint
2. Default to voice silence
3. Update this document before implementing.

* No illustrative cartoons

---

## 9. Accessibility & Restraint

* Accessibility is mandatory
* High contrast without harshness
* Keyboard navigation supported everywhere

---

## 10. Enforcement

This document is the source of truth.

If a UI decision is ambiguous:

1. Default to simplicity
2. Default to Notion‑like restraint
3. Default to material realism

If still unclear, update this document before implementing.
