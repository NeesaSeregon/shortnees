import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegistroComponent } from './registro.component';
import { AccesoService } from '../services/acceso.service';

/** Modo zoneless y sin forzar el repintado: ver la seccion Tests de CLAUDE.md. */
describe('RegistroComponent', () => {
  let fixture: ComponentFixture<RegistroComponent>;
  let component: RegistroComponent;
  let acceso: { registrarse: jasmine.Spy };
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    acceso = { registrarse: jasmine.createSpy('registrarse').and.returnValue(of({})) };

    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [
        { provide: AccesoService, useValue: acceso },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function rellenar(): void {
    component.formularioRegistro.setValue({
      nombre: 'Luis', email: 'luis@ejemplo.com', password: 'Secreta123',
    });
  }

  function mensaje(): string {
    const p = (fixture.nativeElement as HTMLElement).querySelector('p.error');
    return p ? p.textContent!.trim() : '';
  }

  it('se crea y su plantilla compila', () => {
    expect(component).toBeTruthy();
  });

  it('con el formulario incompleto avisa y no llama a la API', async () => {
    component.submit();
    await fixture.whenStable();

    expect(acceso.registrarse).not.toHaveBeenCalled();
    expect(mensaje()).toBe('Rellene todos los campos.');
  });

  it('un alta correcta lleva al login', async () => {
    rellenar();

    component.submit();
    await fixture.whenStable();

    expect(acceso.registrarse).toHaveBeenCalledOnceWith({
      nombre: 'Luis', email: 'luis@ejemplo.com', password: 'Secreta123',
    });
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('un correo ya registrado se ve en pantalla', async () => {
    // /registro responde 400 cuando el email esta ocupado. La plantilla tenia
    // el hueco del mensaje desde siempre, pero la suscripcion no tenia rama de
    // error: el formulario se quedaba mudo y el usuario no sabia que pasaba.
    acceso.registrarse.and.returnValue(throwError(() => new Error('400')));
    rellenar();

    component.submit();
    await fixture.whenStable();

    expect(mensaje()).toContain('No se ha podido crear la cuenta');
    expect(navigate).not.toHaveBeenCalled();
  });

  /**
   * El «Ya tengo cuenta» del formulario era un <button> SIN (click): no hacia
   * nada al pulsarlo. Ahora es un routerLink, que ademas se puede abrir en otra
   * pestaña como cualquier enlace.
   */
  it('ofrece volver al login con un enlace navegable', async () => {
    const enlaces = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'));

    expect(enlaces.map((a) => a.getAttribute('href'))).toContain('/login');
  });

  it('no navega con botones sueltos: el unico boton es el de enviar', async () => {
    const botones = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'));

    expect(botones.length).toBe(1);
    expect(botones[0].getAttribute('type')).toBe('submit');
  });

});
