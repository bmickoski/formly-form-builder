import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldArrayType, FormlyModule } from '@ngx-formly/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'fb-repeat-mat-type',
  standalone: true,
  imports: [FormlyModule, MatButtonModule, MatIconModule],
  template: `
    <div class="mb-3">
      @for (childField of field.fieldGroup ?? []; track $index; let i = $index) {
        <div class="d-flex align-items-start gap-2 mb-2">
          <div class="flex-grow-1">
            @if (childField) {
              <formly-field [field]="childField"></formly-field>
            }
          </div>
          <button mat-icon-button color="warn" type="button" (click)="remove(i)" aria-label="Remove item">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      }
      <button mat-stroked-button color="primary" type="button" (click)="add()">
        {{ props?.['addText'] || 'Add item' }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbRepeatMatTypeComponent extends FieldArrayType {}
