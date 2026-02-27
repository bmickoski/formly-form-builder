export { provideFormlyBuilderBootstrap } from './lib/provide-formly-builder-bootstrap';

export { FbPanelWrapperBsComponent } from './lib/panel-wrapper/fb-panel-wrapper-bs.component';
export { FbTabsBsTypeComponent } from './lib/tabs/fb-tabs-bs.type.component';
export { FbStepperBsTypeComponent } from './lib/stepper/fb-stepper-bs.type.component';
export { FbAccordionBsTypeComponent } from './lib/accordion/fb-accordion-bs.type.component';
export { FbRepeatBsTypeComponent } from './lib/repeat/fb-repeat-bs.type.component';

// Re-export shared validation utilities from core for consumer convenience
export {
  BUILDER_VALIDATION_MESSAGES,
  resolveAsyncValidatorsForFields,
  resolveCustomValidatorsForFields,
} from '@ngx-formly-builder/core';
