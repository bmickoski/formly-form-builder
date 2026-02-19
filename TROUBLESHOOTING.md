# Troubleshooting

## Preview opens but fields are missing

Check browser console for Formly errors like:

- `The type "input" could not be found`

Expected:

- Material preview registers Material Formly config.
- Bootstrap preview registers Bootstrap Formly config.

If stale bundle behavior appears, hard refresh:

- `Ctrl + F5`

## Bootstrap vs Material looks wrong

Preview title shows active renderer `(Bootstrap|Material)`.
If output still looks mixed:

1. Hard refresh.
2. Re-open preview after changing renderer.
3. Verify exported Formly JSON `className` values match renderer.

## Drag/drop odd behavior

- Palette inserts happen via explicit `Drop inside ...` targets.
- `row` accepts only columns.
- If a drop is ignored, verify target container type is valid for dragged node type.

## Import Builder JSON fails

Builder import goes through parser/sanitizer.
Common reasons:

- malformed JSON
- root not usable
- unknown node types

Sanitizer will recover some cases (root/span/selection), but invalid shapes can still be rejected.

## Tests not running in CI/local

Use:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

If ChromeHeadless unavailable on machine, install Chrome/Chromium first.
