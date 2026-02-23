import { Injectable } from '@angular/core';

import { FieldNode, OptionItem, OptionsSource, OptionsSourceType } from '../../builder-core/model';
import { BuilderStore } from '../../builder-core/store';
import { addOptionItem, moveOptionItem, removeOptionItem, updateOptionItem } from './builder-inspector.options';

@Injectable({ providedIn: 'root' })
export class BuilderInspectorDataService {
  options(field: FieldNode | null, isChoiceField: boolean): OptionItem[] {
    return isChoiceField ? (field?.props.options ?? []) : [];
  }

  optionsSourceType(field: FieldNode | null, isChoiceField: boolean): OptionsSourceType {
    return isChoiceField ? (field?.props.optionsSource?.type ?? 'static') : 'static';
  }

  setOptionsSourceType(
    store: BuilderStore,
    field: FieldNode | null,
    isChoiceField: boolean,
    type: OptionsSourceType,
  ): void {
    if (!field || !isChoiceField) return;
    if (type === 'static') {
      store.updateNodeProps(field.id, { optionsSource: undefined });
      return;
    }
    const current: Partial<OptionsSource> = field.props.optionsSource ?? {};
    const next: OptionsSource = {
      type,
      url: current.url,
      lookupKey: current.lookupKey,
      listPath: current.listPath,
      labelKey: current.labelKey,
      valueKey: current.valueKey,
    };
    store.updateNodeProps(field.id, { optionsSource: next });
  }

  updateOptionsSource(
    store: BuilderStore,
    field: FieldNode | null,
    isChoiceField: boolean,
    sourceType: OptionsSourceType,
    patch: Partial<OptionsSource>,
  ): void {
    if (!field || !isChoiceField || sourceType === 'static') return;
    const current = field.props.optionsSource ?? { type: sourceType };
    store.updateNodePropsGrouped(field.id, { optionsSource: { ...current, ...patch } }, `${field.id}:options-source`);
  }

  addOption(store: BuilderStore, field: FieldNode | null, isChoiceField: boolean): void {
    if (!field || !isChoiceField) return;
    store.updateNodeProps(field.id, { options: addOptionItem(field.props.options) });
  }

  updateOption(
    store: BuilderStore,
    field: FieldNode | null,
    isChoiceField: boolean,
    index: number,
    patch: Partial<OptionItem>,
  ): void {
    if (!field || !isChoiceField) return;
    const next = updateOptionItem(field.props.options, index, patch);
    if (!next) return;
    store.updateNodePropsGrouped(field.id, { options: next }, `${field.id}:options`);
  }

  removeOption(store: BuilderStore, field: FieldNode | null, isChoiceField: boolean, index: number): void {
    if (!field || !isChoiceField) return;
    const next = removeOptionItem(field.props.options, index);
    if (!next) return;
    store.updateNodeProps(field.id, { options: next });
  }

  moveOption(
    store: BuilderStore,
    field: FieldNode | null,
    isChoiceField: boolean,
    index: number,
    direction: -1 | 1,
  ): void {
    if (!field || !isChoiceField) return;
    const next = moveOptionItem(field.props.options, index, direction);
    if (!next) return;
    store.updateNodeProps(field.id, { options: next });
  }
}
