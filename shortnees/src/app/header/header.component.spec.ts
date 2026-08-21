import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AccesoService } from '../services/acceso.service';

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function anclas(): HTMLAnchorElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
  }

  it('se crea y su plantilla compila', () => {
    expect(component).toBeTruthy();
  });

  /**
   * El header navegaba con <a href>, que descarta la aplicacion y la vuelve a
   * arrancar entera en cada clic. Estos dos tests impiden que vuelva a colarse.
   */
  it('todos sus enlaces navegan con routerLink, ninguno con href suelto', () => {
    const conRouterLink = fixture.debugElement.queryAll(By.directive(RouterLink));

    expect(anclas().length).toBeGreaterThan(0);
    expect(conRouterLink.length).toBe(anclas().length);
  });

  it('con sesion tampoco queda ningun href suelto', () => {
    autenticado.next(true);
    fixture.detectChanges();

    const conRouterLink = fixture.debugElement.queryAll(By.directive(RouterLink));

    expect(anclas().length).toBeGreaterThan(0);
    expect(conRouterLink.length).toBe(anclas().length);
  });

  describe('cerrar sesion', () => {
    beforeEach(() => {
      autenticado.next(true);
      fixture.detectChanges();
    });

    it('es un boton, no un enlace', () => {
      const boton = (fixture.nativeElement as HTMLElement)
        .querySelector('button.header-link--boton');

      expect(boton).toBeTruthy();
      expect(boton!.textContent).toContain('Cerrar sesión');
    });

    it('delega en AccesoService, que ya se encarga de navegar', () => {
      component.logout();

      expect(acceso.logout).toHaveBeenCalledTimes(1);
    });
  });

  it('sin sesion ofrece login y registro', () => {
    const destinos = anclas().map((a) => a.getAttribute('href'));

    expect(destinos).toContain('/login');
    expect(destinos).toContain('/registro');
    expect(destinos).not.toContain('/dashboard');
  });

  it('con sesion ofrece el panel, el generador y la cuenta', () => {
    autenticado.next(true);
    fixture.detectChanges();
    const destinos = anclas().map((a) => a.getAttribute('href'));

    expect(destinos).toContain('/dashboard');
    expect(destinos).toContain('/generador');
    expect(destinos).toContain('/cuenta');
  });

  it('el avatar muestra las dos primeras letras del nombre', () => {
    autenticado.next(true);
    fixture.detectChanges();
    const avatar = (fixture.nativeElement as HTMLElement).querySelector('.header-avatar');

    expect(avatar!.textContent!.trim()).toBe('LU');
  });
});
