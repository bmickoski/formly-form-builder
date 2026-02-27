# Getting Started In 5 Minutes

This is the fastest path to embed the builder and receive `FormlyFieldConfig[]`.

## 1. Install

```bash
npm install @ngx-formly-builder/core @ngx-formly/core @ngx-formly/material @angular/material
```

Alternative:

```bash
ng add @ngx-formly-builder/core
```

## 2. Render `<formly-builder>`

```ts
import { Component } from '@angular/core';
import { FormlyBuilderComponent, builderToFormly, type BuilderDocument } from '@ngx-formly-builder/core';
import type { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-builder-host',
  standalone: true,
  imports: [FormlyBuilderComponent],
  template: `
    <formly-builder
      [config]="config"
      [autosave]="true"
      autosaveKey="my-app:builder:draft"
      (configChange)="onConfigChange($event)"
      (autosaveError)="onAutosaveError($event)"
    />
  `,
})
export class BuilderHostComponent {
  config: BuilderDocument | null = null;
  formlyFields: FormlyFieldConfig[] = [];

  onConfigChange(doc: BuilderDocument): void {
    this.config = doc;
    this.formlyFields = builderToFormly(doc);
  }

  onAutosaveError(event: unknown): void {
    console.error('Autosave failed', event);
  }
}
```

## 3. Persist output

- Use `(configChange)` payload for backend/API persistence.
- It is a public export and includes `selectedId: null` by design.

## 4. Run full consumer examples

Use the repo examples if you want a complete app flow first:

```bash
npm run build:libs
npm run start:example:bootstrap
npm run start:example:material
```

- Bootstrap example: `examples/bootstrap-consumer` (`http://localhost:4204`)
- Material example: `examples/material-consumer` (`http://localhost:4203`)
