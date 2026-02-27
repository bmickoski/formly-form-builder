import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormlyBuilderComponent, builderToFormly, type BuilderDocument } from '@ngx-formly-builder/core';
import type { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormlyBuilderComponent, JsonPipe],
  template: `
    <div class="shell">
      <h1>ngx-formly-builder Material Demo</h1>
      <p>Build your form, then inspect live output JSON below.</p>

      <formly-builder [autosave]="false" (configChange)="onConfigChange($event)" />

      <section class="output">
        <h2>FormlyFieldConfig[] Output</h2>
        <pre>{{ formlyFields | json }}</pre>
      </section>
    </div>
  `,
})
export class AppComponent {
  formlyFields: FormlyFieldConfig[] = [];

  onConfigChange(doc: BuilderDocument): void {
    this.formlyFields = builderToFormly(doc);
  }
}
