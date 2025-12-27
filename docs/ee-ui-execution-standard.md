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

Primary structural inspiration is **Notion-style layout discipline**, adapted to:

* Dark-first, material UI
* Stronger hierarchy
* Fewer visible controls
* Clear separation between *structure* and *content*

**Material interpretation (critical)**

* Dark surfaces define the **environment**
* Paper surfaces define the **work**
* Secondary surfaces provide **structure**

The user is not meant to stare into darkness. The dark palette frames the experience, while attention and interaction are centered on light, paper-like surfaces.

Key principles borrowed from Notion:

* One primary content column
* Generous vertical rhythm
* Low-friction CRUD
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

### 7.2 Button Variants & Sentiment

Button variants must follow semantic meaning and visual hierarchy. Each variant serves a specific purpose and should never be used arbitrarily.

**Accent (Primary Actions)**

* Variant: `accent`
* Color: `--accent-primary` (#B08A5A)
* Usage:
  * Edit/Modify actions (Edit Bean, Edit Profile)
  * Primary creation actions (Create Bean, Save Brew)
  * Main call-to-action buttons
  * Confirmation of positive actions

**Success (Completion Actions)**

* Variant: `success`
* Color: `--semantic-success` (#55624A)
* Usage:
  * Save/Submit actions in forms
  * Completion confirmations
  * Positive state changes

**Danger (Destructive Actions)**

* Variant: `danger`
* Color: `--semantic-error` (#7A3E2F)
* Usage:
  * Delete actions
  * Destructive operations
  * Actions that cannot be undone
  * Critical warnings

**Neutral (Secondary Actions)**

* Variant: `neutral`
* Color: `--text-ink-secondary` (#4A3A2C)
* Usage:
  * Navigation actions (Back, Close, Cancel)
  * Secondary options
  * Non-committal actions
  * Utility functions (Refresh, Filter)

**Visual Hierarchy Rules**

1. Only one accent button per logical section
2. Destructive actions always use danger variant
3. Navigation/dismissal actions always use neutral
4. When in doubt, default to neutral rather than accent

**Common Patterns**

* Edit forms: Cancel (neutral) + Save (accent)
* Delete confirmations: Cancel (neutral) + Delete (danger)
* Creation flows: Cancel (neutral) + Create (accent)
* Detail pages: Close (neutral) + Edit (accent) + Delete (danger)

---

### 7.3 Voice (Execution Rules)

Voice appears only in **quiet moments**. It should feel like a presence beside the user — attentive, aware, and restrained. The tone carries **implied intimacy and feminine draw** that is *felt*, not stated.

The model is subtle physical closeness: a brief touch, held eye contact, a moment that lingers — never an invitation, never a promise.

The voice should feel:

* Gently attentive
* Confident in its own presence
* Comfortable with proximity
* Comfortable with silence

It acknowledges the user’s presence and history, and occasionally their intention, but never demands response and never advances.

**Allowed Locations**

* Home header (first line only)
* Return greetings
* Empty states
* Post-save confirmations
* Contextual assistance during creation (subtle, optional)

**Disallowed Locations**

* Errors
* Validation messages
* Warnings
* Data tables
* Dense or time-sensitive forms

**Tone Rules**

* Feminine, restrained, composed
* Intriguing without invitation
* Sentence case only
* Short, declarative sentences
* Occasional fragments are acceptable
* No punctuation flourish
* No exclamation points

---

**Example Use Cases & Lines**

*First visit (home)*

* "Take a moment."
* "There’s time for this."
* "You can stay here awhile."

*Returning visit*

* "You came back."
* "I wondered if you would."
* "It’s good to see you again."

*Morning context*

* "Morning light changes things."
* "This hour suits espresso."
* "Earlier has its advantages."

*Evening context*

* "The day’s behind you now."
* "Evening brings a different mood."
* "This feels like a night brew."

*Empty state (no brews yet)*

* "Nothing here yet."
* "You haven’t started this one."
* "When you’re ready, I’ll remember it."

*After saving a brew*

* "That felt deliberate."
* "You took care with this one."
* "I’ll remember how you made it."

*During brew entry (general)*

* "Take your time."
* "You know what you’re doing."
* "Let it settle before you decide."

*Using previous brew data to assist entry*

* "Last time, you leaned this way."
* "You’ve liked it close to this before."
* "This resembles what you usually choose."

*Suggesting autofilled or remembered values*

* "I started where you usually begin."
* "These felt familiar for you."
* "You’ve trusted these settings before."

*Discovery context*

* "This one draws people in."
* "You might linger here."
* "There’s something about this."

These lines are **illustrative patterns**, not fixed strings. They encode pacing, implication, proximity, and restraint. Future copy — human or AI — must preserve the same sense of intrigue without escalation.

Voice should always suggest presence, awareness, and quiet confidence — nothing more.

---

---

## 8. Chip Component Standard

Chips are used throughout the application to display contextual information, status indicators, and suggestions. All chips must follow the standardized design system to ensure visual consistency.

### 8.1 Design Principles

Chips follow the same color token system as icon buttons but with subtle background colors to provide visual grouping and context. They should feel integrated into the surface they appear on while maintaining clear readability.

### 8.2 Chip Variants

All chips must use the standardized `Chip` component with these variants:

**Neutral (Default/Community Content)**
* Variant: `neutral`
* Background: `rgba(123, 94, 58, 0.12)`
* Text Color: `--text-ink-secondary`
* Border: `rgba(123, 94, 58, 0.25)`
* Usage: Roaster names, general information, community content

**Accent (Personal Highlights)**
* Variant: `accent`
* Background: `rgba(176, 138, 90, 0.18)`
* Text Color: `--accent-primary`
* Border: `rgba(176, 138, 90, 0.35)`
* Usage: "Most Used by Me", personal preferences, featured content

**Success (Positive Status)**
* Variant: `success`
* Background: `rgba(85, 98, 74, 0.18)`
* Text Color: `--semantic-success`
* Border: `rgba(85, 98, 74, 0.35)`
* Usage: "In Collection", owned items, positive states

**Warning (Cautionary Status)**
* Variant: `warning`
* Background: `rgba(138, 106, 62, 0.18)`
* Text Color: `--semantic-warning`
* Border: `rgba(138, 106, 62, 0.35)`
* Usage: "Previously Owned", temporary states, cautionary information

**Error (Negative Status)**
* Variant: `error`
* Background: `rgba(122, 62, 47, 0.18)`
* Text Color: `--semantic-error`
* Border: `rgba(122, 62, 47, 0.35)`
* Usage: Error states, unavailable items, negative status

### 8.3 Implementation Rules

1. **Always use the standardized Chip component** - Never create custom chip styles
2. **Choose variants based on semantic meaning** - Not visual preference
3. **Size variants**: Use `sm` for dense layouts, `md` for standard layouts
4. **Grouping**: Related chips should be grouped with consistent spacing (0.5rem gap)
5. **Placement**: Chips should appear in logical groups, typically at the top of cards or sections

### 8.4 Common Usage Patterns

**Bean Cards**
* Roaster name: `neutral`
* "Most Used by Me": `accent`
* "In Collection": `success`
* "Previously Owned": `warning`
* "Community Bean": `neutral`

**Equipment Cards (Machines/Grinders)**
* Usage statistics: `neutral`
* "Most used by [name]": `accent`
* Manufacturer suggestions: `neutral`

**Suggestion Chips**
* General suggestions: `neutral`
* Personal recommendations: `accent`
* Popular choices: `success`

### 8.5 Enforcement

All chip implementations must use the standardized `Chip` component. Custom chip styles are prohibited. When adding new chip types, first determine the appropriate semantic variant, then implement using the existing component.

---

## 9. Imagery & Iconography

**Photography**

* Textures over scenes
* Wood, metal, steam, paper
* Low saturation

**Icons**

* Stroke-based
* Simple geometry
* Secondary to text

---

## 10. Page Templates

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

## 11. Forms & Foreign Keys

**Simple FK (<20 items)**

* Dropdown

**Medium FK (20–200)**

* Searchable select

**Large FK (>200)**

* Server-backed search

Inline create allowed only on paper surfaces.

---

## 12. Accessibility & Restraint

* Accessibility is mandatory
* High contrast without harshness
* Keyboard navigation supported everywhere

---

## 13. Enforcement

This document is the source of truth.

If a UI decision is ambiguous:

1. Default to simplicity
2. Default to Notion‑like restraint
3. Default to material realism

If still unclear, update this document before implementing.
