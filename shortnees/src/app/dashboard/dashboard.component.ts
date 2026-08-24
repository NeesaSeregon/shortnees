import {
  Component, OnInit, DestroyRef, ElementRef, inject, signal, computed, effect,
  viewChild, ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';
import { Estadisticas } from '../interfaces/estadisticas';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { SerieGrafica } from '../interfaces/serie-grafica';
import { PortapapelesService } from '../services/portapapeles.service';

@Component({
  selector: 'app-dashboard',
  imports: [NgxChartsModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly linkService = inject(LinkService);
  private readonly router = inject(Router);
  private readonly portapapeles = inject(PortapapelesService);
  private readonly destroyRef = inject(DestroyRef);

  // Todo el estado que se pinta va en signals. Cada set() avisa a Angular por su
  // cuenta, que es lo que permite usar OnPush: este componente rellena nueve
  // campos desde callbacks de RxJS, y un callback no marca la vista como sucia.
  // Con campos normales, los datos llegarian y la pantalla no se enteraria.
  readonly enlaces = signal<Links[]>([]);
  readonly enlaceSeleccionadoId = signal<number | null>(null);
  readonly urlCortaSeleccionada = signal<string | null>(null);
  /** Id del enlace cuya fila esta pidiendo confirmacion de borrado, si hay alguna. */
  readonly confirmandoBorradoId = signal<number | null>(null);

  /**
   * Acuse del boton de copiar de la cabecera de estadisticas. Se comprueba que
   * no sea null: sin eso, «nada copiado» y «nada seleccionado» serian iguales y
   * el acuse aparecería sin que nadie hubiera pulsado nada.
   */
  readonly copiado = computed(() => {
    const copiado = this.portapapeles.ultimoCopiado();
    return copiado !== null && copiado === this.urlCortaSeleccionada();
  });

  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly dataBarPais = signal<SerieGrafica[]>([]);
  readonly dataBarFecha = signal<SerieGrafica[]>([]);
  readonly dataBarDispositivo = signal<SerieGrafica[]>([]);
  readonly dataBarHora = signal<SerieGrafica[]>([]);

  // ── Dimensionado de las graficas ─────────────────────────────────────────
  // Antes el [view] era fijo (500x260 y 980x280) dentro de columnas fluidas:
  // las graficas no cabian en su tarjeta y cada una acababa con su propia barra
  // de scroll. Ahora el ancho lo dicta el contenedor, medido con un
  // ResizeObserver. Va a un signal porque la aplicacion es zoneless: un callback
  // del observador no repintaria nada por su cuenta.
  private readonly contenedorGraficas = viewChild<ElementRef<HTMLElement>>('graficas');
  private readonly anchoPanel = signal(0);

  /** Coincide con el breakpoint de .stats-grid en el CSS del componente. */
  private static readonly UMBRAL_DOS_COLUMNAS = 720;
  /** padding de .chart-card: 22px a cada lado. */
  private static readonly PADDING_TARJETA = 44;
  /** gap de .stats-grid. */
  private static readonly HUECO_REJILLA = 20;

  // ── Grosor de las barras ─────────────────────────────────────────────────
  // ngx-charts no expone un grosor maximo: reparte el eje de bandas entre las
  // categorias con scaleBand y paddingInner. Con UNA sola categoria no hay
  // huecos que repartir, asi que la banda ocupa el 100% del area haga lo que
  // haga [barPadding], y la barra sale como un bloque.
  //
  // Lo que si se controla es el area de trazado, y el grosor va por el eje de
  // bandas: el ALTO en las horizontales y el ANCHO en las verticales. Asi que
  // el tamano de cada grafica se calcula a partir de cuantos datos hay.
  private static readonly ALTO_FILA = 44;      // barra horizontal + su hueco
  private static readonly ANCHO_COLUMNA = 72;  // barra vertical + su hueco
  private static readonly MARGEN_EJE_X = 60;   // etiquetas del eje inferior
  private static readonly MARGEN_EJE_Y = 64;   // etiquetas del eje izquierdo
  private static readonly ALTO_MINIMO = 110;
  private static readonly ALTO_MAXIMO = 420;

  /** Ancho util dentro de una tarjeta de media fila. */
  private readonly anchoMitad = computed(() => {
    const ancho = this.anchoPanel();
    if (ancho <= 0) { return 420; }
    const util = ancho >= DashboardComponent.UMBRAL_DOS_COLUMNAS
      ? (ancho - DashboardComponent.HUECO_REJILLA) / 2
      : ancho;
    return Math.max(240, Math.round(util - DashboardComponent.PADDING_TARJETA));
  });

  /** Ancho util dentro de una tarjeta a fila completa. */
  private readonly anchoCompleto = computed(() => {
    const ancho = this.anchoPanel();
    if (ancho <= 0) { return 860; }
    return Math.max(280, Math.round(ancho - DashboardComponent.PADDING_TARJETA));
  });

  /**
   * Barras horizontales: el alto crece con el numero de paises, asi que cada
   * barra conserva su grosor en lugar de estirarse para llenar la tarjeta.
   */
  readonly vistaPais = computed<[number, number]>(() => {
    const filas = Math.max(1, this.dataBarPais().length);
    const alto = DashboardComponent.MARGEN_EJE_X + filas * DashboardComponent.ALTO_FILA;
    return [this.anchoMitad(), Math.min(
      DashboardComponent.ALTO_MAXIMO,
      Math.max(DashboardComponent.ALTO_MINIMO, alto),
    )];
  });

  /** La tarta reparte un total: no tiene bandas y usa la tarjeta entera. */
  readonly vistaDispositivo = computed<[number, number]>(() => [this.anchoMitad(), 260]);

  readonly vistaMes = computed<[number, number]>(
    () => [this.anchoColumnas(this.dataBarFecha().length), 280]);

  readonly vistaHora = computed<[number, number]>(
    () => [this.anchoColumnas(this.dataBarHora().length), 280]);

  /**
   * Columnas verticales: se pide justo el ancho que necesitan los datos, sin
   * pasar del que hay. Con las 24 franjas horarias sale la tarjeta entera; con
   * un solo mes sale una grafica estrecha, que es lo honesto -y no un bloque
   * de 800px de ancho-.
   */
  private anchoColumnas(cuantos: number): number {
    const necesario = DashboardComponent.MARGEN_EJE_Y
      + Math.max(1, cuantos) * DashboardComponent.ANCHO_COLUMNA;
    return Math.min(this.anchoCompleto(), necesario);
  }

  // Paleta de las graficas. Los valores van literales, no como var(--...):
  // ngx-charts los escribe en atributos SVG, donde una variable CSS no resuelve.
  // Los tres tonos estan elegidos para pasar 3:1 tanto sobre la tarjeta oscura
  // (#141416) como sobre la clara (#ffffff), asi que valen en los dos temas.
  readonly esquemaMono = {
    name: 'shortnees-mono', selectable: false, group: ScaleType.Ordinal,
    domain: ['#00968a'],
  };
  readonly esquemaDispositivo = {
    name: 'shortnees-dispositivo', selectable: false, group: ScaleType.Ordinal,
    domain: ['#00968a', '#7168e0', '#b06a12'],
  };
  /** Relleno plano: el degradado solo anadia ruido sobre la marca. */
  readonly gradient = false;

  constructor() {
    // El contenedor vive dentro de un @if, asi que aparece y desaparece con la
    // seleccion. El effect vuelve a engancharse cada vez que cambia.
    effect((onCleanup) => {
      const elemento = this.contenedorGraficas()?.nativeElement;
      if (!elemento || typeof ResizeObserver === 'undefined') { return; }

      const observador = new ResizeObserver((entradas) => {
        this.medirPanel(entradas[0].contentRect.width);
      });
      observador.observe(elemento);
      onCleanup(() => observador.disconnect());
    });
  }

  /** Copia al portapapeles la url corta que se esta mirando. */
  copiarSeleccionada(): Promise<void> {
    return this.portapapeles.copiar(this.urlCortaSeleccionada() ?? '');
  }

  /**
   * Punto de entrada de la medida del contenedor. Es publico para poder
   * probarlo: si dependiera de que el navegador dispare el ResizeObserver, el
   * test mediria el ancho del runner en vez de un caso concreto.
   */
  medirPanel(ancho: number): void {
    const redondeado = Math.round(ancho);
    if (redondeado > 0) { this.anchoPanel.set(redondeado); }
  }

  ngOnInit(): void {
    this.loadEnlaces();
  }

  loadEnlaces(): void {
    this.linkService.getUserEnlaces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Links[]) => { this.enlaces.set(data); },
        error: (error) => { console.error('Error al cargar los enlaces:', error); }
      });
  }

  seleccionar(enlace: Links): void {
    this.enlaceSeleccionadoId.set(enlace.id);
    this.urlCortaSeleccionada.set(enlace.urlCorta);
    const id = enlace.id;
    this.verEstadisticas(id);
    this.verEstadisticasPais(id);
    this.verEstadisticasFecha(id);
    this.verEstadisticasDispositivo(id);
    this.verEstadisticasHora(id);
  }

  /**
   * Abre el generador de QR con este enlace ya cargado. El QR se sigue
   * generando en cliente: no hay nada que pedir ni que guardar en el servidor.
   */
  verQr(enlace: Links): void {
    this.router.navigate(['/generador'], { queryParams: { url: this.urlAbsoluta(enlace.urlCorta) } });
  }

  /** url_corta se guarda sin protocolo ('shortns.com/abc'), y un QR sin
   *  esquema no abre el navegador al escanearlo. */
  private urlAbsoluta(urlCorta: string): string {
    return /^https?:\/\//i.test(urlCorta) ? urlCorta : `https://${urlCorta}`;
  }

  /** Primer paso del borrado: la fila cambia a "¿Si / No?". */
  pedirConfirmacion(enlace: Links): void {
    this.confirmandoBorradoId.set(enlace.id);
  }

  cancelarBorrado(): void {
    this.confirmandoBorradoId.set(null);
  }

  eliminarEnlace(id: number): void {
    this.linkService.eliminarEnlace(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmandoBorradoId.set(null);
          // Si el borrado era el enlace seleccionado, sus graficas se quedarian
          // en pantalla describiendo algo que ya no existe.
          if (this.enlaceSeleccionadoId() === id) {
            this.limpiarSeleccion();
          }
          this.loadEnlaces();
        },
        error: (error) => {
          this.confirmandoBorradoId.set(null);
          console.error('Error al eliminar el enlace', error);
        }
      });
  }

  private limpiarSeleccion(): void {
    this.enlaceSeleccionadoId.set(null);
    this.urlCortaSeleccionada.set(null);
    this.estadisticas.set(null);
    this.dataBarPais.set([]);
    this.dataBarFecha.set([]);
    this.dataBarDispositivo.set([]);
    this.dataBarHora.set([]);
  }

  private verEstadisticas(id: number): void {
    this.linkService.obtenerEstadisticas(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Estadisticas) => { this.estadisticas.set(data); },
        error: (error) => { console.error('Error al cargar las estadísticas:', error); }
      });
  }

  private verEstadisticasPais(id: number): void {
    this.linkService.obtenerEstadisticasPais(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: SerieGrafica[]) => { this.dataBarPais.set(data); },
        error: (error) => { console.error('Error al cargar estadísticas por país:', error); }
      });
  }

  private verEstadisticasFecha(id: number): void {
    this.linkService.obtenerEstadisticasFecha(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: SerieGrafica[]) => { this.dataBarFecha.set(data); },
        error: (error) => { console.error('Error al cargar estadísticas por fecha:', error); }
      });
  }

  private verEstadisticasDispositivo(id: number): void {
    this.linkService.obtenerEstadisticasDispositivo(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: SerieGrafica[]) => { this.dataBarDispositivo.set(data); },
        error: (error) => { console.error('Error al cargar estadísticas por dispositivo:', error); }
      });
  }

  private verEstadisticasHora(id: number): void {
    this.linkService.obtenerEstadisticasHora(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: SerieGrafica[]) => { this.dataBarHora.set(data); },
        error: (error) => { console.error('Error al cargar estadísticas por hora:', error); }
      });
  }
}
