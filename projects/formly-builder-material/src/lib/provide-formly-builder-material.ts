import { Validators } from '@angular/forms';
import { ConfigOption } from '@ngx-formly/core';

import { BUILDER_VALIDATION_MESSAGES } from '@ngx-formly-builder/core';
import { FbPanelWrapperMatComponent } from './panel-wrapper/fb-panel-wrapper-mat.component';
import { FbTabsMatTypeComponent } from './tabs/fb-tabs-mat.type.component';
import { FbStepperMatTypeComponent } from './stepper/fb-stepper-mat.type.component';
import { FbAccordionMatTypeComponent } from './accordion/fb-accordion-mat.type.component';
import { FbRepeatMatTypeComponent } from './repeat/fb-repeat-mat.type.component';

/**
 * Returns a Formly ConfigOption that registers all layout types and wrappers
 * needed to render a BuilderDocument in an Angular Material application.
 *
 * @example
 * // app.config.ts
 * provideFormly(provideFormlyMaterial(), provideFormlyBuilderMaterial())
 */
export function provideFormlyBuilderMaterial(): ConfigOption {
  return {
    types: [
      { name: 'fb-tabs', component: FbTabsMatTypeComponent },
      { name: 'fb-stepper', component: FbStepperMatTypeComponent },
      { name: 'fb-accordion', component: FbAccordionMatTypeComponent },
      { name: 'fb-repeat', component: FbRepeatMatTypeComponent },
    ],
    wrappers: [{ name: 'fb-panel', component: FbPanelWrapperMatComponent }],
    validators: [{ name: 'email', validation: Validators.email }],
    validationMessages: [...BUILDER_VALIDATION_MESSAGES] as ConfigOption['validationMessages'],
  };
}
