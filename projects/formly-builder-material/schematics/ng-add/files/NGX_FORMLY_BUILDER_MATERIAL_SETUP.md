# @ngx-formly-builder/material Setup

`ng add @ngx-formly-builder/material` installed:

- `@ngx-formly-builder/material`
- `@ngx-formly-builder/core`
- `@ngx-formly/core`
- `@ngx-formly/material`
- `@angular/material`
- `@angular/cdk`
- `@angular/animations`

It also attempted to:

- add `node_modules/@angular/material/prebuilt-themes/indigo-pink.css` to your build styles
- add `node_modules/@ngx-formly-builder/material/grid.css` to your build styles
- wire `provideAnimationsAsync()` in `app.config.ts`
- wire `importProvidersFrom(FormlyMaterialModule, FormlyModule.forRoot(provideFormlyBuilderMaterial()))` in `app.config.ts`

If your app uses a custom setup, apply these steps manually.
