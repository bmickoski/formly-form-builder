import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'fb-panel-wrapper',
  standalone: true,
  imports: [NgIf],
  template: `
    <div style="border:1px solid #e2e2f0; border-radius:12px; padding:12px; margin-bottom:12px; background:#fff;">
      <div style="font-weight:700; margin-bottom:8px;">{{ props?.label }}</div>
      <div *ngIf="props?.description" class="fb-hint" style="margin-bottom:8px;">{{ props?.description }}</div>
      <ng-container #fieldComponent></ng-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbPanelWrapperComponent extends FieldWrapper {}
