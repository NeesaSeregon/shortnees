import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AccesoService } from './acceso.service';
import { appsettings } from '../settings/appsettings';

/** JWT de mentira: solo importa que el payload sea decodificable. */
function tokenCon(exp: number, extra: Record<string, unknown> = {}): string {
  const payload = btoa(JSON.stringify({ exp, ...extra }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `cabecera.${payload}.firma`;
}

const EN_UNA_HORA = Math.floor(Date.now() / 1000) + 3600;
const HACE_UNA_HORA = Math.floor(Date.now() / 1000) - 3600;

/** Lo que emite de verdad el backend: username, roles y nombre (AnadirNombreAlJwt). */
const PERFIL = {
  username: 'luis@ejemplo.com',
  roles: ['ROLE_USER'],
  nombre: 'Luis',
};

describe('AccesoService', () => {
  let service: AccesoService;
  let httpMock: HttpTestingController;
  let router: { navigate: jasmine.Spy };

  function crear(): void {
    router = { navigate: jasmine.createSpy('navigate') };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AccesoService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
    crear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    const credenciales = { username: 'luis@ejemplo.com', password: 'secreta' };

    it('autentica con una sola peticion', () => {
      service.login(credenciales).subscribe();

      // Si alguien reintroduce un endpoint de perfil aparte, verify() lo caza.
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA, PERFIL) });
    });

    it('guarda solo la caducidad del token, nunca el token', () => {
      service.login(credenciales).subscribe();

      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA, PERFIL) });

      expect(localStorage.getItem('tokenExp')).toBe(String(EN_UNA_HORA));
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('marca la sesion como activa', () => {
      const estados: boolean[] = [];
      service.isAuthenticated$.subscribe((v) => estados.push(v));

      service.login(credenciales).subscribe();
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA, PERFIL) });

      expect(estados).toEqual([false, true]);
      expect(service.isAuthenticated).toBeTrue();
    });

    it('saca el perfil del payload del token', () => {
      service.login(credenciales).subscribe();
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA, PERFIL) });

      const esperado = { nombre: 'Luis', email: 'luis@ejemplo.com', rol: ['ROLE_USER'] };
      expect(service.currentUserValue).toEqual(esperado);
      expect(JSON.parse(localStorage.getItem('userData')!)).toEqual(esperado);
    });

    it('un token sin nombre deja el perfil vacio en vez de undefined', () => {
      // Tokens emitidos antes de AnadirNombreAlJwt: caducan en una hora, pero
      // mientras tanto la cabecera no debe reventar al leer user.nombre.
      service.login(credenciales).subscribe();
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA, { username: 'luis@ejemplo.com' }) });

      expect(service.currentUserValue).toEqual({
        nombre: '', email: 'luis@ejemplo.com', rol: [],
      });
    });

    it('un token ilegible no tumba el login', () => {
      service.login(credenciales).subscribe();

      expect(() => {
        httpMock.expectOne(`${appsettings.apiUrl}api/login_check`).flush({ token: 'roto' });
      }).not.toThrow();
    });
  });

  describe('logout', () => {
    it('limpia el almacenamiento, apaga la sesion y navega a login', () => {
      localStorage.setItem('tokenExp', String(EN_UNA_HORA));
      localStorage.setItem('userData', JSON.stringify({ nombre: 'Luis' }));
      crear();

      service.logout();

      expect(localStorage.getItem('tokenExp')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();
      expect(service.isAuthenticated).toBeFalse();
      expect(service.currentUserValue).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['login']);
    });
  });

  describe('sesion al arrancar', () => {
    it('hay sesion si la caducidad esta en el futuro', () => {
      localStorage.setItem('tokenExp', String(EN_UNA_HORA));
      crear();

      expect(service.isAuthenticated).toBeTrue();
    });

    it('no hay sesion si la caducidad ya paso', () => {
      localStorage.setItem('tokenExp', String(HACE_UNA_HORA));
      crear();

      expect(service.isAuthenticated).toBeFalse();
    });

    it('no hay sesion si la caducidad esta corrupta', () => {
      localStorage.setItem('tokenExp', 'basura');
      crear();

      expect(service.isAuthenticated).toBeFalse();
    });
  });
});
