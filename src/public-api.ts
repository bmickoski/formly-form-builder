/**
 * Public API barrel for reuse/embedding scenarios.
 * This project is an Angular application, but this barrel provides a stable
 * export surface for host apps and future library packaging.
 */
export * from './app/builder-core';
export * from './app/builder/builder-page.component';
export { BuilderPageComponent as FormlyBuilderComponent } from './app/builder/builder-page.component';
