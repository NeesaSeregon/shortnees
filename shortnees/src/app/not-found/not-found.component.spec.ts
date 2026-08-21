import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea y su plantilla compila', () => {
    expect(component).toBeTruthy();
  });

  it('ofrece la vuelta al inicio sin recargar la SPA', () => {
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a.btn-home');

    expect(enlace).toBeTruthy();
    // routerLink genera un href, pero lo intercepta el router en vez de navegar.
    expect(enlace!.getAttribute('href')).toBe('/home');
  });
});
