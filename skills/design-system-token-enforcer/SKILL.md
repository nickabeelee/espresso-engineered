---
name: design-system-token-enforcer
description: Enforce design system token usage in espresso-engineered-1 frontend UI work. Use when creating or editing Svelte components, layout sections, typography, spacing, colors, surfaces, or buttons, especially when introducing new UI components or section headers.
---

# Design System Token Enforcer

## Overview

Use existing design tokens and UI patterns instead of hardcoded values. Align new component structure and header styles with established patterns (notably the bean detail section header).

## Workflow

1. Locate token sources and patterns.
2. Map every new style or layout decision to a token or established pattern.
3. Add missing tokens upstream only when necessary.
4. Call out any intentional exceptions.

## Token Sources (required)

Read `references/ui-token-sources.md` before editing UI components.

## Checklist

- Use typography tokens (`textStyles.*`) for headers, labels, and helper text.
- Use spacing/gap tokens (`spacing.*`, `gap.*`, `layoutSpacing.*`) for layout.
- Use surface/card tokens (`card`, `sectionSurface`, `pageSurface`) for backgrounds and borders.
- Use color tokens (`colorCss.*`) for text, borders, and backgrounds.
- Match section headers to the bean detail `section-title-area` pattern unless told otherwise.

## If Tokens Are Missing

- Add a token upstream in `frontend/src/lib/ui/**` and use it.
- Avoid hardcoded values unless explicitly required; document the exception.

## Output Expectations

- Reference the token source used for key visual decisions.
- Keep styles consistent with existing component patterns.
