import { BuilderStore } from './store';
import { FIELD_VALIDATION_PATTERNS } from './validation-presets';

describe('BuilderStore field validation defaults', () => {
  let store: BuilderStore;

  beforeEach(() => {
    store = new BuilderStore();
  });

  it('applies default validators for email/phone/url/password fields from palette', () => {
    const rootId = store.rootId();

    store.addFromPalette('email', { containerId: rootId, index: 0 });
    const emailNode = store.selectedNode();
    expect(emailNode?.type).toBe('field');
    if (!emailNode || emailNode.type !== 'field') return;
    expect(emailNode.validators.email).toBeTrue();

    store.addFromPalette('tel', { containerId: rootId, index: 1 });
    const telNode = store.selectedNode();
    expect(telNode?.type).toBe('field');
    if (!telNode || telNode.type !== 'field') return;
    expect(telNode.validators.pattern).toBe(FIELD_VALIDATION_PATTERNS.tel);

    store.addFromPalette('url', { containerId: rootId, index: 2 });
    const urlNode = store.selectedNode();
    expect(urlNode?.type).toBe('field');
    if (!urlNode || urlNode.type !== 'field') return;
    expect(urlNode.validators.pattern).toBe(FIELD_VALIDATION_PATTERNS.url);

    store.addFromPalette('password', { containerId: rootId, index: 3 });
    const passwordNode = store.selectedNode();
    expect(passwordNode?.type).toBe('field');
    if (!passwordNode || passwordNode.type !== 'field') return;
    expect(passwordNode.validators.minLength).toBe(8);
  });
});
