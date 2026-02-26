'use strict';

const {
  apply,
  chain,
  mergeWith,
  noop,
  url,
  template,
  move,
  Rule,
  SchematicsException,
} = require('@angular-devkit/schematics');
const {
  NodeDependencyType,
  addPackageJsonDependency,
  installPackageJsonDependencies,
} = require('@schematics/angular/utility/dependencies');
const { strings } = require('@angular-devkit/core');

function addDependencies() {
  return (host, context) => {
    const pkgPath = '/package.json';
    if (!host.exists(pkgPath)) {
      throw new SchematicsException('Could not find package.json');
    }

    const dependencies = [
      { type: NodeDependencyType.Default, name: '@ngx-formly-builder/core', version: 'latest' },
      { type: NodeDependencyType.Default, name: '@ngx-formly/core', version: '^7.0.0' },
      { type: NodeDependencyType.Default, name: '@ngx-formly/material', version: '^7.0.0' },
      { type: NodeDependencyType.Default, name: '@angular/material', version: '^21.0.0' },
    ];

    dependencies.forEach((dep) => addPackageJsonDependency(host, dep));
    context.logger.info('Added dependencies for @ngx-formly-builder/core');
    return host;
  };
}

function addUsageNote() {
  const sourceTemplates = url('./files');
  const sourceParametrizedTemplates = apply(sourceTemplates, [
    template({
      ...strings,
    }),
    move('/'),
  ]);

  return mergeWith(sourceParametrizedTemplates);
}

function printNextSteps() {
  return (_host, context) => {
    context.logger.info('');
    context.logger.info('@ngx-formly-builder/core installed.');
    context.logger.info('Next steps:');
    context.logger.info('1) Import FormlyBuilderComponent in your standalone host component.');
    context.logger.info('2) Render <formly-builder (configChange)="onConfigChange($event)" />.');
    context.logger.info('3) Convert BuilderDocument to FormlyFieldConfig[] with builderToFormly.');
    context.logger.info('See docs/features/getting-started-5-min.md for a full example.');
    context.logger.info('');
    return _host;
  };
}

function ngAdd(options = {}) {
  return chain([
    addDependencies(),
    options.skipInstall ? noop() : installPackageJsonDependencies(),
    addUsageNote(),
    printNextSteps(),
  ]);
}

module.exports = {
  ngAdd,
};
