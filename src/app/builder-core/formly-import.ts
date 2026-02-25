import { FormlyFieldConfig } from '@ngx-formly/core';
import { BuilderDocument, ContainerNode, FieldNode } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';
import { toFieldKey, uid } from './ids';
import { fieldKindFromType, toFieldProps, toValidators } from './formly-import/field-mappers';
import {
  createContainerNode,
  detectLayoutKind,
  getColSpan,
  getPanelDescription,
  getPanelTitle,
} from './formly-import/layout-mappers';
import { getFieldGroup } from './formly-import/shared';

const ROOT_ID = 'root';

/**
 * Converts Formly config into builder domain JSON using a best-effort layout mapping.
 */
export function formlyToBuilder(
  fields: FormlyFieldConfig[],
  renderer: BuilderDocument['renderer'] = 'material',
): BuilderDocument {
  const root = createContainerNode('panel', ROOT_ID, null);
  root.props.title = 'Form';

  const doc: BuilderDocument = {
    schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
    rootId: ROOT_ID,
    nodes: { [ROOT_ID]: root },
    selectedId: null,
    renderer,
  };
  for (const field of fields ?? []) {
    importOne(doc, ROOT_ID, field);
  }
  return doc;
}

function importOne(doc: BuilderDocument, parentId: string, field: FormlyFieldConfig): void {
  const layoutKind = detectLayoutKind(field);

  switch (layoutKind) {
    case 'panel-wrapper': {
      const panel = createContainerNode('panel', uid('c'), parentId);
      panel.props.title = getPanelTitle(field, 'Panel');
      panel.props.description = getPanelDescription(field);
      attachContainer(doc, parentId, panel.id, panel);
      importGroup(doc, panel.id, getFieldGroup(field));
      return;
    }
    case 'row': {
      const row = createContainerNode('row', uid('c'), parentId);
      attachContainer(doc, parentId, row.id, row);
      importGroup(doc, row.id, getFieldGroup(field));
      return;
    }
    case 'tabs': {
      const tabs = createContainerNode('tabs', uid('c'), parentId);
      tabs.props.title = getPanelTitle(field, 'Tabs');
      tabs.props.description = getPanelDescription(field);
      attachContainer(doc, parentId, tabs.id, tabs);
      importGroup(doc, tabs.id, getFieldGroup(field));
      return;
    }
    case 'stepper': {
      const stepper = createContainerNode('stepper', uid('c'), parentId);
      stepper.props.title = getPanelTitle(field, 'Stepper');
      stepper.props.description = getPanelDescription(field);
      attachContainer(doc, parentId, stepper.id, stepper);
      importGroup(doc, stepper.id, getFieldGroup(field));
      return;
    }
    case 'accordion': {
      const accordion = createContainerNode('accordion', uid('c'), parentId);
      accordion.props.title = getPanelTitle(field, 'Accordion');
      accordion.props.description = getPanelDescription(field);
      attachContainer(doc, parentId, accordion.id, accordion);
      importGroup(doc, accordion.id, getFieldGroup(field));
      return;
    }
    case 'col': {
      const col = createContainerNode('col', uid('c'), parentId);
      const span = getColSpan(field.className ?? undefined);
      if (span != null) col.props.colSpan = span;
      attachContainer(doc, parentId, col.id, col);
      importGroup(doc, col.id, getFieldGroup(field));
      return;
    }
    case 'anonymous-group': {
      const row = createContainerNode('row', uid('c'), parentId);
      attachContainer(doc, parentId, row.id, row);
      importGroup(doc, row.id, getFieldGroup(field));
      return;
    }
    case 'panel-group': {
      const panel = createContainerNode('panel', uid('c'), parentId);
      panel.props.title = getPanelTitle(field, 'Group');
      attachContainer(doc, parentId, panel.id, panel);
      importGroup(doc, panel.id, getFieldGroup(field));
      return;
    }
    case 'field': {
      const mapped = createField(parentId, field);
      doc.nodes[mapped.id] = mapped;
      doc.nodes[parentId].children.push(mapped.id);
      return;
    }
  }
}

function importGroup(doc: BuilderDocument, parentId: string, fields: FormlyFieldConfig[]): void {
  for (const child of fields) {
    importOne(doc, parentId, child);
  }
}

function attachContainer(doc: BuilderDocument, parentId: string, id: string, container: ContainerNode): void {
  doc.nodes[id] = container;
  doc.nodes[parentId].children.push(id);
}

function createField(parentId: string, field: FormlyFieldConfig): FieldNode {
  const id = uid('f');
  const props = toFieldProps(field);
  if (!props.key) props.key = toFieldKey(id);

  return {
    id,
    type: 'field',
    parentId,
    children: [],
    fieldKind: fieldKindFromType(field),
    props,
    validators: toValidators(field),
  };
}
