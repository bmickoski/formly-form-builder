import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FormlyConfig, FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';

import { resolveAsyncValidatorsForFields } from '../builder-core/async-validators';
import { builderToFormly } from '../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../builder-core/dynamic-options';
import { BuilderDocument, OptionItem } from '../builder-core/model';
import type { FormlyConfigExtension } from '../builder-core/plugins';
import { createPreviewOptions } from '../builder/preview/formly-preview-config';

/**
 * Lightweight runtime viewer for BuilderDocument configs.
 *
 * Consumers should provide their Formly renderer package and the matching
 * builder renderer config, for example:
 * `provideFormlyCore([...withFormlyBootstrap(), provideFormlyBuilderBootstrap()])`
 * or
 * `provideFormlyCore([...withFormlyMaterial(), provideFormlyBuilderMaterial()])`.
 */
@Component({
  selector: 'app-formly-view, formly-view',
  imports: [ReactiveFormsModule, FormlyModule],
  template: `
    <form class="fb-formly-view" [formGroup]="form">
      <formly-form
        [form]="form"
        [model]="viewModel"
        [fields]="fields"
        [options]="options"
        (modelChange)="onModelChange($event)"
      />
    </form>
  `,
  styles: `
    :host {
      display: block;
    }

    .fb-formly-view {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormlyViewComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formlyConfig = inject(FormlyConfig);
  private readonly appliedExtensions = new WeakSet<object>();
  private rebuildRunId = 0;

  @Input() config: BuilderDocument | null = null;
  @Input() model: Record<string, unknown> | null = null;
  @Input() lookupRegistry: Record<string, OptionItem[]> = {};
  @Input() formlyExtensions: readonly FormlyConfigExtension[] = [];
  @Input() readOnly = false;
  @Output() readonly modelChange = new EventEmitter<Record<string, unknown>>();

  form = new FormGroup({});
  readonly options: FormlyFormOptions = createPreviewOptions();
  fields: FormlyFieldConfig[] = [];
  viewModel: Record<string, unknown> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.viewModel = normalizeModel(this.model);
    }
    if (changes['formlyExtensions']) {
      this.applyFormlyExtensions();
    }
    if (changes['config'] || changes['lookupRegistry'] || changes['readOnly']) {
      void this.rebuildFields();
    }
  }

  onModelChange(model: unknown): void {
    this.viewModel = normalizeModel(model as Record<string, unknown> | null);
    this.modelChange.emit(this.viewModel);
  }

  private applyFormlyExtensions(): void {
    for (const extension of this.formlyExtensions ?? []) {
      if (this.appliedExtensions.has(extension)) continue;
      this.formlyConfig.addConfig(extension as never);
      this.appliedExtensions.add(extension);
    }
  }

  private async rebuildFields(): Promise<void> {
    const runId = ++this.rebuildRunId;
    this.form = new FormGroup({});

    if (!this.config) {
      this.fields = [];
      this.cdr.markForCheck();
      return;
    }

    const fields = builderToFormly(this.config);
    if (this.readOnly) {
      applyReadOnly(fields);
    }

    await resolveDynamicOptionsForFields(fields, { lookupRegistry: this.lookupRegistry });
    if (runId !== this.rebuildRunId) return;
    resolveAsyncValidatorsForFields(fields, { lookupRegistry: this.lookupRegistry });
    if (runId !== this.rebuildRunId) return;

    this.fields = fields;
    this.cdr.markForCheck();
  }
}

function normalizeModel(model: Record<string, unknown> | null | undefined): Record<string, unknown> {
  return model && typeof model === 'object' ? model : {};
}

function applyReadOnly(fields: FormlyFieldConfig[]): void {
  const stack = [...fields];
  while (stack.length > 0) {
    const field = stack.pop() as FormlyFieldConfig;
    field.props = { ...(field.props ?? {}), disabled: true };

    if (field.expressions && 'props.disabled' in field.expressions) {
      const nextExpressions = { ...field.expressions };
      delete nextExpressions['props.disabled'];
      field.expressions = Object.keys(nextExpressions).length > 0 ? nextExpressions : undefined;
    }

    if (field.fieldArray && typeof field.fieldArray !== 'function') {
      stack.push(field.fieldArray);
    }
    for (const child of field.fieldGroup ?? []) stack.push(child);
  }
}
