import { BuilderStore } from './store';
import { builderToZodSchema } from './zod-schema';

describe('builder/zod schema adapter', () => {
  it('exports Zod schemas for scalar, numeric, and choice fields', () => {
    const store = new BuilderStore();
    store.updateNodeProps(store.rootId(), { title: 'Customer Intake' });

    store.addFromPalette('email', { containerId: store.rootId(), index: 0 });
    const emailId = store.selectedId() as string;
    store.updateNodeProps(emailId, { key: 'email' });
    store.updateNodeValidators(emailId, { required: true });

    store.addFromPalette('number', { containerId: store.rootId(), index: 1 });
    const ageId = store.selectedId() as string;
    store.updateNodeProps(ageId, { key: 'age', step: 1 });
    store.updateNodeValidators(ageId, { min: 18, max: 99 });

    store.addFromPalette('select', { containerId: store.rootId(), index: 2 });
    const planId = store.selectedId() as string;
    store.updateNodeProps(planId, {
      key: 'plan',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
      ],
    });

    const output = builderToZodSchema(store.doc());

    expect(output).toContain("import { z } from 'zod';");
    expect(output).toContain('export const CustomerIntakeSchema = z.object({');
    expect(output).toContain('email: z.string().email(),');
    expect(output).toContain('age: z.number().min(18).max(99).multipleOf(1).optional(),');
    expect(output).toContain('plan: z.enum(["basic", "pro"]).optional(),');
    expect(output).toContain('export type CustomerIntakeSchemaInput = z.infer<typeof CustomerIntakeSchema>;');
  });

  it('exports dotted keys as nested Zod objects', () => {
    const store = new BuilderStore();

    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const streetId = store.selectedId() as string;
    store.updateNodeProps(streetId, { key: 'address.street' });
    store.updateNodeValidators(streetId, { required: true });

    store.addFromPalette('date-range', { containerId: store.rootId(), index: 1 });
    const availabilityId = store.selectedId() as string;
    store.updateNodeProps(availabilityId, { key: 'address.availability' });

    const output = builderToZodSchema(store.doc(), 'NestedSchema');

    expect(output).toContain('export const NestedSchema = z.object({');
    expect(output).toContain('address: z.object({');
    expect(output).toContain('street: z.string(),');
    expect(output).toContain(
      'availability: z.object({ start: z.string().optional(), end: z.string().optional() }).optional(),',
    );
    expect(output).toContain('}).optional(),');
  });
});
