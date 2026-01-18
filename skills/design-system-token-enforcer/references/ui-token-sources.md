# UI Token Sources (espresso-engineered-1)

## Primary token files

- `frontend/src/lib/ui/foundations/typography.ts` (textStyles, font families, sizes, line heights)
- `frontend/src/lib/ui/foundations/spacing.ts` (spacing, gap, layoutSpacing)
- `frontend/src/lib/ui/foundations/color.ts` (colorCss)
- `frontend/src/lib/ui/foundations/radius.ts`
- `frontend/src/lib/ui/foundations/elevation.ts`
- `frontend/src/lib/ui/components/card.ts` (sectionSurface, pageSurface, recordCard)
- `frontend/src/lib/ui/components/form.ts` (formSection, editableField, formLabel)
- `frontend/src/lib/ui/components/icon-button.ts` (IconButton tokens)
- `frontend/src/lib/ui/components/button.ts` (Ghost/primary button tokens)

## Reference patterns to match

- Bean detail section header: `frontend/src/routes/beans/[id]/+page.svelte`
  - Uses `.section-header` and `.section-title-area` layout and spacing.
  - Match header structure and spacing for new section components.

## Usage notes

- Prefer tokens over hardcoded values; only hardcode when no token exists.
- If no token exists for a needed value, add it to the appropriate `frontend/src/lib/ui/**` token file.
