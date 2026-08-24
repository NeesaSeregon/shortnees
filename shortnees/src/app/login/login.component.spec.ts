import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AccesoService } from '../services/acceso.service';

/** Modo zoneless y sin forzar el repintado: ver la seccion Tests de CLAUDE.md. */
describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let acceso: { login: jasmine.Spy };
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    acceso = { login: jasmine.createSpy('login').and.returnValue(of({})) };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AccesoService, useValue: acceso },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function rellenar(): void {
    component.formularioLogin.setValue({ correo: 'luis@ejemplo.com', password: 'secreta' });
  }

  function mensaje(): string {
    const p = (fixture.nativeElement as HTMLElement).querySelector('p.error');
    return p ? p.textContent!.trim() : '';
  }

  it('se crea y su plantilla compila', () => {
    expect(component).toBeTruthy();
  });

  it('con el formulario vacio avisa y no llama a la API', async () => {
    component.iniciarSesion();
    await fixture.whenStable();

    expect(acceso.login).not.toHaveBeenCalled();
    expect(mensaje()).toBe('Introduzca sus datos de usuario.');
  });

  it('envia username y password tal como los espera json_login', async () => {
    rellenar();

    component.iniciarSesion();

    // El firewall de Lexik espera 'username', no 'correo'.
    expect(acceso.login).toHaveBeenCalledOnceWith({
      username: 'luis@ejemplo.com',
      password: 'secreta',
    });
  });

  it('al entrar lleva a home', async () => {
    rellenar();

    component.iniciarSesion();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledOnceWith(['home']);
  });

  it('unas credenciales malas se ven en pantalla sin forzar el repintado', async () => {
    acceso.login.and.returnValue(throwError(() => new Error('401')));
    rellenar();

    component.iniciarSesion();
    await fixture.whenStable();

    expect(mensaje()).toBe('Credenciales incorrectas');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ofrece crear cuenta con un enlace, no con un boton que navega a mano', async () => {
    const enlaces = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'));

    expect(enlaces.map((a) => a.getAttribute('href'))).toContain('/registro');
  });

  it('no navega con botones sueltos: el unico boton es el de enviar', async () => {
    const botones = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'));

    expect(botones.length).toBe(1);
    expect(botones[0].getAttribute('type')).toBe('submit');
  });

});
