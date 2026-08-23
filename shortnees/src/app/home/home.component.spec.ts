import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { HomeComponent } from './home.component';
import { LinkService } from '../services/link.service';
import { AccesoService } from '../services/acceso.service';
import { LinkResponse } from '../interfaces/link-response';

/**
 * La API responde 200 incluso en los errores, y el front los distingue
 * comparando cadenas del cuerpo. Estos tests fijan ese contrato: si alguien
 * cambia un mensaje en el backend, se rompe un test en vez de romperse la
 * interfaz en silencio.
 */
describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let linkService: { enviarLink: jasmine.Spy; personalizarLink: jasmine.Spy };
  let autenticado: BehaviorSubject<boolean>;

  function responde(respuesta: LinkResponse): void {
    linkService.enviarLink.and.returnValue(of(respuesta));
    linkService.personalizarLink.and.returnValue(of(respuesta));
  }

  beforeEach(async () => {
    linkService = {
      enviarLink: jasmine.createSpy('enviarLink'),
      personalizarLink: jasmine.createSpy('personalizarLink'),
    };
    autenticado = new BehaviorSubject<boolean>(false);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: LinkService, useValue: linkService },
        { provide: AccesoService, useValue: { isAuthenticated$: autenticado } },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('acortar', () => {
    it('no llama a la API con el formulario vacio', async () => {
      component.acortar();

      expect(linkService.enviarLink).not.toHaveBeenCalled();
    });

    it('muestra la url corta cuando el enlace se crea', async () => {
      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });

      component.acortar();

      expect(component.shortUrl()).toBe('shortns.com/abc123');
      expect(component.error()).toBe('');
    });

    it('trata urlCorta "protocolo" como error de protocolo', async () => {
      responde({ mensaje: 'Este servicio solo acorta Urls seguras', urlCorta: 'protocolo' });
      component.formulario.setValue({ url: 'http://ejemplo.com' });

      component.acortar();

      expect(component.error()).toBe('Este servicio solo acorta Urls seguras');
      expect(component.shortUrl()).toBe('');
    });

    it('muestra cualquier otro mensaje como error', async () => {
      responde({ mensaje: 'No puede dejar su URL en blanco', urlCorta: '' });
      component.formulario.setValue({ url: '   ' });

      component.acortar();

      expect(component.error()).toBe('No puede dejar su URL en blanco');
      expect(component.shortUrl()).toBe('');
    });

    it('avisa cuando la peticion falla', async () => {
      linkService.enviarLink.and.returnValue(throwError(() => new Error('sin red')));
      component.formulario.setValue({ url: 'https://ejemplo.com' });

      component.acortar();

      expect(component.error()).toContain('No se pudo acortar');
      expect(component.shortUrl()).toBe('');
    });

    it('limpia el error de un intento anterior al acertar', async () => {
      responde({ mensaje: 'Este servicio solo acorta Urls seguras', urlCorta: 'protocolo' });
      component.formulario.setValue({ url: 'http://ejemplo.com' });
      component.acortar();

      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });
      component.acortar();

      expect(component.error()).toBe('');
    });
  });

  describe('personalizar', () => {
    it('avisa cuando el nombre elegido ya esta en uso', async () => {
      responde({ mensaje: 'El nombre esta en uso, elija otro', urlCorta: 'shortns.com/mio' });
      component.formularioPersonalizar.setValue({
        urlOriginal: 'https://ejemplo.com', urlPersonalizada: 'mio',
      });

      component.personalizar();

      expect(component.errorP()).toBe('El nombre esta en uso, elija otro');
    });

    it('avisa cuando la peticion falla', async () => {
      linkService.personalizarLink.and.returnValue(throwError(() => new Error('sin red')));
      component.formularioPersonalizar.setValue({
        urlOriginal: 'https://ejemplo.com', urlPersonalizada: 'mio',
      });

      component.personalizar();

      expect(component.errorP()).toContain('No se pudo crear');
    });
  });

  /**
   * navigator.clipboard no se puede espiar con spyOn: en Chrome es una
   * propiedad de solo lectura del prototipo, y en un contexto no seguro ni
   * siquiera existe. Se sustituye entera y se restaura al salir.
   */
  describe('copiar al portapapeles', () => {
    let escribir: jasmine.Spy;
    let original: PropertyDescriptor | undefined;

    beforeEach(() => {
      original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard')
        ?? Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      escribir = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: escribir },
        configurable: true,
      });
    });

    afterEach(() => {
      delete (navigator as any).clipboard;
      if (original) {
        Object.defineProperty(navigator, 'clipboard', original);
      }
    });

    async function conEnlaceCreado(): Promise<void> {
      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });
      component.acortar();
      await fixture.whenStable();
    }

    it('copia la url corta', async () => {
      await conEnlaceCreado();

      await component.copiar(component.shortUrl());

      expect(escribir).toHaveBeenCalledOnceWith('shortns.com/abc123');
    });

    it('el acuse aparece en pantalla sin forzar el repintado', async () => {
      // El otro test que mira el DOM tras un cambio asincrono: copiar() avisa
      // por una promesa, no por un evento, asi que sin signal no repintaria.
      await conEnlaceCreado();

      await component.copiar(component.shortUrl());
      await fixture.whenStable();

      expect(component.copiado()).toBeTrue();
      expect((fixture.nativeElement as HTMLElement).querySelector('.home-copiado')!.textContent)
        .toContain('Copiado');
    });

    it('no intenta copiar una cadena vacia', async () => {
      await component.copiar('');

      expect(escribir).not.toHaveBeenCalled();
    });

    it('si el navegador deniega el permiso no anuncia nada', async () => {
      escribir.and.returnValue(Promise.reject(new Error('denegado')));
      await conEnlaceCreado();

      await component.copiar(component.shortUrl());
      await fixture.whenStable();

      expect(component.copiado()).toBeFalse();
    });
  });

  describe('plantilla', () => {
    it('la url corta aparece en pantalla sin forzar el repintado', async () => {
      // El equivalente del test que faltaba en el dashboard: comprueba el DOM
      // despues de un cambio que llega por callback, no solo el campo.
      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });

      component.acortar();
      await fixture.whenStable();

      const salida = (fixture.nativeElement as HTMLElement)
        .querySelector('.home-result-input') as HTMLInputElement;

      expect(salida).toBeTruthy();
      expect(salida.value).toBe('shortns.com/abc123');
    });

    it('el aviso de copiado no esta antes de copiar nada', async () => {
      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });

      component.acortar();
      await fixture.whenStable();

      expect((fixture.nativeElement as HTMLElement).querySelector('.home-copiado')).toBeNull();
    });

    it('sin sesion ofrece solo el acortador', async () => {
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('#url')).toBeTruthy();
      expect(html.querySelector('#urlPersonalizada')).toBeNull();
    });

    it('con sesion ofrece el personalizador', async () => {
      autenticado.next(true);
      await fixture.whenStable();
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('#urlPersonalizada')).toBeTruthy();
      expect(html.querySelector('#url')).toBeNull();
    });
  });
});
