# @ngx-formly-builder/core Setup

`ng add @ngx-formly-builder/core` installed the package and recommended dependencies.

Use this quick embed:

```html
<formly-builder (configChange)="onConfigChange($event)" />
```

```ts
import { builderToFormly, type BuilderDocument } from '@ngx-formly-builder/core';

onConfigChange(doc: BuilderDocument): void {
  const fields = builderToFormly(doc);
  // Persist doc or use fields for runtime rendering.
}
```

Full guide: `docs/features/getting-started-5-min.md`
