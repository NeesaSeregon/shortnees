import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { WellcomeComponent } from './wellcome.component';

describe('WellcomeComponent', () => {
  let component: WellcomeComponent;
  let fixture: ComponentFixture<WellcomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WellcomeComponent],
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(WellcomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('se crea y su plantilla compila', async () => {
    expect(component).toBeTruthy();
  });
});
