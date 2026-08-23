import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  enlaces: Links[] = [];
  enlaceSeleccionadoId: number | null = null;
  urlCortaSeleccionada: string | null = null;
  /** Id del enlace cuya fila esta pidiendo confirmacion de borrado, si hay alguna. */
  confirmandoBorradoId: number | null = null;

  estadisticas: Estadisticas | null = null;
  dataBarPais: SerieGrafica[] = [];
  dataBarFecha: SerieGrafica[] = [];
  dataBarDispositivo: SerieGrafica[] = [];
  dataBarHora: SerieGrafica[] = [];

  view: [number, number] = [500, 260];
  viewHora: [number, number] = [980, 280];
  gradient: boolean = true;

  constructor(private linkService: LinkService, private router: Router) {}

  ngOnInit(): void {
    this.loadEnlaces();
  }

  loadEnlaces(): void {
    this.linkService.getUserEnlaces().subscribe({
      next: (data: Links[]) => { this.enlaces = data; },
      error: (error) => { console.error('Error al cargar los enlaces:', error); }
    });
  }

  seleccionar(enlace: Links): void {
    this.enlaceSeleccionadoId = enlace.id;
    this.urlCortaSeleccionada = enlace.urlCorta;
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
    this.confirmandoBorradoId = enlace.id;
  }

  cancelarBorrado(): void {
    this.confirmandoBorradoId = null;
  }

  eliminarEnlace(id: number): void {
    this.linkService.eliminarEnlace(id).subscribe({
      next: () => {
        this.confirmandoBorradoId = null;
        // Si el borrado era el enlace seleccionado, sus graficas se quedarian
        // en pantalla describiendo algo que ya no existe.
        if (this.enlaceSeleccionadoId === id) {
          this.limpiarSeleccion();
        }
        this.loadEnlaces();
      },
      error: (error) => {
        this.confirmandoBorradoId = null;
        console.error('Error al eliminar el enlace', error);
      }
    });
  }

  private limpiarSeleccion(): void {
    this.enlaceSeleccionadoId = null;
    this.urlCortaSeleccionada = null;
    this.estadisticas = null;
    this.dataBarPais = [];
    this.dataBarFecha = [];
    this.dataBarDispositivo = [];
    this.dataBarHora = [];
  }

  private verEstadisticas(id: number): void {
    this.linkService.obtenerEstadisticas(id).subscribe({
      next: (data: Estadisticas) => { this.estadisticas = data; },
      error: (error) => { console.error('Error al cargar las estadísticas:', error); }
    });
  }

  private verEstadisticasPais(id: number): void {
    this.linkService.obtenerEstadisticasPais(id).subscribe({
      next: (data: SerieGrafica[]) => { this.dataBarPais = data; },
      error: (error) => { console.error('Error al cargar estadísticas por país:', error); }
    });
  }

  private verEstadisticasFecha(id: number): void {
    this.linkService.obtenerEstadisticasFecha(id).subscribe({
      next: (data: SerieGrafica[]) => { this.dataBarFecha = data; },
      error: (error) => { console.error('Error al cargar estadísticas por fecha:', error); }
    });
  }

  private verEstadisticasDispositivo(id: number): void {
    this.linkService.obtenerEstadisticasDispositivo(id).subscribe({
      next: (data: SerieGrafica[]) => { this.dataBarDispositivo = data; },
      error: (error) => { console.error('Error al cargar estadísticas por dispositivo:', error); }
    });
  }

  private verEstadisticasHora(id: number): void {
    this.linkService.obtenerEstadisticasHora(id).subscribe({
      next: (data: SerieGrafica[]) => { this.dataBarHora = data; },
      error: (error) => { console.error('Error al cargar estadísticas por hora:', error); }
    });
  }
}
