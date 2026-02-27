import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { provideFormlyBuilderMaterial } from '@ngx-formly-builder/material';

/**
 * Minimal app config that wires up ngx-formly with Angular Material
 * and the formly-builder renderer package.
 *
 * This is the only setup a consumer needs — no manual type/wrapper registration.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    importProvidersFrom(FormlyMaterialModule, FormlyModule.forRoot(provideFormlyBuilderMaterial())),
  ],
};
