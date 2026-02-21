import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'fb-panel-wrapper',
  standalone: true,
  template: `
    <div class="fb-panel-wrapper">
      <div class="fb-panel-wrapper-title">{{ props?.label }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-panel-wrapper-description">{{ props?.description }}</div>
      }
      <ng-container #fieldComponent></ng-container>
    </div>
  `,
  styles: [
    `
      .fb-panel-wrapper {
        border: 1px solid #e2e2f0;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        background: #fff;
      }

      .fb-panel-wrapper-title {
        font-weight: 700;
        margin-bottom: 8px;
      }

      .fb-panel-wrapper-description {
        margin-bottom: 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbPanelWrapperComponent extends FieldWrapper {}
