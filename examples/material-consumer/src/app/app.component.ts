import { JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { BuilderDocument, BuilderPageComponent, FormlyViewComponent, builderToFormly } from '@ngx-formly-builder/core';

import { CONDITIONAL_FORM_DOC, CONTACT_FORM_DOC, TABBED_FORM_DOC } from './sample-forms';
import { FEEDBACK_FORMLY_JSON } from './sample-formly-json';

interface RuntimeDemo {
  kind: 'runtime';
  title: string;
  subtitle: string;
  badge?: string;
  form: FormGroup;
  model: Record<string, unknown>;
  fields: FormlyFieldConfig[];
  submitted: boolean;
}

interface WorkflowDemo {
  kind: 'workflow';
  title: string;
  subtitle: string;
  badge?: string;
  builderConfig: BuilderDocument;
  savedConfig: BuilderDocument;
  viewerModel: Record<string, unknown>;
  submittedPayload: Record<string, unknown> | null;
}

type Demo = RuntimeDemo | WorkflowDemo;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormlyModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    BuilderPageComponent,
    FormlyViewComponent,
    JsonPipe,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  demos: Demo[] = [];

  ngOnInit(): void {
    this.demos = [
      {
        kind: 'runtime',
        title: 'Contact Form',
        subtitle: 'Simple form with text, email, select and textarea fields loaded from a BuilderDocument.',
        badge: 'Path 1 - builderToFormly()',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(CONTACT_FORM_DOC),
        submitted: false,
      },
      {
        kind: 'runtime',
        title: 'Tabs Layout',
        subtitle: 'Multi-tab registration form using the fb-tabs layout type with Personal and Account sections.',
        badge: 'Path 1 - fb-tabs',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(TABBED_FORM_DOC),
        submitted: false,
      },
      {
        kind: 'runtime',
        title: 'Conditional Fields',
        subtitle: 'Two-column row layout with a select that appears only when a checkbox is checked.',
        badge: 'Path 1 - fb-col - visibleRule',
        form: new FormGroup({}),
        model: {},
        fields: builderToFormly(CONDITIONAL_FORM_DOC),
        submitted: false,
      },
      {
        kind: 'runtime',
        title: 'Direct Formly JSON',
        subtitle: 'Raw FormlyFieldConfig[] used without builderToFormly().',
        badge: 'Path 2 - no builderToFormly()',
        form: new FormGroup({}),
        model: {},
        fields: FEEDBACK_FORMLY_JSON,
        submitted: false,
      },
      createWorkflowDemo('material'),
    ];
  }

  submit(demo: RuntimeDemo): void {
    if (demo.form.valid) demo.submitted = true;
  }

  reset(demo: RuntimeDemo): void {
    demo.form.reset();
    demo.model = {};
    demo.submitted = false;
  }

  saveWorkflow(demo: WorkflowDemo): void {
    demo.savedConfig = cloneDocument(demo.builderConfig);
    demo.viewerModel = {};
    demo.submittedPayload = null;
  }

  captureViewerPayload(demo: WorkflowDemo): void {
    demo.submittedPayload = cloneModel(demo.viewerModel);
  }

  resetViewer(demo: WorkflowDemo): void {
    demo.viewerModel = {};
    demo.submittedPayload = null;
  }

  updateBuilderConfig(demo: WorkflowDemo, doc: BuilderDocument): void {
    demo.builderConfig = doc;
  }

  updateViewerModel(demo: WorkflowDemo, model: Record<string, unknown>): void {
    demo.viewerModel = cloneModel(model);
  }
}

function createWorkflowDemo(renderer: BuilderDocument['renderer']): WorkflowDemo {
  const seed = cloneDocument(CONTACT_FORM_DOC);
  seed.renderer = renderer;
  const root = seed.nodes[seed.rootId];
  if (root?.type === 'panel') {
    seed.nodes[seed.rootId] = {
      ...root,
      props: {
        ...root.props,
        title: 'Customer Intake Workflow',
      },
    };
  }

  return {
    kind: 'workflow',
    title: 'Builder -> Viewer Flow',
    subtitle:
      'Admin edits a BuilderDocument, saves it, and the customer-facing screen immediately renders the saved config with <formly-view>.',
    badge: 'Adoption path - builder save - viewer render',
    builderConfig: cloneDocument(seed),
    savedConfig: cloneDocument(seed),
    viewerModel: {},
    submittedPayload: null,
  };
}

function cloneDocument(doc: BuilderDocument): BuilderDocument {
  return JSON.parse(JSON.stringify(doc)) as BuilderDocument;
}

function cloneModel(model: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(model ?? {})) as Record<string, unknown>;
}
