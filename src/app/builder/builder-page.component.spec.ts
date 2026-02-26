import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilderStore } from '../builder-core/store';
import { type BuilderDocument } from '../builder-core/model';
import { BuilderPageComponent } from './builder-page.component';

function createSampleDoc(label = 'Configured Field'): BuilderDocument {
  const store = new BuilderStore();
  store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
  const id = store.selectedId() as string;
  store.updateNodeProps(id, { label, key: 'configuredKey' });
  return JSON.parse(JSON.stringify(store.doc())) as BuilderDocument;
}

describe('BuilderPageComponent contract', () => {
  let fixture: ComponentFixture<BuilderPageComponent>;
  let component: BuilderPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderPageComponent],
    })
      .overrideComponent(BuilderPageComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(BuilderPageComponent);
    component = fixture.componentInstance;
  }

  it('applies [config] on init', () => {
    createComponent();
    const config = createSampleDoc('From Input Config');

    component.config = config;
    component.ngOnInit();

    const root = component.store.doc().nodes[component.store.rootId()];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const field = component.store.doc().nodes[root.children[0]];
    expect(field.type).toBe('field');
    if (field.type !== 'field') return;
    expect(field.props.label).toBe('From Input Config');
  });

  it('emits configChange after user-driven store changes', () => {
    createComponent();
    component.ngOnInit();
    fixture.detectChanges();
    const configChangeSpy = jasmine.createSpy('configChange');
    component.configChange.subscribe(configChangeSpy);

    component.store.addFromPalette('input', { containerId: component.store.rootId(), index: 0 });
    fixture.detectChanges();

    expect(configChangeSpy).toHaveBeenCalled();
    const latest = configChangeSpy.calls.mostRecent().args[0] as BuilderDocument;
    expect(latest.selectedId).toBeNull();
    const root = latest.nodes[latest.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    expect(root.children.length).toBeGreaterThan(0);
  });

  it('does not emit configChange when [config] changes externally', () => {
    createComponent();
    component.ngOnInit();
    const configChangeSpy = jasmine.createSpy('configChange');
    component.configChange.subscribe(configChangeSpy);
    const config = createSampleDoc('External Config');

    component.config = config;
    component.ngOnChanges({
      config: new SimpleChange(null, config, false),
    });

    expect(configChangeSpy).not.toHaveBeenCalled();
    const root = component.store.doc().nodes[component.store.rootId()];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const field = component.store.doc().nodes[root.children[0]];
    expect(field.type).toBe('field');
    if (field.type !== 'field') return;
    expect(field.props.label).toBe('External Config');
  });
});
