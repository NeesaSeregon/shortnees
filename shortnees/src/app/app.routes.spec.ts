import { Route } from '@angular/router';

import { routes } from './app.routes';
import { AutenticacionGuard } from './custom/autenticacion.guard';

/**
 * Que una ruta privada se quede sin guardia no rompe ningun test de componente:
 * la pagina se pinta igual. Solo se nota tecleando la URL a mano, que es como
 * aparecio el agujero de /generador. Estos tests miran la tabla de rutas.
 */
describe('app.routes', () => {
  function ruta(path: string): Route {
    const encontrada = routes.find((r) => r.path === path);
    expect(encontrada).withContext(`no existe la ruta '${path}'`).toBeDefined();
    return encontrada!;
  }

  const PRIVADAS = ['dashboard', 'generador'];
  const PUBLICAS = ['home', 'login', 'registro', 'not-found'];

  for (const path of PRIVADAS) {
    it(`/${path} exige sesion`, () => {
      expect(ruta(path).canActivate).toContain(AutenticacionGuard);
    });
  }

  for (const path of PUBLICAS) {
    it(`/${path} sigue siendo publica`, () => {
      expect(ruta(path).canActivate).toBeUndefined();
    });
  }

  it('el comodin lleva al 404 y no a una pantalla en blanco', () => {
    expect(ruta('**').redirectTo).toBe('not-found');
  });

  it('la raiz redirige al acortador', () => {
    const raiz = ruta('');
    expect(raiz.redirectTo).toBe('home');
    expect(raiz.pathMatch).toBe('full');
  });
});
