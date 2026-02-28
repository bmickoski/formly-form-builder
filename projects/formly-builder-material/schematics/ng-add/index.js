'use strict';

const {
  apply,
  chain,
  mergeWith,
  noop,
  url,
  template,
  move,
  SchematicsException,
} = require('@angular-devkit/schematics');
const {
  NodeDependencyType,
  addPackageJsonDependency,
  installPackageJsonDependencies,
} = require('@schematics/angular/utility/dependencies');
const { strings } = require('@angular-devkit/core');

const packageVersion = require('../../package.json').version;

const MATERIAL_THEME_PATH = 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
const GRID_STYLE_PATH = 'node_modules/@ngx-formly-builder/material/grid.css';

function readJson(host, path) {
  if (!host.exists(path)) {
    throw new SchematicsException(`Could not find ${path}`);
  }

  try {
    return JSON.parse(host.read(path).toString('utf-8'));
  } catch {
    throw new SchematicsException(`Could not parse ${path}`);
  }
}

function getPrimaryApplicationProject(workspace) {
  const projects = workspace.projects || {};
  const projectEntries = Object.entries(projects);
  if (projectEntries.length === 0) {
    throw new SchematicsException('No projects found in angular.json');
  }

  const preferred = projectEntries.find(([, config]) => config.projectType === 'application');
  return preferred || projectEntries[0];
}

function getAppConfigPath(projectConfig) {
  const sourceRoot = projectConfig?.sourceRoot;
  if (!sourceRoot) return null;
  return `/${sourceRoot}/app/app.config.ts`;
}

function ensureArrayItem(items, value) {
  if (!Array.isArray(items)) return [value];
  return items.includes(value) ? items : [...items, value];
}

function addDependencies() {
  return (host, context) => {
    const pkgPath = '/package.json';
    if (!host.exists(pkgPath)) {
      throw new SchematicsException('Could not find package.json');
    }

    const dependencies = [
      { type: NodeDependencyType.Default, name: '@ngx-formly-builder/material', version: `^${packageVersion}` },
      { type: NodeDependencyType.Default, name: '@ngx-formly-builder/core', version: `^${packageVersion}` },
      { type: NodeDependencyType.Default, name: '@ngx-formly/core', version: '^7.0.0' },
      { type: NodeDependencyType.Default, name: '@ngx-formly/material', version: '^7.0.0' },
      { type: NodeDependencyType.Default, name: '@angular/material', version: '^21.0.0' },
      { type: NodeDependencyType.Default, name: '@angular/cdk', version: '^21.0.0' },
      { type: NodeDependencyType.Default, name: '@angular/animations', version: '^21.0.0' },
    ];

    dependencies.forEach((dep) => addPackageJsonDependency(host, dep));
    context.logger.info('Added dependencies for @ngx-formly-builder/material');
    return host;
  };
}

function addStylesToAngularJson() {
  return (host, context) => {
    const angularJsonPath = '/angular.json';
    if (!host.exists(angularJsonPath)) {
      context.logger.warn('angular.json not found. Please add Angular Material theme and grid.css manually.');
      return host;
    }

    const workspace = readJson(host, angularJsonPath);
    const [projectName, projectConfig] = getPrimaryApplicationProject(workspace);
    const buildOptions = projectConfig?.architect?.build?.options;

    if (!buildOptions) {
      context.logger.warn(
        `No build options found for project "${projectName}". Please add styles manually to angular.json.`,
      );
      return host;
    }

    let styles = Array.isArray(buildOptions.styles) ? buildOptions.styles : [];
    styles = ensureArrayItem(styles, MATERIAL_THEME_PATH);
    styles = ensureArrayItem(styles, GRID_STYLE_PATH);
    buildOptions.styles = styles;

    host.overwrite(angularJsonPath, `${JSON.stringify(workspace, null, 2)}\n`);
    context.logger.info(`Updated ${projectName} build styles with Angular Material theme and grid.css.`);
    return host;
  };
}

function ensureImport(source, importText) {
  return source.includes(importText) ? source : `${importText}\n${source}`;
}

function ensureProvider(source, providerText) {
  if (source.includes(providerText)) return source;

  const providersArrayPattern = /providers\s*:\s*\[([\s\S]*?)\]/m;
  const providersMatch = source.match(providersArrayPattern);
  if (!providersMatch) {
    return source;
  }

  const providersBody = providersMatch[1];
  const trimmedBody = providersBody.trim();
  const nextBody = trimmedBody.length > 0 ? `${trimmedBody},\n    ${providerText}\n  ` : `\n    ${providerText}\n  `;

  return source.replace(providersArrayPattern, `providers: [${nextBody}]`);
}

function addMaterialProvidersToAppConfig() {
  return (host, context) => {
    const angularJsonPath = '/angular.json';
    if (!host.exists(angularJsonPath)) {
      context.logger.warn('angular.json not found. Could not resolve app.config.ts location.');
      return host;
    }

    const workspace = readJson(host, angularJsonPath);
    const [projectName, projectConfig] = getPrimaryApplicationProject(workspace);
    const appConfigPath = getAppConfigPath(projectConfig);

    if (!appConfigPath || !host.exists(appConfigPath)) {
      context.logger.warn(`Could not find app.config.ts for project "${projectName}". Please wire providers manually.`);
      return host;
    }

    let content = host.read(appConfigPath).toString('utf-8');
    if (content.includes('provideFormlyBuilderMaterial(')) {
      context.logger.info('Material builder provider already configured in app.config.ts.');
      return host;
    }

    content = ensureImport(content, "import { importProvidersFrom } from '@angular/core';");
    content = ensureImport(
      content,
      "import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';",
    );
    content = ensureImport(content, "import { FormlyModule } from '@ngx-formly/core';");
    content = ensureImport(content, "import { FormlyMaterialModule } from '@ngx-formly/material';");
    content = ensureImport(content, "import { provideFormlyBuilderMaterial } from '@ngx-formly-builder/material';");

    const withAnimations = ensureProvider(content, 'provideAnimationsAsync(),');
    const withFormly = ensureProvider(
      withAnimations,
      'importProvidersFrom(FormlyMaterialModule, FormlyModule.forRoot(provideFormlyBuilderMaterial())),',
    );

    if (withFormly === content) {
      context.logger.warn(`Could not locate providers array in ${appConfigPath}. Please configure manually.`);
      return host;
    }

    host.overwrite(appConfigPath, withFormly);
    context.logger.info(`Updated ${appConfigPath} with Angular Material + formly-builder providers.`);
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
    context.logger.info('@ngx-formly-builder/material installed.');
    context.logger.info('Added Angular Material theme and builder grid.css to angular.json.');
    context.logger.info('Updated app.config.ts with provideAnimationsAsync() and Formly Material providers.');
    context.logger.info('Run your app and validate Material renderer output.');
    context.logger.info('');
    return _host;
  };
}

function ngAdd(options = {}) {
  return chain([
    addDependencies(),
    addStylesToAngularJson(),
    addMaterialProvidersToAppConfig(),
    options.skipInstall ? noop() : installPackageJsonDependencies(),
    addUsageNote(),
    printNextSteps(),
  ]);
}

module.exports = {
  ngAdd,
};
