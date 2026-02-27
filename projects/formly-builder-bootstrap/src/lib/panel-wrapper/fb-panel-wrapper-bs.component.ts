import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'fb-panel-wrapper-bs',
  standalone: true,
  template: `
    <div class="card mb-3">
      <div class="card-body">
        @if (props?.label) {
          <h6 class="card-title">{{ props.label }}</h6>
        }
        @if (props?.description) {
          <p class="card-subtitle mb-2 text-body-secondary">{{ props.description }}</p>
        }
        <ng-container #fieldComponent></ng-container>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbPanelWrapperBsComponent extends FieldWrapper {}
