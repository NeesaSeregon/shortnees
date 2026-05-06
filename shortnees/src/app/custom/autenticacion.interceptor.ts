import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AccesoService } from '../services/acceso.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token'); //conviene investigar donde mas puedo almacenarlo
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        inject(AccesoService).logout();
      }
      return throwError(() => error);
    })
  );
};
