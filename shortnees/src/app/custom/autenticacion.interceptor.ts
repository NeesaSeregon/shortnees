import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AccesoService } from '../services/acceso.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const reqWithCredentials = req.clone({ withCredentials: true });
  return next(reqWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        inject(AccesoService).logout();
      }
      return throwError(() => error);
    })
  );
};
