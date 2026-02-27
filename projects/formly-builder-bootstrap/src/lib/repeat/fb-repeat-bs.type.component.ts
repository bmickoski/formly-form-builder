import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldArrayType, FormlyModule } from '@ngx-formly/core';

@Component({
  selector: 'fb-repeat-bs-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    <div class="mb-3">
      @for (childField of field.fieldGroup ?? []; track $index; let i = $index) {
        <div class="d-flex align-items-start gap-2 mb-2">
          <div class="flex-grow-1">
            @if (childField) {
              <formly-field [field]="childField"></formly-field>
            }
          </div>
          <button type="button" class="btn btn-outline-danger btn-sm mt-1" (click)="remove(i)">Remove</button>
        </div>
      }
      <button type="button" class="btn btn-outline-primary btn-sm" (click)="add()">
        {{ props?.['addText'] || 'Add item' }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbRepeatBsTypeComponent extends FieldArrayType {}
