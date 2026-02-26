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

  it('writes autosave drafts when autosave is enabled', () => {
    createComponent();
    const setItemSpy = spyOn(Storage.prototype, 'setItem');

    component.autosave = true;
    component.autosaveKey = 'builder:test:draft';
    component.ngOnInit();
    fixture.detectChanges();
    setItemSpy.calls.reset();

    component.store.addFromPalette('input', { containerId: component.store.rootId(), index: 0 });
    fixture.detectChanges();

    expect(setItemSpy).toHaveBeenCalled();
    const [key, json] = setItemSpy.calls.mostRecent().args as [string, string];
    expect(key).toBe('builder:test:draft');
    expect(json).toContain('"field"');
  });

  it('restores document from autosave when no [config] is provided', () => {
    createComponent();
    const saved = JSON.stringify(createSampleDoc('Restored Draft'));
    const getItemSpy = spyOn(Storage.prototype, 'getItem').and.returnValue(saved);

    component.autosave = true;
    component.autosaveKey = 'builder:test:restore';
    component.ngOnInit();

    expect(getItemSpy).toHaveBeenCalledWith('builder:test:restore');
    const root = component.store.doc().nodes[component.store.rootId()];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const field = component.store.doc().nodes[root.children[0]];
    expect(field.type).toBe('field');
    if (field.type !== 'field') return;
    expect(field.props.label).toBe('Restored Draft');
  });

  it('prefers [config] over autosave restore', () => {
    createComponent();
    const getItemSpy = spyOn(Storage.prototype, 'getItem').and.returnValue(JSON.stringify(createSampleDoc('Draft')));
    const config = createSampleDoc('Config Wins');

    component.autosave = true;
    component.autosaveKey = 'builder:test:prefer-config';
    component.config = config;
    component.ngOnInit();

    expect(getItemSpy).not.toHaveBeenCalled();
    const root = component.store.doc().nodes[component.store.rootId()];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const field = component.store.doc().nodes[root.children[0]];
    expect(field.type).toBe('field');
    if (field.type !== 'field') return;
    expect(field.props.label).toBe('Config Wins');
  });
});
