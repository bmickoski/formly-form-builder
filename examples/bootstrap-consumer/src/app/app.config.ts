import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';
import { provideFormlyBuilderBootstrap } from '@ngx-formly-builder/bootstrap';

/**
 * Minimal consumer configuration for Bootstrap rendering.
 */
export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(FormlyBootstrapModule, FormlyModule.forRoot(provideFormlyBuilderBootstrap()))],
};
