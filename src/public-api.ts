/**
 * Public API barrel for reuse/embedding scenarios.
 * This project is an Angular application, but this barrel provides a stable
 * export surface for host apps and future library packaging.
 */
export * from './app/builder-core';
export * from './app/builder/builder-templates.service';
export {
  BuilderPageComponent,
  BuilderPageComponent as FormlyBuilderComponent,
} from './app/builder/builder-page.component';

// Validation building blocks for renderer sub-packages and consumer apps
export {
  PREVIEW_VALIDATION_MESSAGES as BUILDER_VALIDATION_MESSAGES,
  previewShowError,
  createPreviewOptions,
} from './app/builder/preview/formly-preview-config';
export { resolveAsyncValidatorsForFields } from './app/builder-core/async-validators';
export { resolveCustomValidatorsForFields } from './app/builder-core/custom-validators';
