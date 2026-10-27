import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';

import { RestablecerComponent } from './restablecer.component';
import { AccesoService, RespuestaMensaje } from '../services/acceso.service';

/**
 * Modo zoneless y sin forzar el repintado: ver la seccion Tests de CLAUDE.md.
 *
 * El token llega en la URL, asi que se navega de verdad con RouterTestingHarness
 * en vez de sustituir ActivatedRoute por un doble: la plantilla usa routerLink,
 * y RouterLink necesita la ruta activa autentica.
 */
describe('RestablecerComponent', () => {
  const NUEVA = 'ContrasenaNueva123';

  let harness: RouterTestingHarness;
  let component: RestablecerComponent;
  let acceso: { restablecerContrasena: jasmine.Spy };

  async function abrir(url: string): Promise<void> {
    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl(url, RestablecerComponent);
    await harness.fixture.whenStable();
  }

  async function estable(): Promise<void> {
    await harness.fixture.whenStable();
  }

  function dom(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function texto(selector: string): string {
    const el = dom().querySelector(selector);
    return el ? el.textContent!.trim() : '';
  }

  function rellenar(password = NUEVA, confirmacion = password): void {
    component.formulario.setValue({ password, confirmacion });
  }

  beforeEach(async () => {
    acceso = {
      restablecerContrasena: jasmine.createSpy('restablecerContrasena')
        .and.returnValue(of({ mensaje: 'Contraseña actualizada.' })),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: AccesoService, useValue: acceso },
        provideRouter([{ path: 'restablecer', component: RestablecerComponent }]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  it('envia el token de la URL junto con la contraseña nueva', async () => {
    await abrir('/restablecer?token=abc123');
    rellenar();

    component.guardar();

    expect(acceso.restablecerContrasena).toHaveBeenCalledOnceWith('abc123', NUEVA);
  });

  it('sin token en la URL no ofrece el formulario y remite a pedir otro enlace', async () => {
    await abrir('/restablecer');

    expect(dom().querySelector('form')).toBeNull();
    expect(texto('p.error')).toContain('incompleto');
    const enlaces = Array.from(dom().querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toContain('/recuperar');
  });

  it('una contraseña corta se avisa sin llamar a la API', async () => {
    await abrir('/restablecer?token=abc123');
    rellenar('corta');

    component.guardar();
    await estable();

    expect(acceso.restablecerContrasena).not.toHaveBeenCalled();
    expect(texto('p.error')).toContain('al menos 8 caracteres');
  });

  it('si las dos contraseñas no coinciden se avisa sin llamar a la API', async () => {
    await abrir('/restablecer?token=abc123');
    rellenar(NUEVA, 'OtraDistinta123');

    component.guardar();
    await estable();

    expect(acceso.restablecerContrasena).not.toHaveBeenCalled();
    expect(texto('p.error')).toBe('Las dos contraseñas no coinciden.');
  });

  it('cuando la API confirma, el formulario se cambia por el acceso al login', async () => {
    const respuesta = new Subject<RespuestaMensaje>();
    acceso.restablecerContrasena.and.returnValue(respuesta);
    await abrir('/restablecer?token=abc123');
    rellenar();

    component.guardar();
    await estable();
    expect(dom().querySelector('form')).not.toBeNull();

    respuesta.next({ mensaje: 'Contraseña actualizada.' });
    await estable();

    expect(dom().querySelector('form')).toBeNull();
    expect(texto('p.auth-exito')).toContain('Contraseña actualizada');
    const enlaces = Array.from(dom().querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toContain('/login');
  });

  it('un enlace caducado muestra el mensaje de la API', async () => {
    acceso.restablecerContrasena.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { mensaje: 'El enlace no es válido o ha caducado. Solicita uno nuevo.' },
    })));
    await abrir('/restablecer?token=caducado');
    rellenar();

    component.guardar();
    await estable();

    expect(texto('p.error')).toBe('El enlace no es válido o ha caducado. Solicita uno nuevo.');
  });

  it('un fallo que no es 400 muestra un mensaje generico', async () => {
    acceso.restablecerContrasena.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await abrir('/restablecer?token=abc123');
    rellenar();

    component.guardar();
    await estable();

    expect(texto('p.error')).toContain('No se ha podido cambiar la contraseña');
  });
});
