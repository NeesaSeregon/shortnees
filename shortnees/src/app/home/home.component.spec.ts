import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('acortar', () => {
    it('no llama a la API con el formulario vacio', () => {
      component.acortar();

      expect(linkService.enviarLink).not.toHaveBeenCalled();
    });

    it('muestra la url corta cuando el enlace se crea', () => {
      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });

      component.acortar();

      expect(component.shortUrl).toBe('shortns.com/abc123');
      expect(component.error).toBe('');
    });

    it('trata urlCorta "protocolo" como error de protocolo', () => {
      responde({ mensaje: 'Este servicio solo acorta Urls seguras', urlCorta: 'protocolo' });
      component.formulario.setValue({ url: 'http://ejemplo.com' });

      component.acortar();

      expect(component.error).toBe('Este servicio solo acorta Urls seguras');
      expect(component.shortUrl).toBe('');
    });

    it('muestra cualquier otro mensaje como error', () => {
      responde({ mensaje: 'No puede dejar su URL en blanco', urlCorta: '' });
      component.formulario.setValue({ url: '   ' });

      component.acortar();

      expect(component.error).toBe('No puede dejar su URL en blanco');
      expect(component.shortUrl).toBe('');
    });

    it('avisa cuando la peticion falla', () => {
      linkService.enviarLink.and.returnValue(throwError(() => new Error('sin red')));
      component.formulario.setValue({ url: 'https://ejemplo.com' });

      component.acortar();

      expect(component.error).toContain('No se pudo acortar');
      expect(component.shortUrl).toBe('');
    });

    it('limpia el error de un intento anterior al acertar', () => {
      responde({ mensaje: 'Este servicio solo acorta Urls seguras', urlCorta: 'protocolo' });
      component.formulario.setValue({ url: 'http://ejemplo.com' });
      component.acortar();

      responde({ mensaje: 'Enlace creado', urlCorta: 'shortns.com/abc123' });
      component.formulario.setValue({ url: 'https://ejemplo.com' });
      component.acortar();

      expect(component.error).toBe('');
    });
  });

  describe('personalizar', () => {
    it('avisa cuando el nombre elegido ya esta en uso', () => {
      responde({ mensaje: 'El nombre esta en uso, elija otro', urlCorta: 'shortns.com/mio' });
      component.formularioPersonalizar.setValue({
        urlOriginal: 'https://ejemplo.com', urlPersonalizada: 'mio',
      });

      component.personalizar();

      expect(component.errorP).toBe('El nombre esta en uso, elija otro');
    });

    it('avisa cuando la peticion falla', () => {
      linkService.personalizarLink.and.returnValue(throwError(() => new Error('sin red')));
      component.formularioPersonalizar.setValue({
        urlOriginal: 'https://ejemplo.com', urlPersonalizada: 'mio',
      });

      component.personalizar();

      expect(component.errorP).toContain('No se pudo crear');
    });
  });

  describe('plantilla', () => {
    it('sin sesion ofrece solo el acortador', () => {
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('#url')).toBeTruthy();
      expect(html.querySelector('#urlPersonalizada')).toBeNull();
    });

    it('con sesion ofrece el personalizador', () => {
      autenticado.next(true);
      fixture.detectChanges();
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('#urlPersonalizada')).toBeTruthy();
      expect(html.querySelector('#url')).toBeNull();
    });
  });
});
