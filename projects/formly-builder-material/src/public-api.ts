export { provideFormlyBuilderMaterial } from './lib/provide-formly-builder-material';

export { FbPanelWrapperMatComponent } from './lib/panel-wrapper/fb-panel-wrapper-mat.component';
export { FbTabsMatTypeComponent } from './lib/tabs/fb-tabs-mat.type.component';
export { FbStepperMatTypeComponent } from './lib/stepper/fb-stepper-mat.type.component';
export { FbAccordionMatTypeComponent } from './lib/accordion/fb-accordion-mat.type.component';
export { FbRepeatMatTypeComponent } from './lib/repeat/fb-repeat-mat.type.component';

// Re-export shared validation utilities from core for consumer convenience
export {
  BUILDER_VALIDATION_MESSAGES,
  resolveAsyncValidatorsForFields,
  resolveCustomValidatorsForFields,
} from '@ngx-formly-builder/core';
