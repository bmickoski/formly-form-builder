import type { FormlyFieldConfig } from '@ngx-formly/core';

/**
 * Path 2: direct Formly JSON (no builderToFormly runtime conversion).
 */
export const FEEDBACK_FORMLY_JSON: FormlyFieldConfig[] = [
  {
    wrappers: ['panel'],
    props: { label: 'Quick Feedback' },
    fieldGroup: [
      {
        key: 'rating',
        type: 'select',
        props: {
          label: 'How would you rate us?',
          required: true,
          options: [
            { label: '1 - Poor', value: '1' },
            { label: '2 - Fair', value: '2' },
            { label: '3 - Good', value: '3' },
            { label: '4 - Very Good', value: '4' },
            { label: '5 - Excellent', value: '5' },
          ],
        },
      },
      {
        key: 'recommend',
        type: 'checkbox',
        props: { label: 'Would you recommend us to a friend?' },
      },
      {
        key: 'comment',
        type: 'textarea',
        props: {
          label: 'Additional comments',
          placeholder: 'Tell us more...',
          description: 'Optional.',
        },
        expressions: { hide: '!model?.recommend' },
      },
    ],
  },
];
