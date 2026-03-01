import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilderPageComponent } from './builder-page.component';

describe('BuilderPageComponent readonly mode', () => {
  let fixture: ComponentFixture<BuilderPageComponent>;
  let component: BuilderPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderPageComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderPageComponent);
    component = fixture.componentInstance;
  });

  it('hides editing side panels and disables mutating toolbar actions', () => {
    component.readOnly = true;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Read-only');
    expect(text).not.toContain('Search palette');
    expect(text).not.toContain('Inspector');

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const templatesButton = buttons.find((button) => button.textContent?.includes('Templates'));
    const copyButton = buttons.find((button) => button.textContent?.includes('Copy'));
    expect(templatesButton?.disabled).toBeTrue();
    expect(copyButton?.disabled).toBeTrue();
  });
});
