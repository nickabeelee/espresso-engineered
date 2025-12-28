# iOS/iPadOS Input Hints Reference

## Keyboard Selection Cheatsheet
- Numeric integer: `type="number"` + `inputmode="numeric"`
- Numeric decimal: `type="number"` + `inputmode="decimal"`
- Email: `type="email"` + `autocomplete="email"` + `autocapitalize="none"` + `autocorrect="off"`
- URL: `type="url"` + `autocomplete="url"` + `autocapitalize="none"` + `autocorrect="off"`
- Phone: `type="tel"` + `autocomplete="tel"`
- Search: `type="search"` + `enterkeyhint="search"`

## Autocomplete Tokens (common)
- Name: `given-name`, `family-name`, `name`
- Username: `username`
- Password: `current-password`, `new-password`
- Email: `email`
- Phone: `tel`
- Address: `address-line1`, `address-line2`, `postal-code`, `country`, `address-level1`, `address-level2`

## Autocapitalize/Autocorrect
- Disable for: emails, URLs, handles, IDs, coupon codes, serials.
- Allow for: freeform notes, reflections, tasting notes.

## Enter Key Hints
- `enterkeyhint="next"` for multi-field forms.
- `enterkeyhint="done"` for the last field.
- `enterkeyhint="search"` for filters/search.
- `enterkeyhint="send"` for chat-like inputs.

## Notes
- `inputmode` is useful even when `type="number"` is present to stabilize iOS keyboard choice.
- Keep changes to attribute-level adjustments only; do not alter layout.
