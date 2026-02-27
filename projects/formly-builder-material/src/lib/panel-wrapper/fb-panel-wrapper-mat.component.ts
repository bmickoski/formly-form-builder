import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'fb-panel-wrapper-mat',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="mb-3">
      <mat-card-header>
        @if (props?.label) {
          <mat-card-title>{{ props.label }}</mat-card-title>
        }
        @if (props?.description) {
          <mat-card-subtitle>{{ props.description }}</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content>
        <ng-container #fieldComponent></ng-container>
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbPanelWrapperMatComponent extends FieldWrapper {}
