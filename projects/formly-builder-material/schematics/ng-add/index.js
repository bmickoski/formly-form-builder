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

const GRID_STYLE_PATH = 'node_modules/@ngx-formly-builder/material/grid.css';
const APP_CONFIG_PATH = '/src/app/app.config.ts';

function addDependencies() {
  return (host, context) => {
    const pkgPath = '/package.json';
    if (!host.exists(pkgPath)) {
      throw new SchematicsException('Could not find package.json');
    }

    const dependencies = [
      { type: NodeDependencyType.Default, name: '@ngx-formly-builder/material', version: 'latest' },
      { type: NodeDependencyType.Default, name: '@ngx-formly-builder/core', version: 'latest' },
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

function addGridCssToAngularJson() {
  return (host, context) => {
    const angularJsonPath = '/angular.json';
    if (!host.exists(angularJsonPath)) {
      context.logger.warn('angular.json not found. Please add material grid.css manually.');
      return host;
    }

    let workspace;
    try {
      workspace = JSON.parse(host.read(angularJsonPath).toString('utf-8'));
    } catch {
      throw new SchematicsException('Could not parse angular.json');
    }

    const projects = workspace.projects || {};
    const projectEntries = Object.entries(projects);
    if (projectEntries.length === 0) {
      context.logger.warn('No projects found in angular.json. Skipping style update.');
      return host;
    }

    const appProjectEntry =
      projectEntries.find(([, config]) => config.projectType === 'application') || projectEntries[0];
    const [projectName, projectConfig] = appProjectEntry;
    const buildOptions = projectConfig?.architect?.build?.options;

    if (!buildOptions) {
      context.logger.warn(
        `No build options found for project "${projectName}". Please add ${GRID_STYLE_PATH} manually.`,
      );
      return host;
    }

    const styles = Array.isArray(buildOptions.styles) ? buildOptions.styles : [];
    if (!styles.includes(GRID_STYLE_PATH)) {
      styles.push(GRID_STYLE_PATH);
      buildOptions.styles = styles;
      host.overwrite(angularJsonPath, `${JSON.stringify(workspace, null, 2)}\n`);
      context.logger.info(`Added ${GRID_STYLE_PATH} to ${projectName} build styles.`);
    } else {
      context.logger.info(`${GRID_STYLE_PATH} already exists in ${projectName} build styles.`);
    }

    return host;
  };
}

function ensureImport(source, importText) {
  return source.includes(importText) ? source : `${importText}\n${source}`;
}

function addMaterialProviderToAppConfig() {
  return (host, context) => {
    if (!host.exists(APP_CONFIG_PATH)) {
      context.logger.warn(`${APP_CONFIG_PATH} not found. Please wire providers manually.`);
      return host;
    }

    let content = host.read(APP_CONFIG_PATH).toString('utf-8');
    if (content.includes('provideFormlyBuilderMaterial(')) {
      context.logger.info('Material builder provider already configured in app.config.ts.');
      return host;
    }

    content = ensureImport(content, "import { provideFormly } from '@ngx-formly/core';");
    content = ensureImport(content, "import { provideFormlyMaterial } from '@ngx-formly/material';");
    content = ensureImport(content, "import { provideFormlyBuilderMaterial } from '@ngx-formly-builder/material';");

    const providersArrayPattern = /providers\s*:\s*\[([\s\S]*?)\]/m;
    const providersMatch = content.match(providersArrayPattern);
    if (!providersMatch) {
      context.logger.warn('Could not locate providers array in app.config.ts. Please configure manually.');
      return host;
    }

    const providersBody = providersMatch[1];
    let updatedProvidersBody = providersBody;

    if (providersBody.includes('provideFormly(')) {
      if (!providersBody.includes('provideFormlyMaterial(')) {
        updatedProvidersBody = updatedProvidersBody.replace(
          /provideFormly\s*\(/,
          'provideFormly(provideFormlyMaterial(), ',
        );
      }
      if (!providersBody.includes('provideFormlyBuilderMaterial(')) {
        updatedProvidersBody = updatedProvidersBody.replace(
          /provideFormly\s*\(([\s\S]*?)\)/m,
          (match, args) => `provideFormly(${args.trim()}, provideFormlyBuilderMaterial())`,
        );
      }
    } else {
      const prefix = updatedProvidersBody.trim().length > 0 ? `${updatedProvidersBody.trim()},\n    ` : '\n    ';
      updatedProvidersBody = `${prefix}provideFormly(provideFormlyMaterial(), provideFormlyBuilderMaterial()),\n  `;
    }

    const updatedContent = content.replace(providersArrayPattern, `providers: [${updatedProvidersBody}]`);

    host.overwrite(APP_CONFIG_PATH, updatedContent);
    context.logger.info('Updated src/app/app.config.ts with material formly-builder providers.');
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
    context.logger.info('Review src/app/app.config.ts and angular.json styles after install.');
    context.logger.info('Run your app and validate Material renderer output.');
    context.logger.info('');
    return _host;
  };
}

function ngAdd(options = {}) {
  return chain([
    addDependencies(),
    addGridCssToAngularJson(),
    addMaterialProviderToAppConfig(),
    options.skipInstall ? noop() : installPackageJsonDependencies(),
    addUsageNote(),
    printNextSteps(),
  ]);
}

module.exports = {
  ngAdd,
};
