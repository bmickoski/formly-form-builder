import { Component } from '@angular/core';
import { FieldArrayType, FormlyModule } from '@ngx-formly/core';

@Component({
  selector: 'fb-repeat-type',
  imports: [FormlyModule],
  template: `
    <div class="fb-repeat">
      @for (childField of field.fieldGroup || []; track $index; let i = $index) {
        <div class="fb-repeat-item">
          @if (childField) {
            <formly-field [field]="childField"></formly-field>
          }
          <button type="button" class="btn btn-outline-danger btn-sm" (click)="remove(i)">Remove</button>
        </div>
      }
      <button type="button" class="btn btn-outline-primary btn-sm" (click)="add()">
        {{ props?.['addText'] || 'Add item' }}
      </button>
    </div>
  `,
})
export class FbRepeatTypeComponent extends FieldArrayType {}
