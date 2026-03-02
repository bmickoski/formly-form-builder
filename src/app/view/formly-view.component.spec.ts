import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFormlyCore } from '@ngx-formly/core';
import { FormlyBootstrapModule, withFormlyBootstrap } from '@ngx-formly/bootstrap';

import { BuilderDocument } from '../builder-core/model';
import { FbPanelWrapperComponent } from '../builder/preview/fb-panel-wrapper.component';
import { FormlyViewComponent } from './formly-view.component';

describe('FormlyViewComponent', () => {
  let fixture: ComponentFixture<FormlyViewComponent>;
  let component: FormlyViewComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormlyViewComponent, FormlyBootstrapModule, FbPanelWrapperComponent],
      providers: [
        provideFormlyCore([
          ...withFormlyBootstrap(),
          { wrappers: [{ name: 'fb-panel', component: FbPanelWrapperComponent }] },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormlyViewComponent);
    component = fixture.componentInstance;
  });

  it('renders a builder document and emits model changes', async () => {
    const emitted: Record<string, unknown>[] = [];
    component.modelChange.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('config', createDocument());
    fixture.componentRef.setInput('model', { name: 'Alice' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('Alice');

    input.value = 'Bob';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual({ name: 'Bob' });
  });

  it('forces fields into disabled state in read-only mode', async () => {
    fixture.componentRef.setInput('config', createDocument());
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBeTrue();
  });
});

function createDocument(): BuilderDocument {
  return {
    schemaVersion: 2,
    rootId: 'root',
    selectedId: null,
    renderer: 'bootstrap',
    nodes: {
      root: {
        id: 'root',
        type: 'panel',
        parentId: null,
        children: ['field-name'],
        props: { title: 'Viewer Demo' },
      },
      'field-name': {
        id: 'field-name',
        type: 'field',
        parentId: 'root',
        children: [],
        fieldKind: 'input',
        props: { key: 'name', label: 'Name' },
        validators: {},
      },
    },
  };
}
