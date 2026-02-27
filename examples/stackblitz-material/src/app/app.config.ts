import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { provideFormlyBuilderMaterial } from '@ngx-formly-builder/material';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    importProvidersFrom(FormlyMaterialModule, FormlyModule.forRoot(provideFormlyBuilderMaterial())),
  ],
};
