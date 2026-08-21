import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { WellcomeComponent } from './wellcome.component';

describe('WellcomeComponent', () => {
  let component: WellcomeComponent;
  let fixture: ComponentFixture<WellcomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WellcomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(WellcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea y su plantilla compila', () => {
    expect(component).toBeTruthy();
  });
});
