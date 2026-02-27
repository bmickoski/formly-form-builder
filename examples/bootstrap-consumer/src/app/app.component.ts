import { JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { builderToFormly } from '@ngx-formly-builder/core';

import { CONDITIONAL_FORM_DOC, CONTACT_FORM_DOC, TABBED_FORM_DOC } from './sample-forms';
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
  imports: [ReactiveFormsModule, FormlyModule, JsonPipe],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  demos: Demo[] = [];
  activeTabIndex = 0;

  ngOnInit(): void {
    this.demos = [
      {
        title: 'Contact Form',
        subtitle: 'Simple form with text, email, select and textarea fields loaded from a BuilderDocument.',
        badge: 'Path 1 - builderToFormly()',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(CONTACT_FORM_DOC),
        submitted: false,
      },
      {
        title: 'Tabs Layout',
        subtitle: 'Multi-tab registration form using fb-tabs with Personal and Account sections.',
        badge: 'Path 1 - fb-tabs',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(TABBED_FORM_DOC),
        submitted: false,
      },
      {
        title: 'Conditional Fields',
        subtitle: 'Two-column row layout with a select shown only when newsletter is checked.',
        badge: 'Path 1 - fb-col - visibleRule',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(CONDITIONAL_FORM_DOC),
        submitted: false,
      },
      {
        title: 'Direct Formly JSON',
        subtitle: 'Raw FormlyFieldConfig[] used directly with no builderToFormly conversion.',
        badge: 'Path 2 - no builderToFormly()',
        form: new FormGroup({}),
        model: {},
        fields: FEEDBACK_FORMLY_JSON,
        submitted: false,
      },
    ];
  }

  submit(demo: Demo): void {
    if (demo.form.valid) demo.submitted = true;
  }

  reset(demo: Demo): void {
    demo.form.reset();
    demo.model = {};
    demo.submitted = false;
  }
}
