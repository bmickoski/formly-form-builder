import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FieldArrayType, FormlyModule } from '@ngx-formly/core';

@Component({
  selector: 'fb-repeat-type',
  standalone: true,
  imports: [NgFor, NgIf, FormlyModule],
  template: `
    <div class="fb-repeat">
      <div class="fb-repeat-item" *ngFor="let childField of field.fieldGroup || []; let i = index">
        <formly-field *ngIf="childField" [field]="childField"></formly-field>
        <button type="button" class="btn btn-outline-danger btn-sm" (click)="remove(i)">Remove</button>
      </div>
      <button type="button" class="btn btn-outline-primary btn-sm" (click)="add()">
        {{ props?.['addText'] || 'Add item' }}
      </button>
    </div>
  `,
})
export class FbRepeatTypeComponent extends FieldArrayType {}
