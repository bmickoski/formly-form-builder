import { HostTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { join } from 'path';

const collectionPath = join(process.cwd(), 'projects/formly-builder-material/schematics/collection.json');

function createWorkspaceTree(runner: SchematicTestRunner): UnitTestTree {
  const tree = new UnitTestTree(new HostTree());

  tree.create(
    '/package.json',
    JSON.stringify(
      {
        name: 'consumer-app',
        version: '0.0.0',
        private: true,
        dependencies: {},
      },
      null,
      2,
    ),
  );

  tree.create(
    '/angular.json',
    JSON.stringify(
      {
        version: 1,
        projects: {
          consumer: {
            projectType: 'application',
            sourceRoot: 'src',
            architect: {
              build: {
                options: {
                  styles: ['src/styles.scss'],
                },
              },
            },
          },
        },
      },
      null,
      2,
    ),
  );

  tree.create(
    '/src/app/app.config.ts',
    [
      "import { ApplicationConfig } from '@angular/core';",
      "import { provideRouter } from '@angular/router';",
      '',
      'export const appConfig: ApplicationConfig = {',
      '  providers: [provideRouter([])],',
      '};',
      '',
    ].join('\n'),
  );

  return tree;
}

async function main(): Promise<void> {
  const runner = new SchematicTestRunner('@ngx-formly-builder/material', collectionPath);

  const result = await runner.runSchematic('ng-add', { skipInstall: true }, createWorkspaceTree(runner));

  const packageJson = JSON.parse(result.readContent('/package.json'));
  if (packageJson.dependencies['@ngx-formly-builder/material'] !== '^0.3.0') {
    throw new Error('Expected @ngx-formly-builder/material dependency to be added');
  }
  if (packageJson.dependencies['@ngx-formly-builder/core'] !== '^0.3.0') {
    throw new Error('Expected @ngx-formly-builder/core dependency to be added');
  }

  const angularJson = JSON.parse(result.readContent('/angular.json'));
  const styles = angularJson.projects.consumer.architect.build.options.styles as string[];
  for (const requiredStyle of [
    'src/styles.scss',
    'node_modules/@angular/material/prebuilt-themes/indigo-pink.css',
    'node_modules/@ngx-formly-builder/material/grid.css',
  ]) {
    if (!styles.includes(requiredStyle)) {
      throw new Error(`Expected angular.json styles to contain ${requiredStyle}`);
    }
  }

  const appConfig = result.readContent('/src/app/app.config.ts');
  for (const expectedText of [
    "import { importProvidersFrom } from '@angular/core';",
    "import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';",
    "import { FormlyModule } from '@ngx-formly/core';",
    "import { FormlyMaterialModule } from '@ngx-formly/material';",
    "import { provideFormlyBuilderMaterial } from '@ngx-formly-builder/material';",
    'provideAnimationsAsync(),',
    'importProvidersFrom(FormlyMaterialModule, FormlyModule.forRoot(provideFormlyBuilderMaterial())),',
  ]) {
    if (!appConfig.includes(expectedText)) {
      throw new Error(`Expected app.config.ts to contain: ${expectedText}`);
    }
  }

  const duplicateInput = createWorkspaceTree(runner);
  duplicateInput.overwrite(
    '/angular.json',
    JSON.stringify(
      {
        version: 1,
        projects: {
          consumer: {
            projectType: 'application',
            sourceRoot: 'src',
            architect: {
              build: {
                options: {
                  styles: [
                    'src/styles.scss',
                    'node_modules/@angular/material/prebuilt-themes/indigo-pink.css',
                    'node_modules/@ngx-formly-builder/material/grid.css',
                  ],
                },
              },
            },
          },
        },
      },
      null,
      2,
    ),
  );
  duplicateInput.overwrite(
    '/src/app/app.config.ts',
    [
      "import { ApplicationConfig, importProvidersFrom } from '@angular/core';",
      "import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';",
      "import { FormlyModule } from '@ngx-formly/core';",
      "import { FormlyMaterialModule } from '@ngx-formly/material';",
      "import { provideFormlyBuilderMaterial } from '@ngx-formly-builder/material';",
      '',
      'export const appConfig: ApplicationConfig = {',
      '  providers: [',
      '    provideAnimationsAsync(),',
      '    importProvidersFrom(FormlyMaterialModule, FormlyModule.forRoot(provideFormlyBuilderMaterial())),',
      '  ],',
      '};',
      '',
    ].join('\n'),
  );

  const secondResult = await runner.runSchematic('ng-add', { skipInstall: true }, duplicateInput);
  const secondAngularJson = JSON.parse(secondResult.readContent('/angular.json'));
  const secondStyles = secondAngularJson.projects.consumer.architect.build.options.styles as string[];
  if (
    secondStyles.filter((item) => item === 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css').length !==
    1
  ) {
    throw new Error('Expected Angular Material theme style to be added once');
  }
  if (secondStyles.filter((item) => item === 'node_modules/@ngx-formly-builder/material/grid.css').length !== 1) {
    throw new Error('Expected grid.css style to be added once');
  }

  const secondAppConfig = secondResult.readContent('/src/app/app.config.ts');
  if ((secondAppConfig.match(/provideAnimationsAsync\(\),/g) ?? []).length !== 1) {
    throw new Error('Expected provideAnimationsAsync() to be added once');
  }
  if (
    (
      secondAppConfig.match(
        /importProvidersFrom\(FormlyMaterialModule, FormlyModule\.forRoot\(provideFormlyBuilderMaterial\(\)\)\),/g,
      ) ?? []
    ).length !== 1
  ) {
    throw new Error('Expected Formly Material provider importProvidersFrom(...) to be added once');
  }

  console.log('material ng-add schematic tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
