import type { BuilderDocument } from '@ngx-formly-builder/core';

/**
 * A hardcoded BuilderDocument that represents a simple contact form.
 * In a real app this would be loaded from a backend API or local storage.
 */
export const SAMPLE_FORM_DOC: BuilderDocument = {
  schemaVersion: 2,
  rootId: 'root',
  renderer: 'material',
  selectedId: null,
  nodes: {
    root: {
      id: 'root',
      type: 'panel',
      parentId: null,
      children: ['contact-panel'],
      props: { title: 'Form' },
    },
    'contact-panel': {
      id: 'contact-panel',
      type: 'panel',
      parentId: 'root',
      children: ['f-name', 'f-email', 'f-subject', 'f-message'],
      props: { title: 'Contact Information' },
    },
    'f-name': {
      id: 'f-name',
      type: 'field',
      parentId: 'contact-panel',
      children: [],
      fieldKind: 'input',
      props: { key: 'name', label: 'Full Name', placeholder: 'Jane Doe' },
      validators: { required: true, minLength: 2 },
    },
    'f-email': {
      id: 'f-email',
      type: 'field',
      parentId: 'contact-panel',
      children: [],
      fieldKind: 'email',
      props: { key: 'email', label: 'Email Address' },
      validators: { required: true, email: true },
    },
    'f-subject': {
      id: 'f-subject',
      type: 'field',
      parentId: 'contact-panel',
      children: [],
      fieldKind: 'select',
      props: {
        key: 'subject',
        label: 'Subject',
        options: [
          { label: 'General enquiry', value: 'general' },
          { label: 'Bug report', value: 'bug' },
          { label: 'Feature request', value: 'feature' },
        ],
      },
      validators: { required: true },
    },
    'f-message': {
      id: 'f-message',
      type: 'field',
      parentId: 'contact-panel',
      children: [],
      fieldKind: 'textarea',
      props: {
        key: 'message',
        label: 'Message',
        placeholder: 'Describe your enquiry...',
        description: 'Maximum 500 characters.',
      },
      validators: { required: true, maxLength: 500 },
    },
  },
};
