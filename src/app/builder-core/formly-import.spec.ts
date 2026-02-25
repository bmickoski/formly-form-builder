import { FormlyFieldConfig } from '@ngx-formly/core';

import { formlyToBuilder } from './formly-import';

describe('formly import branch coverage', () => {
  it('uses material renderer and handles null fields input', () => {
    const doc = formlyToBuilder(undefined as unknown as FormlyFieldConfig[]);
    expect(doc.renderer).toBe('material');
    expect(doc.rootId).toBe('root');
    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    expect(root.children).toEqual([]);
  });

  it('imports panel wrapper from wrappers metadata', () => {
    const doc = formlyToBuilder([
      {
        wrappers: ['panel'],
        props: { label: 'Wrapped Panel', description: 'desc' },
        fieldGroup: [{ type: 'input', key: 'a', props: { label: 'A' } }],
      },
    ]);

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const panel = doc.nodes[root.children[0]];
    expect(panel.type).toBe('panel');
    if (panel.type !== 'panel') return;
    expect(panel.props.title).toBe('Wrapped Panel');
    expect(panel.props.description).toBe('desc');
  });

  it('imports anonymous and panel groups through layout detection branches', () => {
    const doc = formlyToBuilder([
      {
        fieldGroup: [{ type: 'input', key: 'anon', props: { label: 'Anon' } }],
      },
      {
        key: 'group',
        fieldGroup: [{ type: 'input', key: 'pg', props: { label: 'Panel Group' } }],
      },
    ]);

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const first = doc.nodes[root.children[0]];
    const second = doc.nodes[root.children[1]];
    expect(first.type).toBe('row');
    expect(second.type).toBe('panel');
  });

  it('handles col class parsing when className is null', () => {
    const doc = formlyToBuilder([
      {
        className: null as unknown as string,
        fieldGroup: [{ type: 'input', key: 'x', props: { label: 'X' } }],
      },
    ]);

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const group = doc.nodes[root.children[0]];
    expect(group.type).toBe('row');
  });
});
