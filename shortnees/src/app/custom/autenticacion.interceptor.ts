import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AccesoService } from '../services/acceso.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() solo funciona en el cuerpo sincrono del interceptor: Angular lo
  // envuelve en runInInjectionContext, y esa ventana se cierra en cuanto esta
  // funcion devuelve el Observable. Llamarlo dentro de catchError da NG0203.
  const acceso = inject(AccesoService);

  const peticionConCredenciales = req.clone({ withCredentials: true });

  return next(peticionConCredenciales).pipe(
    catchError((error: HttpErrorResponse) => {
      // Un 401 al iniciar sesion significa credenciales incorrectas, no sesion
      // caducada: lo gestiona LoginComponent. Si cerraramos sesion aqui,
      // navegariamos a /login y el mensaje de error nunca llegaria a verse.
      const esPeticionDeLogin = req.url.includes('login_check');

      if (error.status === 401 && !esPeticionDeLogin && acceso.isAuthenticated) {
        acceso.logout();
      }

      return throwError(() => error);
    })
  );
};
