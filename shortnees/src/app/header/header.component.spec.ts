import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AccesoService } from '../services/acceso.service';

/**
 * Este spec corre en modo zoneless y no fuerza el repintado en ningun momento.
 *
 * El motivo: forzarlo salta por encima de la estrategia del componente, asi que
 * uno con OnPush que se olvidara de avisar a Angular seguiria pasando el test
 * mientras en el navegador se queda congelado. Con provideZonelessChangeDetection
 * y await fixture.whenStable(), la vista solo se actualiza si el propio
 * componente lo pide -aqui, porque isLoggedIn es un signal creado con toSignal-.
 * Si alguien lo devolviera a un campo normal rellenado por una suscripcion,
 * estos tests se caerian.
 */
describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let autenticado: BehaviorSubject<boolean>;
  let acceso: { isAuthenticated$: BehaviorSubject<boolean>; currentUserValue: any; logout: jasmine.Spy };

  beforeEach(async () => {
    autenticado = new BehaviorSubject<boolean>(false);
    acceso = {
      isAuthenticated$: autenticado,
      currentUserValue: { nombre: 'Luis', email: 'luis@ejemplo.com', rol: ['ROLE_USER'] },
      logout: jasmine.createSpy('logout'),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AccesoService, useValue: acceso },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function anclas(): HTMLAnchorElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
  }

  it('se crea y su plantilla compila', async () => {
    expect(component).toBeTruthy();
  });

  /**
   * El header navegaba con <a href>, que descarta la aplicacion y la vuelve a
   * arrancar entera en cada clic. Estos dos tests impiden que vuelva a colarse.
   */
  it('todos sus enlaces navegan con routerLink, ninguno con href suelto', async () => {
    const conRouterLink = fixture.debugElement.queryAll(By.directive(RouterLink));

    expect(anclas().length).toBeGreaterThan(0);
    expect(conRouterLink.length).toBe(anclas().length);
  });

  it('con sesion tampoco queda ningun href suelto', async () => {
    autenticado.next(true);
    await fixture.whenStable();

    const conRouterLink = fixture.debugElement.queryAll(By.directive(RouterLink));

    expect(anclas().length).toBeGreaterThan(0);
    expect(conRouterLink.length).toBe(anclas().length);
  });

  describe('cerrar sesion', () => {
    beforeEach(async () => {
      autenticado.next(true);
      await fixture.whenStable();
    });

    it('es un boton, no un enlace', async () => {
      const boton = (fixture.nativeElement as HTMLElement)
        .querySelector('button.header-link--boton');

      expect(boton).toBeTruthy();
      expect(boton!.textContent).toContain('Cerrar sesión');
    });

    it('delega en AccesoService, que ya se encarga de navegar', async () => {
      component.logout();

      expect(acceso.logout).toHaveBeenCalledTimes(1);
    });
  });

  it('sin sesion ofrece login y registro', async () => {
    const destinos = anclas().map((a) => a.getAttribute('href'));

    expect(destinos).toContain('/login');
    expect(destinos).toContain('/registro');
    expect(destinos).not.toContain('/dashboard');
  });

  it('con sesion ofrece el panel, el generador y la cuenta', async () => {
    autenticado.next(true);
    await fixture.whenStable();
    const destinos = anclas().map((a) => a.getAttribute('href'));

    expect(destinos).toContain('/dashboard');
    expect(destinos).toContain('/generador');
    expect(destinos).toContain('/cuenta');
  });

  it('el avatar muestra las dos primeras letras del nombre', async () => {
    autenticado.next(true);
    await fixture.whenStable();
    const avatar = (fixture.nativeElement as HTMLElement).querySelector('.header-avatar');

    expect(avatar!.textContent!.trim()).toBe('LU');
  });
});
