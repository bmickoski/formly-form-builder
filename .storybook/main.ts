import type { StorybookConfig } from '@storybook/angular';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const storybookDir = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx|mdx)'],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  webpackFinal: async (cfg) => {
    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      '@ngx-formly-builder/core': path.resolve(storybookDir, '../src/public-api.ts'),
      '@ngx-formly-builder/bootstrap': path.resolve(
        storybookDir,
        '../projects/formly-builder-bootstrap/src/public-api.ts',
      ),
      '@ngx-formly-builder/material': path.resolve(
        storybookDir,
        '../projects/formly-builder-material/src/public-api.ts',
      ),
    };
    return cfg;
  },
};

export default config;
