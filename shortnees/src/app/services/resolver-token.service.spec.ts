import { TestBed } from '@angular/core/testing';

import { ResolverTokenService } from './resolver-token.service';

/** Segundos desde epoch, que es el formato del claim exp de un JWT. */
function dentroDe(segundos: number): string {
  return String(Math.floor(Date.now() / 1000) + segundos);
}

describe('ResolverTokenService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function crear(): ResolverTokenService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(ResolverTokenService);
  }

  describe('isTokenExpired', () => {
    it('considera caducado si no hay marca de expiracion', () => {
      expect(crear().isTokenExpired()).toBeTrue();
    });

    it('considera caducado un exp en el pasado', () => {
      localStorage.setItem('tokenExp', dentroDe(-60));

      expect(crear().isTokenExpired()).toBeTrue();
    });

    it('considera valido un exp en el futuro', () => {
      localStorage.setItem('tokenExp', dentroDe(3600));

      expect(crear().isTokenExpired()).toBeFalse();
    });

    it('considera caducado un valor no numerico', () => {
      localStorage.setItem('tokenExp', 'no-es-un-numero');

      expect(crear().isTokenExpired()).toBeTrue();
    });
  });

  describe('datos del usuario', () => {
    it('sin userData no hay sesion', () => {
      const service = crear();

      expect(service.isLoggedIn()).toBeFalse();
      expect(service.getUser()).toBeNull();
    });

    it('lee nombre y roles del userData guardado', () => {
      localStorage.setItem('userData', JSON.stringify({
        nombre: 'Luis', email: 'luis@ejemplo.com', rol: ['ROLE_USER'],
      }));

      const service = crear();

      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getUsername()).toBe('Luis');
      expect(service.getRoles()).toEqual(['ROLE_USER']);
    });
  });
});
