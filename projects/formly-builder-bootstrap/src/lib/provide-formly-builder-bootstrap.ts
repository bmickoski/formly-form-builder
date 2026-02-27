import { Validators } from '@angular/forms';
import { ConfigOption } from '@ngx-formly/core';

import { BUILDER_VALIDATION_MESSAGES } from '@ngx-formly-builder/core';
import { FbPanelWrapperBsComponent } from './panel-wrapper/fb-panel-wrapper-bs.component';
import { FbTabsBsTypeComponent } from './tabs/fb-tabs-bs.type.component';
import { FbStepperBsTypeComponent } from './stepper/fb-stepper-bs.type.component';
import { FbAccordionBsTypeComponent } from './accordion/fb-accordion-bs.type.component';
import { FbRepeatBsTypeComponent } from './repeat/fb-repeat-bs.type.component';

/**
 * Returns a Formly ConfigOption that registers all layout types and wrappers
 * needed to render a BuilderDocument in a Bootstrap 5 application.
 *
 * @example
 * // app.config.ts
 * provideFormly(provideFormlyBootstrap(), provideFormlyBuilderBootstrap())
 */
export function provideFormlyBuilderBootstrap(): ConfigOption {
  return {
    types: [
      { name: 'fb-tabs', component: FbTabsBsTypeComponent },
      { name: 'fb-stepper', component: FbStepperBsTypeComponent },
      { name: 'fb-accordion', component: FbAccordionBsTypeComponent },
      { name: 'fb-repeat', component: FbRepeatBsTypeComponent },
    ],
    wrappers: [{ name: 'panel', component: FbPanelWrapperBsComponent }],
    validators: [{ name: 'email', validation: Validators.email }],
    validationMessages: [...BUILDER_VALIDATION_MESSAGES] as ConfigOption['validationMessages'],
  };
}
