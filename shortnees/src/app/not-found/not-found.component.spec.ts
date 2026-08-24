import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('se crea y su plantilla compila', async () => {
    expect(component).toBeTruthy();
  });

  it('ofrece la vuelta al inicio sin recargar la SPA', async () => {
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a.btn-home');

    expect(enlace).toBeTruthy();
    // routerLink genera un href, pero lo intercepta el router en vez de navegar.
    expect(enlace!.getAttribute('href')).toBe('/home');
  });

  it('el codigo 404 no lo lee el lector de pantalla: lo dice el titular', async () => {
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('.error-code')!.getAttribute('aria-hidden')).toBe('true');
    expect(html.querySelector('h1')!.textContent).toContain('Enlace no encontrado');
  });

  it('ofrece una sola accion, para no mandar a nadie a una pagina con guardia', async () => {
    const enlaces = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'));

    expect(enlaces.length).toBe(1);
    expect(enlaces[0].getAttribute('href')).toBe('/home');
  });

});
