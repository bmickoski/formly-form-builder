import { ComponentFixture, TestBed } from '@angular/core/testing';

import { type BuilderDocument } from '../builder-core/model';
import { BuilderStore } from '../builder-core/store';
import { BuilderPageComponent } from './builder-page.component';

function createSampleDoc(label = 'Configured Field'): BuilderDocument {
  const store = new BuilderStore();
  store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
  const id = store.selectedId() as string;
  store.updateNodeProps(id, { label, key: 'configuredKey' });
  return JSON.parse(JSON.stringify(store.doc())) as BuilderDocument;
}

describe('BuilderPageComponent autosave contract', () => {
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
    expect(json).toContain('"selectedId": null');
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

  it('emits autosaveError when draft save fails', () => {
    createComponent();
    const saveError = new Error('quota');
    spyOn(Storage.prototype, 'setItem').and.throwError(saveError.message);
    const autosaveErrorSpy = jasmine.createSpy('autosaveError');
    component.autosaveError.subscribe(autosaveErrorSpy);

    component.autosave = true;
    component.autosaveKey = 'builder:test:error';
    component.ngOnInit();
    fixture.detectChanges();
    autosaveErrorSpy.calls.reset();

    component.store.addFromPalette('input', { containerId: component.store.rootId(), index: 0 });
    fixture.detectChanges();

    expect(autosaveErrorSpy).toHaveBeenCalled();
    const event = autosaveErrorSpy.calls.mostRecent().args[0] as { operation: string; key: string; error: unknown };
    expect(event.operation).toBe('save');
    expect(event.key).toBe('builder:test:error');
    expect(event.error).toBeTruthy();
  });

  it('emits autosaveError when draft restore fails', () => {
    createComponent();
    const restoreError = new Error('blocked');
    spyOn(Storage.prototype, 'getItem').and.throwError(restoreError.message);
    const autosaveErrorSpy = jasmine.createSpy('autosaveError');
    component.autosaveError.subscribe(autosaveErrorSpy);

    component.autosave = true;
    component.autosaveKey = 'builder:test:restore-error';
    component.ngOnInit();

    expect(autosaveErrorSpy).toHaveBeenCalled();
    const event = autosaveErrorSpy.calls.mostRecent().args[0] as { operation: string; key: string; error: unknown };
    expect(event.operation).toBe('restore');
    expect(event.key).toBe('builder:test:restore-error');
    expect(event.error).toBeTruthy();
  });
});
