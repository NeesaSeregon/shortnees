import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';

// Las fechas son cadenas 'Y-m-d', que es lo que serializa el backend.
const ENLACES: Links[] = [
  {
    id: 1, urlOriginal: 'https://ejemplo.com', urlCorta: 'shortns.com/uno',
    fechaCreacion: '2026-01-01', fechaExpiracion: '2027-01-01',
  },
  {
    id: 2, urlOriginal: 'https://otro.com', urlCorta: 'shortns.com/dos',
    fechaCreacion: '2026-02-01', fechaExpiracion: '2027-02-01',
  },
];

/**
 * Modo zoneless y sin forzar el repintado: ver la seccion Tests de CLAUDE.md.
 * El dashboard rellena nueve campos desde callbacks de RxJS, asi que es el
 * componente con mas papeletas para quedarse congelado si alguno dejara de ser
 * un signal. Aqui eso se cae en vez de pasar desapercibido.
 */
describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let linkService: any;
  let router: { navigate: jasmine.Spy };

  async function montar(enlaces: Links[] | null = ENLACES): Promise<void> {
    linkService = {
      getUserEnlaces: jasmine.createSpy('getUserEnlaces').and.returnValue(
        enlaces === null ? throwError(() => new Error('sin red')) : of(enlaces)),
      obtenerEstadisticas: jasmine.createSpy('obtenerEstadisticas')
        .and.returnValue(of({ id: 1, numeroClicks: 3, detalles: [] })),
      obtenerEstadisticasPais: jasmine.createSpy('obtenerEstadisticasPais').and.returnValue(of([])),
      obtenerEstadisticasFecha: jasmine.createSpy('obtenerEstadisticasFecha').and.returnValue(of([])),
      obtenerEstadisticasDispositivo: jasmine.createSpy('obtenerEstadisticasDispositivo').and.returnValue(of([])),
      obtenerEstadisticasHora: jasmine.createSpy('obtenerEstadisticasHora').and.returnValue(of([])),
      eliminarEnlace: jasmine.createSpy('eliminarEnlace').and.returnValue(of({})),
    };

    router = { navigate: jasmine.createSpy('navigate') };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: LinkService, useValue: linkService },
        { provide: Router, useValue: router },
        provideNoopAnimations(),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('pide los enlaces del usuario al iniciarse', async () => {
    await montar();

    expect(linkService.getUserEnlaces).toHaveBeenCalledTimes(1);
    expect(component.enlaces().length).toBe(2);
  });

  it('pinta un boton por enlace', async () => {
    await montar();
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button.button-enlaces');

    expect(botones.length).toBe(2);
    expect(botones[0].textContent).toContain('shortns.com/uno');
  });

  it('avisa cuando el usuario no tiene enlaces', async () => {
    await montar([]);

    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('No tienes enlaces disponibles');
  });

  it('no rompe si la carga de enlaces falla', async () => {
    await montar(null);

    expect(component.enlaces()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('No tienes enlaces disponibles');
  });

  it('seleccionar un enlace pide sus cinco estadisticas con el mismo id', async () => {
    await montar();

    component.seleccionar(ENLACES[1]);

    expect(linkService.obtenerEstadisticas).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasPais).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasFecha).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasDispositivo).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasHora).toHaveBeenCalledOnceWith(2);
  });

  it('seleccionar marca el enlace y muestra sus clics', async () => {
    await montar();

    component.seleccionar(ENLACES[0]);
    await fixture.whenStable();

    expect(component.enlaceSeleccionadoId()).toBe(1);
    expect(component.urlCortaSeleccionada()).toBe('shortns.com/uno');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('clics totales');
  });

  describe('boton de QR', () => {
    it('pinta un boton de QR por enlace', async () => {
      await montar();
      const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button.button-qr');

      expect(botones.length).toBe(2);
    });

    it('lleva al generador con la url corta del enlace', async () => {
      await montar();

      component.verQr(ENLACES[0]);

      expect(router.navigate).toHaveBeenCalledOnceWith(
        ['/generador'],
        { queryParams: { url: 'https://shortns.com/uno' } },
      );
    });

    it('anade el protocolo, que url_corta no lo guarda', async () => {
      await montar();

      component.verQr(ENLACES[0]);
      const parametros = router.navigate.calls.mostRecent().args[1];

      expect(parametros.queryParams.url.startsWith('https://')).toBeTrue();
    });

    it('no duplica el protocolo si la url ya lo trae', async () => {
      await montar();

      component.verQr({ ...ENLACES[0], urlCorta: 'https://shortns.com/uno' });

      expect(router.navigate).toHaveBeenCalledOnceWith(
        ['/generador'],
        { queryParams: { url: 'https://shortns.com/uno' } },
      );
    });
  });

  describe('boton de eliminar', () => {
    it('pinta un boton de borrar por enlace', async () => {
      await montar();
      const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button.button-borrar');

      expect(botones.length).toBe(2);
    });

    it('el primer clic pregunta en vez de borrar', async () => {
      await montar();

      component.pedirConfirmacion(ENLACES[0]);
      await fixture.whenStable();

      expect(linkService.eliminarEnlace).not.toHaveBeenCalled();
      const html = fixture.nativeElement as HTMLElement;
      expect(html.querySelector('button.button-borrar-si')).toBeTruthy();
      expect(html.querySelector('button.button-borrar-no')).toBeTruthy();
    });

    it('solo pregunta en la fila de su enlace', async () => {
      await montar();

      component.pedirConfirmacion(ENLACES[0]);
      await fixture.whenStable();
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelectorAll('button.button-borrar-si').length).toBe(1);
      // La otra fila conserva sus botones normales.
      expect(html.querySelectorAll('button.button-borrar').length).toBe(1);
      expect(html.querySelectorAll('button.button-qr').length).toBe(1);
    });

    it('cancelar deja el enlace intacto', async () => {
      await montar();

      component.pedirConfirmacion(ENLACES[0]);
      component.cancelarBorrado();
      await fixture.whenStable();

      expect(linkService.eliminarEnlace).not.toHaveBeenCalled();
      expect((fixture.nativeElement as HTMLElement).querySelector('button.button-borrar-si')).toBeNull();
    });

    it('confirmar borra y recarga la lista', async () => {
      await montar();

      component.pedirConfirmacion(ENLACES[0]);
      component.eliminarEnlace(1);

      expect(linkService.eliminarEnlace).toHaveBeenCalledOnceWith(1);
      expect(linkService.getUserEnlaces).toHaveBeenCalledTimes(2);
      expect(component.confirmandoBorradoId()).toBeNull();
    });

    it('tras borrar, la lista que se ve en pantalla se actualiza sola', async () => {
      // Este test existe por lo que NO cubrian los demas: comprueban que se
      // llama al servicio, no que el resultado llegue al DOM. Sin el, 'enlaces'
      // podria dejar de ser un signal y con OnPush la fila borrada seguiria
      // pintada mientras los 18 tests restantes pasaban en verde.
      await montar();
      const filas = () => (fixture.nativeElement as HTMLElement)
        .querySelectorAll('button.button-enlaces').length;
      expect(filas()).toBe(2);

      linkService.getUserEnlaces.and.returnValue(of([ENLACES[1]]));
      component.eliminarEnlace(1);
      await fixture.whenStable();

      expect(filas()).toBe(1);
    });

    it('borrar el enlace seleccionado retira sus estadisticas de la pantalla', async () => {
      await montar();
      component.seleccionar(ENLACES[0]);
      await fixture.whenStable();
      expect(component.estadisticas()).not.toBeNull();

      component.eliminarEnlace(1);
      await fixture.whenStable();

      // Sin esto, las graficas se quedaban describiendo un enlace inexistente.
      expect(component.estadisticas()).toBeNull();
      expect(component.enlaceSeleccionadoId()).toBeNull();
      expect(component.urlCortaSeleccionada()).toBeNull();
      expect(component.dataBarPais()).toEqual([]);
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('clics totales');
    });

    it('borrar otro enlace no toca la seleccion actual', async () => {
      await montar();
      component.seleccionar(ENLACES[0]);

      component.eliminarEnlace(2);

      expect(component.enlaceSeleccionadoId()).toBe(1);
      expect(component.estadisticas()).not.toBeNull();
    });

    it('un fallo al borrar cierra la confirmacion en vez de dejarla colgada', async () => {
      await montar();
      linkService.eliminarEnlace.and.returnValue(throwError(() => new Error('sin red')));

      component.pedirConfirmacion(ENLACES[0]);
      component.eliminarEnlace(1);

      expect(component.confirmandoBorradoId()).toBeNull();
      expect(component.enlaces().length).toBe(2);
    });
  });
  /**
   * El [view] de ngx-charts era fijo (500x260 y 980x280) dentro de columnas
   * fluidas: las graficas no cabian en su tarjeta y cada una acababa con su
   * propia barra de scroll.
   *
   * Y hay un segundo problema que el ancho fijo tapaba: ngx-charts no expone un
   * grosor maximo de barra. Reparte el eje de bandas con scaleBand, y con UNA
   * sola categoria no hay huecos que repartir, asi que la banda ocupa el area
   * entera haga lo que haga [barPadding] y la barra sale como un bloque. Lo
   * unico que se controla es el tamano del area, y el grosor va por el eje de
   * bandas: el ALTO en las horizontales y el ANCHO en las verticales.
   *
   * El umbral de 720px y el padding de 22px estan tambien en el CSS del
   * componente (.stats-grid y .chart-card). Si se cambia uno sin el otro, las
   * graficas se dimensionan para una rejilla que no es la que se pinta.
   */
  describe('dimensionado de las graficas', () => {
    it('sin medir todavia usa un tamano de partida en vez de cero', async () => {
      await montar();

      expect(component.vistaDispositivo()[0]).toBeGreaterThan(0);
      expect(component.vistaHora()[0]).toBeGreaterThan(0);
    });

    it('con el panel ancho las de media fila descuentan hueco y padding', async () => {
      await montar();

      component.medirPanel(876);

      // (876 - 20 de hueco) / 2 = 428, menos 44 de padding = 384
      expect(component.vistaDispositivo()).toEqual([384, 260]);
    });

    it('por debajo del umbral las de media fila ocupan la fila entera', async () => {
      await montar();

      component.medirPanel(600);

      expect(component.vistaDispositivo()[0]).toBe(556);
    });

    it('nunca devuelve un ancho negativo por estrecho que sea el panel', async () => {
      await montar();

      component.medirPanel(60);

      expect(component.vistaDispositivo()[0]).toBe(240);
    });

    it('ignora una medida de cero, que es lo que llega al ocultarse el panel', async () => {
      await montar();
      component.medirPanel(876);

      component.medirPanel(0);

      expect(component.vistaDispositivo()).toEqual([384, 260]);
    });

    describe('grosor de las barras', () => {
      it('con un solo pais la barra no se estira hasta llenar la tarjeta', async () => {
        await montar();
        component.medirPanel(876);

        component.dataBarPais.set([{ name: 'Desconocido', value: 2 }]);

        // 60 de eje + 44 de fila = 104, por debajo del suelo de 110.
        expect(component.vistaPais()[1]).toBe(110);
      });

      it('la grafica de pais crece con el numero de paises', async () => {
        await montar();
        component.medirPanel(876);

        component.dataBarPais.set([
          { name: 'España', value: 9 }, { name: 'México', value: 4 },
          { name: 'Argentina', value: 2 }, { name: 'Colombia', value: 1 },
        ]);

        expect(component.vistaPais()[1]).toBe(60 + 4 * 44);
      });

      it('pero deja de crecer para no desbordar la tarjeta', async () => {
        await montar();
        component.medirPanel(876);

        component.dataBarPais.set(
          Array.from({ length: 20 }, (_, i) => ({ name: `Pais ${i}`, value: 1 })));

        expect(component.vistaPais()[1]).toBe(420);
      });

      it('con un solo mes las columnas piden solo el ancho que necesitan', async () => {
        await montar();
        component.medirPanel(876);

        component.dataBarFecha.set([{ name: '2026-08', value: 2 }]);

        // 64 de eje + 72 de columna. Antes eran los 832 enteros: un bloque.
        expect(component.vistaMes()[0]).toBe(136);
      });

      it('con las 24 franjas horarias ocupan todo el ancho disponible', async () => {
        await montar();
        component.medirPanel(876);

        component.dataBarHora.set(
          Array.from({ length: 24 }, (_, h) => ({ name: `${h}`, value: h })));

        expect(component.vistaHora()[0]).toBe(832);
      });
    });
  });
});
