import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilderStore } from '../../builder-core/store';
import { ContainerNode, FieldNode } from '../../builder-core/model';
import { BuilderInspectorComponent } from './builder-inspector.component';

describe('BuilderInspectorComponent', () => {
  let fixture: ComponentFixture<BuilderInspectorComponent>;
  let component: BuilderInspectorComponent;
  let store: BuilderStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderInspectorComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderInspectorComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(BuilderStore);
  });

  it('renders quick column span presets and applies them to the selected column', () => {
    store.addFromPalette('row', { containerId: store.rootId(), index: 0 });
    const row = store.selectedNode() as ContainerNode;
    const firstColId = row.children[0];
    store.select(firstColId);

    fixture.detectChanges();

    const presetButtons = Array.from(fixture.nativeElement.querySelectorAll('.fb-span-preset')) as HTMLButtonElement[];
    expect(presetButtons.map((button) => button.textContent?.trim())).toEqual(['12/12', '6/12', '4/12', '3/12']);

    const numberInput = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
    expect(numberInput.getAttribute('min')).toBe('1');
    expect(numberInput.getAttribute('max')).toBe('12');

    const span4Button = presetButtons.find((button) => button.textContent?.includes('4/12'));
    expect(span4Button).toBeTruthy();
    span4Button?.click();
    fixture.detectChanges();

    const col = store.selectedNode() as ContainerNode;
    expect(col.props.colSpan).toBe(4);
    expect(span4Button?.classList.contains('fb-span-preset-active')).toBeTrue();
  });

  it('shows rule builder guidance and expression examples for field logic', () => {
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const field = store.selectedNode() as FieldNode;

    component.initRule('visibleRule');
    component.initRule('enabledRule');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Use simple rules for common cases');
    expect(text).toContain('Use simple rules to gate editing');

    const textareas = Array.from(fixture.nativeElement.querySelectorAll('textarea')) as HTMLTextAreaElement[];
    expect(textareas.length).toBeGreaterThanOrEqual(2);
    expect(textareas[0].getAttribute('placeholder')).toBe(component.ruleExpressionExample('visibleExpression'));
    expect(textareas[1].getAttribute('placeholder')).toBe(component.ruleExpressionExample('enabledExpression'));

    component.setRuleExpression('visibleExpression', "model?.showDetails === true && value !== 'hidden'");
    component.setRuleExpression('enabledExpression', "model?.canEdit === true && model?.status !== 'locked'");

    const updatedField = store.nodes()[field.id] as FieldNode;
    expect(updatedField.props.visibleExpression).toBe("model?.showDetails === true && value !== 'hidden'");
    expect(updatedField.props.enabledExpression).toBe("model?.canEdit === true && model?.status !== 'locked'");
  });

  it('shows step control for number fields and persists the value', () => {
    store.addFromPalette('number', { containerId: store.rootId(), index: 0 });
    const field = store.selectedNode() as FieldNode;
    component.onSelectedTabChange(1);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Step');

    component.setProp('step', 0.25);
    fixture.detectChanges();

    const updated = store.nodes()[field.id] as FieldNode;
    expect(updated.props.step).toBe(0.25);
  });

  it('shows step control for range fields and persists the value', () => {
    store.addFromPalette('range', { containerId: store.rootId(), index: 0 });
    const field = store.selectedNode() as FieldNode;
    component.onSelectedTabChange(1);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Step');

    component.setProp('step', 2);
    fixture.detectChanges();

    const updated = store.nodes()[field.id] as FieldNode;
    expect(updated.props.step).toBe(2);
  });

  it('shows end placeholder control for date-range fields and persists the value', () => {
    store.addFromPalette('date-range', { containerId: store.rootId(), index: 0 });
    const field = store.selectedNode() as FieldNode;

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('End placeholder');

    component.setProp('endPlaceholder', 'Return');
    fixture.detectChanges();

    const updated = store.nodes()[field.id] as FieldNode;
    expect(updated.props.endPlaceholder).toBe('Return');
  });

  it('shows step control for rating fields and persists the value', () => {
    store.addFromPalette('rating', { containerId: store.rootId(), index: 0 });
    const field = store.selectedNode() as FieldNode;
    component.onSelectedTabChange(1);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Step');

    component.setProp('step', 1);
    fixture.detectChanges();

    const updated = store.nodes()[field.id] as FieldNode;
    expect(updated.props.step).toBe(1);
  });

  it('shows visible rules for layout containers and persists container expressions', () => {
    store.addFromPalette('panel', { containerId: store.rootId(), index: 0 });
    const panel = store.selectedNode() as ContainerNode;

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Display rules');
    expect(text).toContain('Visible when');
    expect(text).not.toContain('Enabled when');

    component.initRule('visibleRule');
    component.setRuleExpression('visibleExpression', 'model?.showDetails === true');
    fixture.detectChanges();

    const updatedPanel = store.nodes()[panel.id] as ContainerNode;
    expect(updatedPanel.props.visibleRule).toEqual({ dependsOnKey: '', operator: 'truthy' });
    expect(updatedPanel.props.visibleExpression).toBe('model?.showDetails === true');
  });
});
