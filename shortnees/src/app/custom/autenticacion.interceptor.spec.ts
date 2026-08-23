import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './autenticacion.interceptor';
import { AccesoService } from '../services/acceso.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let acceso: { logout: jasmine.Spy; isAuthenticated: boolean };

  beforeEach(() => {
    acceso = { logout: jasmine.createSpy('logout'), isAuthenticated: true };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AccesoService, useValue: acceso },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('anade withCredentials a todas las peticiones', () => {
    http.get('/enlaces-usuario').subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/enlaces-usuario');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
  });

  it('ante un 401 cierra sesion y propaga el HttpErrorResponse original', () => {
    let recibido: any = null;
    http.get('/enlaces-usuario').subscribe({ next: () => {}, error: (e) => (recibido = e) });
    httpMock.expectOne('/enlaces-usuario')
      .flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    expect(acceso.logout).toHaveBeenCalledTimes(1);
    // Antes del arreglo aqui llegaba el NG0203 lanzado por inject(), no el error HTTP
    expect(recibido.status).toBe(401);
  });

  it('no cierra sesion si el 401 viene de login_check', () => {
    http.post('https://shortns.com/api/login_check', {}).subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('https://shortns.com/api/login_check')
      .flush('credenciales', { status: 401, statusText: 'Unauthorized' });
    expect(acceso.logout).not.toHaveBeenCalled();
  });

  it('no cierra sesion si no habia sesion iniciada', () => {
    acceso.isAuthenticated = false;
    http.get('/estadisticas/1').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/estadisticas/1')
      .flush('no autorizado', { status: 401, statusText: 'Unauthorized' });
    expect(acceso.logout).not.toHaveBeenCalled();
  });

  it('un 404 no cierra sesion', () => {
    http.get('/estadisticas/86').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/estadisticas/86')
      .flush('no encontrado', { status: 404, statusText: 'Not Found' });
    expect(acceso.logout).not.toHaveBeenCalled();
  });
});
