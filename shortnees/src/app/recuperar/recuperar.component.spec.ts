import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { RecuperarComponent } from './recuperar.component';
import { AccesoService, RespuestaMensaje } from '../services/acceso.service';

/** Modo zoneless y sin forzar el repintado: ver la seccion Tests de CLAUDE.md. */
describe('RecuperarComponent', () => {
  const ACUSE = 'Si ese correo tiene una cuenta, te hemos enviado un enlace para restablecer la contraseña.';

  let fixture: ComponentFixture<RecuperarComponent>;
  let component: RecuperarComponent;
  let acceso: { solicitarRecuperacion: jasmine.Spy };

  beforeEach(async () => {
    acceso = {
      solicitarRecuperacion: jasmine.createSpy('solicitarRecuperacion')
        .and.returnValue(of({ mensaje: ACUSE })),
    };

    await TestBed.configureTestingModule({
      imports: [RecuperarComponent],
      providers: [
        { provide: AccesoService, useValue: acceso },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function dom(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function texto(selector: string): string {
    const el = dom().querySelector(selector);
    return el ? el.textContent!.trim() : '';
  }

  it('sin un correo valido avisa y no llama a la API', async () => {
    component.formulario.setValue({ email: 'no-es-un-correo' });

    component.enviar();
    await fixture.whenStable();

    expect(acceso.solicitarRecuperacion).not.toHaveBeenCalled();
    expect(texto('p.error')).toContain('Escribe el correo');
  });

  it('envia el correo escrito', () => {
    component.formulario.setValue({ email: 'ana@ejemplo.com' });

    component.enviar();

    expect(acceso.solicitarRecuperacion).toHaveBeenCalledOnceWith('ana@ejemplo.com');
  });

  it('cuando responde la API, el formulario se cambia por su acuse', async () => {
    // La respuesta llega por callback: sin signals, la pantalla no cambiaria.
    const respuesta = new Subject<RespuestaMensaje>();
    acceso.solicitarRecuperacion.and.returnValue(respuesta);
    component.formulario.setValue({ email: 'ana@ejemplo.com' });

    component.enviar();
    await fixture.whenStable();
    expect(dom().querySelector('form')).not.toBeNull();

    respuesta.next({ mensaje: ACUSE });
    await fixture.whenStable();

    expect(dom().querySelector('form')).toBeNull();
    expect(texto('p.auth-exito')).toBe(ACUSE);
  });

  it('el acuse es el de la API, sin nada que delate si la cuenta existe', async () => {
    component.formulario.setValue({ email: 'nadie@ejemplo.com' });

    component.enviar();
    await fixture.whenStable();

    expect(texto('p.auth-exito')).toBe(ACUSE);
    expect(dom().querySelector('p.error')).toBeNull();
  });

  it('mientras se envia, el boton no se puede pulsar otra vez', async () => {
    acceso.solicitarRecuperacion.and.returnValue(new Subject<RespuestaMensaje>());
    component.formulario.setValue({ email: 'ana@ejemplo.com' });

    component.enviar();
    await fixture.whenStable();

    expect(dom().querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
  });

  it('un fallo de red se ve en pantalla y deja reintentar', async () => {
    acceso.solicitarRecuperacion.and.returnValue(throwError(() => new Error('500')));
    component.formulario.setValue({ email: 'ana@ejemplo.com' });

    component.enviar();
    await fixture.whenStable();

    expect(texto('p.error')).toContain('No se ha podido enviar');
    expect(dom().querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBeFalse();
  });

  it('ofrece volver al login con un enlace navegable', () => {
    const enlaces = Array.from(dom().querySelectorAll('a'));

    expect(enlaces.map((a) => a.getAttribute('href'))).toContain('/login');
  });
});
