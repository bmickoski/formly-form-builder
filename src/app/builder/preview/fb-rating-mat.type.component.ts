import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'fb-rating-mat-type',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="fb-rating-mat-row">
      @for (rating of ratings(); track rating) {
        <button
          mat-icon-button
          type="button"
          [disabled]="props?.['disabled']"
          [attr.aria-label]="'Set rating to ' + rating"
          (click)="setRating(rating)"
        >
          <mat-icon [class.fb-rating-mat-active]="isFilled(rating)">{{
            isFilled(rating) ? 'star' : 'star_border'
          }}</mat-icon>
        </button>
      }
      <span class="fb-rating-mat-value">{{ value() || 0 }}/{{ maxRating() }}</span>
    </div>
  `,
  styles: `
    .fb-rating-mat-row {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .fb-rating-mat-active {
      color: #f59e0b;
    }

    .fb-rating-mat-value {
      margin-left: 8px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbRatingMatTypeComponent extends FieldType {
  ratings(): number[] {
    return Array.from({ length: this.maxRating() }, (_, index) => index + 1);
  }

  maxRating(): number {
    const raw = Number(this.props?.['max'] ?? 5);
    return Number.isFinite(raw) && raw > 0 ? Math.max(1, Math.trunc(raw)) : 5;
  }

  value(): number {
    const raw = Number(this.formControl.value ?? 0);
    return Number.isFinite(raw) ? raw : 0;
  }

  isFilled(rating: number): boolean {
    return this.value() >= rating;
  }

  setRating(rating: number): void {
    if (this.props?.['disabled']) return;
    this.formControl.setValue(rating);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }
}
