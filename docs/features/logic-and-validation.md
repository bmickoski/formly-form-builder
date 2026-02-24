# Logic and Validation

## Conditional Rendering

Each field supports two conditional dimensions:

- Visibility (`visibleRule`, `visibleExpression`)
- Enabled state (`enabledRule`, `enabledExpression`)

### Rule precedence

Advanced expressions override simple rules when set:

- `visibleExpression` overrides `visibleRule`
- `enabledExpression` overrides `enabledRule`

### Expression context

Expressions can use:

- `model`
- `data`
- `value`

Example:

```txt
model?.role !== 'readonly' && !!model?.canEdit
```

## Custom Validation

Custom validation expression must assign `valid`:

- `true` => valid
- `false` => invalid (uses fallback message)
- string => invalid with custom message

Example:

```txt
valid = String(value ?? '').trim().length >= 3 ? true : 'Minimum 3 characters';
```

## Async Uniqueness

Async unique validation supports:

- lookup source
- URL source

It can be combined with custom validation.

## Diagnostics Integration

Diagnostics reports:

- duplicate field keys
- invalid/missing rule dependencies
- unsafe or invalid expressions

Export is blocked when diagnostics contain errors.
