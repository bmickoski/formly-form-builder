import { Injectable } from '@angular/core';

import { checkAsyncUniqueValue } from '../../builder-core/async-validators';
import { AsyncUniqueSourceType, AsyncUniqueValidator, FieldNode } from '../../builder-core/model';
import { BuilderStore } from '../../builder-core/store';
import {
  applyValidatorPreset,
  defaultParamsForValidatorPreset,
  ValidatorPresetDefinition,
  validatorPresetDefinitionsForFieldKind,
} from '../../builder-core/validation-presets';
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
    lookupRegistry: Record<string, { label: string; value: string }[]>,
  ): Promise<{ state: AsyncTestState; message: string }> {
    const value = sample.trim();
    if (!value) return { state: 'error', message: 'Enter a sample value to test.' };
    const result = await checkAsyncUniqueValue(config, value, { lookupRegistry });
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

  validatorPresetDefinitionsForField(
    field: FieldNode | null,
    definitions: readonly ValidatorPresetDefinition[],
  ): ValidatorPresetDefinition[] {
    if (!field) return [];
    return validatorPresetDefinitionsForFieldKind(field.fieldKind, definitions);
  }

  selectedValidatorPresetId(field: FieldNode | null): string {
    return field?.validators.presetId ?? '';
  }

  validatorPresetParamValue(field: FieldNode | null, key: string): string | number | boolean | '' {
    return field?.validators.presetParams?.[key] ?? '';
  }

  setValidatorPreset(store: BuilderStore, field: FieldNode | null, presetId: string): void {
    if (!field) return;
    const trimmed = presetId.trim();
    if (!trimmed) {
      store.updateNodeValidators(field.id, { presetId: undefined, presetParams: undefined });
      return;
    }

    const definition = this.validatorPresetDefinitionsForField(field, store.validatorPresetDefinitions()).find(
      (item) => item.id === trimmed,
    );
    if (!definition) return;

    const params = defaultParamsForValidatorPreset(definition);
    const resolved = applyValidatorPreset(definition, params);
    store.updateNodeValidators(field.id, {
      ...resolved,
      presetId: definition.id,
      presetParams: params,
    });
  }

  setValidatorPresetParam(
    store: BuilderStore,
    field: FieldNode | null,
    param: { key: string; type: 'string' | 'number' | 'boolean' },
    value: unknown,
  ): void {
    if (!field) return;
    const presetId = field.validators.presetId?.trim();
    if (!presetId) return;

    const definition = this.validatorPresetDefinitionsForField(field, store.validatorPresetDefinitions()).find(
      (item) => item.id === presetId,
    );
    if (!definition) return;

    const nextParams = { ...(field.validators.presetParams ?? {}) };
    const coerced = this.coercePresetParamValue(param.type, value);
    if (coerced === undefined) delete nextParams[param.key];
    else nextParams[param.key] = coerced;

    const resolved = applyValidatorPreset(definition, nextParams);
    store.updateNodeValidatorsGrouped(
      field.id,
      {
        ...resolved,
        presetId,
        presetParams: nextParams,
      },
      `${field.id}:validatorPreset:${param.key}`,
    );
  }

  private coercePresetParamValue(
    type: 'string' | 'number' | 'boolean',
    value: unknown,
  ): string | number | boolean | undefined {
    if (type === 'boolean') return !!value;
    if (type === 'number') {
      if (value === '' || value === null || value === undefined) return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    }
    const text = String(value ?? '').trim();
    return text.length > 0 ? text : undefined;
  }
}
