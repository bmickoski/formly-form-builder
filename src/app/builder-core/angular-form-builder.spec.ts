import { BuilderStore } from './store';
import { builderToAngularFormBuilder } from './angular-form-builder';

describe('builder/angular form builder adapter', () => {
  it('exports a reactive form scaffold with validators', () => {
    const store = new BuilderStore();
    store.updateNodeProps(store.rootId(), { title: 'Customer Intake' });

    store.addFromPalette('email', { containerId: store.rootId(), index: 0 });
    const emailId = store.selectedId() as string;
    store.updateNodeProps(emailId, { key: 'email' });
    store.updateNodeValidators(emailId, { required: true });

    store.addFromPalette('number', { containerId: store.rootId(), index: 1 });
    const ageId = store.selectedId() as string;
    store.updateNodeProps(ageId, { key: 'age' });
    store.updateNodeValidators(ageId, { min: 18, max: 99 });

    store.addFromPalette('checkbox', { containerId: store.rootId(), index: 2 });
    const termsId = store.selectedId() as string;
    store.updateNodeProps(termsId, { key: 'acceptedTerms' });
    store.updateNodeValidators(termsId, { required: true });

    const output = builderToAngularFormBuilder(store.doc());

    expect(output).toContain("import { FormBuilder, Validators } from '@angular/forms';");
    expect(output).toContain('export function createCustomerIntakeForm(fb: FormBuilder) {');
    expect(output).toContain("email: fb.control('', { validators: [Validators.required, Validators.email] }),");
    expect(output).toContain('age: fb.control(null, { validators: [Validators.min(18), Validators.max(99)] }),');
    expect(output).toContain('acceptedTerms: fb.control(false, { validators: [Validators.requiredTrue] }),');
  });

  it('exports dotted keys as nested form groups', () => {
    const store = new BuilderStore();

    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const streetId = store.selectedId() as string;
    store.updateNodeProps(streetId, { key: 'address.street' });
    store.updateNodeValidators(streetId, { required: true });

    store.addFromPalette('date-range', { containerId: store.rootId(), index: 1 });
    const availabilityId = store.selectedId() as string;
    store.updateNodeProps(availabilityId, { key: 'address.availability' });

    const output = builderToAngularFormBuilder(store.doc(), 'createNestedForm');

    expect(output).toContain('export function createNestedForm(fb: FormBuilder) {');
    expect(output).toContain('address: fb.group({');
    expect(output).toContain("street: fb.control('', { validators: [Validators.required] }),");
    expect(output).toContain("availability: fb.group({ start: fb.control(''), end: fb.control('') }),");
  });
});
