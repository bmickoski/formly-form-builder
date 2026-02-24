import { Injectable } from '@angular/core';

import { checkAsyncUniqueValue } from '../../builder-core/async-validators';
import { DEFAULT_LOOKUP_REGISTRY } from '../../builder-core/lookup-registry';
import { AsyncUniqueSourceType, AsyncUniqueValidator, FieldNode } from '../../builder-core/model';
import { BuilderStore } from '../../builder-core/store';
import { AsyncTestState } from './builder-inspector.constants';

@Injectable({ providedIn: 'root' })
export class BuilderInspectorValidationService {
  asyncUnique(field: FieldNode | null): AsyncUniqueValidator | null {
    return field?.validators.asyncUnique ?? null;
  }

  enableAsyncUnique(store: BuilderStore, field: FieldNode | null, enabled: boolean): void {
    if (!field) return;
    if (!enabled) {
      store.updateNodeValidators(field.id, { asyncUnique: undefined });
      return;
    }
    const next: AsyncUniqueValidator = {
      sourceType: 'lookup',
      lookupKey: 'countries',
      caseSensitive: false,
      message: 'Value must be unique',
    };
    store.updateNodeValidators(field.id, { asyncUnique: next });
  }

  setAsyncUniqueSource(store: BuilderStore, field: FieldNode | null, sourceType: AsyncUniqueSourceType): void {
    if (!field?.validators.asyncUnique) return;
    store.updateNodeValidators(field.id, { asyncUnique: { ...field.validators.asyncUnique, sourceType } });
  }

  updateAsyncUnique(store: BuilderStore, field: FieldNode | null, patch: Partial<AsyncUniqueValidator>): void {
    if (!field?.validators.asyncUnique) return;
    store.updateNodeValidatorsGrouped(
      field.id,
      { asyncUnique: { ...field.validators.asyncUnique, ...patch } },
      `${field.id}:async-unique`,
    );
  }

  async runAsyncUniqueTest(
    config: AsyncUniqueValidator,
    sample: string,
  ): Promise<{ state: AsyncTestState; message: string }> {
    const value = sample.trim();
    if (!value) return { state: 'error', message: 'Enter a sample value to test.' };
    const result = await checkAsyncUniqueValue(config, value, { lookupRegistry: DEFAULT_LOOKUP_REGISTRY });
    if (result.reason === 'duplicate') return { state: 'error', message: 'Duplicate found in source.' };
    if (result.reason === 'source-error') {
      return { state: 'error', message: 'Could not validate source. Check URL/lookup settings.' };
    }
    return { state: 'success', message: 'Value is unique.' };
  }

  customValidationEnabled(field: FieldNode | null): boolean {
    return !!field?.validators.customExpression?.trim();
  }

  setCustomValidationEnabled(store: BuilderStore, field: FieldNode | null, enabled: boolean): void {
    if (!field) return;
    if (!enabled) {
      store.updateNodeValidators(field.id, { customExpression: undefined, customExpressionMessage: undefined });
      return;
    }
    store.updateNodeValidators(field.id, {
      customExpression: field.validators.customExpression?.trim() || 'valid = true;',
      customExpressionMessage: field.validators.customExpressionMessage || 'Custom validation failed.',
    });
  }

  customValidationExpression(field: FieldNode | null): string {
    return field?.validators.customExpression ?? '';
  }

  customValidationMessage(field: FieldNode | null): string {
    return field?.validators.customExpressionMessage ?? 'Custom validation failed.';
  }

  setCustomValidationExpression(store: BuilderStore, field: FieldNode | null, value: string): void {
    if (!field) return;
    store.updateNodeValidatorsGrouped(field.id, { customExpression: value }, `${field.id}:customExpression`);
  }

  setCustomValidationMessage(store: BuilderStore, field: FieldNode | null, value: string): void {
    if (!field) return;
    store.updateNodeValidatorsGrouped(
      field.id,
      { customExpressionMessage: value },
      `${field.id}:customExpressionMessage`,
    );
  }
}
