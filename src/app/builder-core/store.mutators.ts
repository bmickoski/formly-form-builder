import { BuilderDocument, ContainerNode, FieldNode, isContainerNode } from './model';
import { toFieldKey, uid } from './ids';

export function addContainerNodeToDoc(
  doc: BuilderDocument,
  type: ContainerNode['type'],
  parentId: string,
  props: ContainerNode['props'],
): ContainerNode {
  const id = uid('c');
  const node: ContainerNode = { id, type, parentId, children: [], props: { ...props } };

  const nodes: BuilderDocument['nodes'] = { ...doc.nodes, [id]: node };
  const parent = doc.nodes[parentId];
  if (parent && isContainerNode(parent)) {
    nodes[parentId] = { ...parent, children: [...parent.children, id] };
  }
  doc.nodes = nodes;
  return node;
}

export function addFieldNodeToDoc(
  doc: BuilderDocument,
  fieldKind: FieldNode['fieldKind'],
  parentId: string,
  props: FieldNode['props'],
  validators: FieldNode['validators'] = {},
): FieldNode {
  const id = uid('f');
  const key = props.key ?? toFieldKey(id);
  const node: FieldNode = {
    id,
    type: 'field',
    parentId,
    children: [],
    fieldKind,
    props: { ...props, key },
    validators: { ...validators },
  };

  const nodes: BuilderDocument['nodes'] = { ...doc.nodes, [id]: node };
  const parent = doc.nodes[parentId];
  if (parent && isContainerNode(parent)) {
    nodes[parentId] = { ...parent, children: [...parent.children, id] };
  }
  doc.nodes = nodes;
  return node;
}
