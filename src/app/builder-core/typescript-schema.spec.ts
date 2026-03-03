import { BuilderStore } from './store';
import { builderToTypeScriptInterface } from './typescript-schema';

describe('builder/typescript schema adapter', () => {
  it('exports scalar and choice fields as a TypeScript interface', () => {
    const store = new BuilderStore();
    store.updateNodeProps(store.rootId(), { title: 'Customer Intake' });

    store.addFromPalette('email', { containerId: store.rootId(), index: 0 });
    const emailId = store.selectedId() as string;
    store.updateNodeProps(emailId, { key: 'email' });
    store.updateNodeValidators(emailId, { required: true });

    store.addFromPalette('checkbox', { containerId: store.rootId(), index: 1 });
    const subscribeId = store.selectedId() as string;
    store.updateNodeProps(subscribeId, { key: 'subscribeToNews' });

    store.addFromPalette('select', { containerId: store.rootId(), index: 2 });
    const planId = store.selectedId() as string;
    store.updateNodeProps(planId, {
      key: 'plan',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
      ],
    });

    const output = builderToTypeScriptInterface(store.doc());

    expect(output).toContain('export interface CustomerIntakeFormData {');
    expect(output).toContain('email: string;');
    expect(output).toContain('subscribeToNews?: boolean;');
    expect(output).toContain('plan?: "basic" | "pro";');
  });

  it('exports dotted keys as nested object properties', () => {
    const store = new BuilderStore();

    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const streetId = store.selectedId() as string;
    store.updateNodeProps(streetId, { key: 'address.street' });
    store.updateNodeValidators(streetId, { required: true });

    store.addFromPalette('date-range', { containerId: store.rootId(), index: 1 });
    const availabilityId = store.selectedId() as string;
    store.updateNodeProps(availabilityId, { key: 'address.availability' });

    const output = builderToTypeScriptInterface(store.doc(), 'NestedFormData');

    expect(output).toContain('export interface NestedFormData {');
    expect(output).toContain('address?: {');
    expect(output).toContain('street: string;');
    expect(output).toContain('availability?: { start?: string; end?: string };');
  });
});
