import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AutenticacionGuard } from './autenticacion.guard';
import { AccesoService } from '../services/acceso.service';
import { ResolverTokenService } from '../services/resolver-token.service';

describe('AutenticacionGuard', () => {
  let acceso: { isAuthenticated: boolean; logout: jasmine.Spy };
  let resolver: { isTokenExpired: jasmine.Spy };
  let router: { navigate: jasmine.Spy };

  function crearGuard(): AutenticacionGuard {
    TestBed.configureTestingModule({
      providers: [
        { provide: AccesoService, useValue: acceso },
        { provide: ResolverTokenService, useValue: resolver },
        { provide: Router, useValue: router },
      ],
    });
    return TestBed.inject(AutenticacionGuard);
  }

  beforeEach(() => {
    acceso = { isAuthenticated: true, logout: jasmine.createSpy('logout') };
    resolver = { isTokenExpired: jasmine.createSpy('isTokenExpired').and.returnValue(false) };
    router = { navigate: jasmine.createSpy('navigate') };
  });

  it('deja pasar con sesion activa y token vigente', () => {
    expect(crearGuard().canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(acceso.logout).not.toHaveBeenCalled();
  });

  it('redirige a login cuando no hay sesion', () => {
    acceso.isAuthenticated = false;

    expect(crearGuard().canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('no comprueba la caducidad si ya no hay sesion', () => {
    acceso.isAuthenticated = false;

    crearGuard().canActivate();

    expect(resolver.isTokenExpired).not.toHaveBeenCalled();
  });

  it('cierra sesion cuando el token ha caducado', () => {
    resolver.isTokenExpired.and.returnValue(true);

    expect(crearGuard().canActivate()).toBeFalse();
    expect(acceso.logout).toHaveBeenCalledTimes(1);
  });
});
