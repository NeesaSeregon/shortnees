import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
//mport { autenticacionInterceptor } from './custom/autenticacion.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { jwtInterceptor } from './custom/autenticacion.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    //provideHttpClient(withInterceptors([autenticacionInterceptor])),
    provideAnimations()
  ]
};
