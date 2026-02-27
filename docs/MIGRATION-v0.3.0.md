# Migration Guide: v0.2.x -> v0.3.0

This release includes integration-surface changes to reduce collisions with host Formly apps.

## 1) Wrapper rename: `panel` -> `fb-panel`

Renderer packages now register the panel wrapper under `fb-panel`.

If you imported/exported Formly JSON with wrapper name `panel`, update it to `fb-panel` for this library.

### Before

```ts
wrappers: ['panel'];
```

### After

```ts
wrappers: ['fb-panel'];
```

Note: import logic still tolerates legacy `panel` wrapper names for compatibility.

## 2) `BUILDER_VALIDATION_MESSAGES` is now library-specific only

`BUILDER_VALIDATION_MESSAGES` no longer exports standard Formly message names:

- `required`
- `email`
- `minLength`
- `maxLength`
- `min`
- `max`
- `pattern`

It now only exports:

- `asyncUnique`
- `builderCustom`

If your host app used the previously exported standard messages, register them in your app-level Formly config.

## 3) Recommended host setup

Keep host-owned messages local to your app:

```ts
provideFormly({
  validationMessages: [
    { name: 'required', message: 'This field is required.' },
    { name: 'email', message: 'Please enter a valid email address.' },
  ],
});
```

Keep builder-specific messages from this library:

```ts
import { BUILDER_VALIDATION_MESSAGES } from '@ngx-formly-builder/core';
```
