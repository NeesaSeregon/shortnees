import { Component, OnInit } from '@angular/core';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';
import { Estadisticas } from '../interfaces/estadisticas';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { EstadisticasPais } from '../interfaces/estadisticas-pais';
import { EstadisticasFecha } from '../interfaces/estadisticas-fecha';
import { EstadisticasDispositivo } from '../interfaces/estadisticas-dispositivo';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  enlaces: Links[] = [];
  enlaceSeleccionadoId: number | null = null;
  urlCortaSeleccionada: String | null = null;

  estadisticas: Estadisticas | null = null;
  dataBarPais: any = [];
  dataBarFecha: any = [];
  dataBarDispositivo: any = [];

  view: [number, number] = [500, 260];
  gradient: boolean = true;

  constructor(private linkService: LinkService) {}

  ngOnInit(): void {
    this.loadEnlaces();
  }

  loadEnlaces(): void {
    this.linkService.getUserEnlaces().subscribe({
      next: (data: any) => { this.enlaces = data; },
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
  }

  eliminarEnlace(id: number): void {
    this.linkService.eliminarEnlace(id).subscribe({
      next: () => this.loadEnlaces(),
      error: (error) => { console.error('Error al eliminar el enlace', error); }
    });
  }

  private verEstadisticas(id: number): void {
    this.linkService.obtenerEstadisticas(id).subscribe({
      next: (data: Estadisticas) => { this.estadisticas = data; },
      error: (error) => { console.error('Error al cargar las estadísticas:', error); }
    });
  }

  private verEstadisticasPais(id: number): void {
    this.linkService.obtenerEstadisticasPais(id).subscribe({
      next: (data: EstadisticasPais) => { this.dataBarPais = data; },
      error: (error) => { console.error('Error al cargar estadísticas por país:', error); }
    });
  }

  private verEstadisticasFecha(id: number): void {
    this.linkService.obtenerEstadisticasFecha(id).subscribe({
      next: (data: EstadisticasFecha) => { this.dataBarFecha = data; },
      error: (error) => { console.error('Error al cargar estadísticas por fecha:', error); }
    });
  }

  private verEstadisticasDispositivo(id: number): void {
    this.linkService.obtenerEstadisticasDispositivo(id).subscribe({
      next: (data: EstadisticasDispositivo) => { this.dataBarDispositivo = data; },
      error: (error) => { console.error('Error al cargar estadísticas por dispositivo:', error); }
    });
  }
}
