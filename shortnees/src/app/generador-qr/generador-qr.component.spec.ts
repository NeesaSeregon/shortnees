import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneradorQRComponent } from './generador-qr.component';

describe('GeneradorQRComponent', () => {
  let component: GeneradorQRComponent;
  let fixture: ComponentFixture<GeneradorQRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneradorQRComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneradorQRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
