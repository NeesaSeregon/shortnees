import { Component, OnInit, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';
import { Estadisticas } from '../interfaces/estadisticas';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SerieGrafica } from '../interfaces/serie-grafica';

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

  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly dataBarPais = signal<SerieGrafica[]>([]);
  readonly dataBarFecha = signal<SerieGrafica[]>([]);
  readonly dataBarDispositivo = signal<SerieGrafica[]>([]);
  readonly dataBarHora = signal<SerieGrafica[]>([]);

  // Constantes de presentacion: no cambian nunca, no necesitan ser signals.
  readonly view: [number, number] = [500, 260];
  readonly viewHora: [number, number] = [980, 280];
  readonly gradient = true;

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
