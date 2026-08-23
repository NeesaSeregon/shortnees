import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './custom/autenticacion.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXhr(),
      withInterceptors([jwtInterceptor])
    ),
    // Sin zone.js. Angular ya no recibe el aviso global de "ha pasado algo" que
    // le daba zone parcheando las APIs del navegador, y solo repinta cuando algo
    // se lo pide: un signal que cambia, un evento de plantilla, un async pipe o
    // un markForCheck(). Es viable porque los once componentes estan en OnPush
    // con su estado en signals; con campos normales rellenados desde callbacks
    // de RxJS, la pantalla se quedaria congelada. Sustituye a
    // provideZoneChangeDetection({ eventCoalescing: true }), cuya opcion era una
    // optimizacion del mecanismo que aqui desaparece.
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimations()
  ]
};
