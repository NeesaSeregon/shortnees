import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AccesoService } from './acceso.service';
import { appsettings } from '../settings/appsettings';

/** JWT de mentira: solo importa que el payload traiga un exp decodificable. */
function tokenCon(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `cabecera.${payload}.firma`;
}

const EN_UNA_HORA = Math.floor(Date.now() / 1000) + 3600;
const HACE_UNA_HORA = Math.floor(Date.now() / 1000) - 3600;

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

    it('guarda solo la caducidad del token, nunca el token', () => {
      service.login(credenciales).subscribe();

      httpMock.expectOne(`${appsettings.apiUrl}login`).flush({});
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA) });

      expect(localStorage.getItem('tokenExp')).toBe(String(EN_UNA_HORA));
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('marca la sesion como activa', () => {
      const estados: boolean[] = [];
      service.isAuthenticated$.subscribe((v) => estados.push(v));

      service.login(credenciales).subscribe();
      httpMock.expectOne(`${appsettings.apiUrl}login`).flush({});
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA) });

      expect(estados).toEqual([false, true]);
      expect(service.isAuthenticated).toBeTrue();
    });

    it('guarda los datos de perfil que devuelve /login', () => {
      const perfil = { nombre: 'Luis', email: 'luis@ejemplo.com', rol: ['ROLE_USER'] };

      service.login(credenciales).subscribe();
      httpMock.expectOne(`${appsettings.apiUrl}login`).flush(perfil);
      httpMock.expectOne(`${appsettings.apiUrl}api/login_check`)
        .flush({ token: tokenCon(EN_UNA_HORA) });

      expect(service.currentUserValue).toEqual(perfil);
      expect(JSON.parse(localStorage.getItem('userData')!)).toEqual(perfil);
    });

    it('un token ilegible no tumba el login', () => {
      service.login(credenciales).subscribe();
      httpMock.expectOne(`${appsettings.apiUrl}login`).flush({});

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
