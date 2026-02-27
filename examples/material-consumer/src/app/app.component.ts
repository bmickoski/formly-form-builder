import { JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { builderToFormly } from '@ngx-formly-builder/core';

import { CONTACT_FORM_DOC, TABBED_FORM_DOC, CONDITIONAL_FORM_DOC } from './sample-forms';
import { FEEDBACK_FORMLY_JSON } from './sample-formly-json';

interface Demo {
  title: string;
  subtitle: string;
  badge?: string;
  form: FormGroup;
  model: Record<string, unknown>;
  fields: FormlyFieldConfig[];
  submitted: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, FormlyModule, MatButtonModule, MatCardModule, MatTabsModule, JsonPipe],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  demos: Demo[] = [];

  ngOnInit(): void {
    this.demos = [
      {
        title: 'Contact Form',
        subtitle: 'Simple form with text, email, select and textarea fields — loaded from a BuilderDocument.',
        badge: 'Path 1 · builderToFormly()',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(CONTACT_FORM_DOC),
        submitted: false,
      },
      {
        title: 'Tabs Layout',
        subtitle: 'Multi-tab registration form using the fb-tabs layout type — Personal and Account sections.',
        badge: 'Path 1 · fb-tabs',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(TABBED_FORM_DOC),
        submitted: false,
      },
      {
        title: 'Conditional Fields',
        subtitle: '2-column row layout (fb-col) with a select that appears only when a checkbox is checked.',
        badge: 'Path 1 · fb-col · visibleRule',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(CONDITIONAL_FORM_DOC),
        submitted: false,
      },
      {
        title: 'Direct Formly JSON',
        subtitle:
          'Raw FormlyFieldConfig[] used without builderToFormly() — this is what you copy from the builder\'s "Export JSON" button.',
        badge: 'Path 2 · no builderToFormly()',
        form: new FormGroup({}),
        model: {},
        fields: FEEDBACK_FORMLY_JSON,
        submitted: false,
      },
    ];
  }

  submit(demo: Demo): void {
    if (demo.form.valid) {
      demo.submitted = true;
    }
  }

  reset(demo: Demo): void {
    demo.form.reset();
    demo.model = {};
    demo.submitted = false;
  }
}
