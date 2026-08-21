import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { appsettings } from '../settings/appsettings';
import { Observable } from 'rxjs';
import { Links } from '../interfaces/Links';
import { Url } from '../interfaces/Url';
import { LinkResponse } from '../interfaces/link-response';
import { Urls } from '../interfaces/Urls';
import { Estadisticas } from '../interfaces/estadisticas';
import { SerieGrafica } from '../interfaces/serie-grafica';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private http = inject(HttpClient);
  private baseUrl: string = appsettings.apiUrl;

  enviarLink(url: Url): Observable<LinkResponse> {
    return this.http.post<LinkResponse>(`${this.baseUrl}acortarUrl`, url);
  }

  personalizarLink(urls: Urls): Observable<LinkResponse> {
    return this.http.post<LinkResponse>(`${this.baseUrl}personalizarUrl`, urls);
  }

  getUserEnlaces(): Observable<Links[]> {
    return this.http.get<Links[]>(`${this.baseUrl}enlaces-usuario`);
  }

  eliminarEnlace(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}eliminar-enlace/${id}`);
  }

  obtenerEstadisticas(id: number): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.baseUrl}estadisticas/${id}`);
  }

  obtenerEstadisticasPais(id: number): Observable<SerieGrafica[]> {
    return this.http.get<SerieGrafica[]>(`${this.baseUrl}estadisticas_pais/${id}`);
  }

  obtenerEstadisticasFecha(id: number): Observable<SerieGrafica[]> {
    return this.http.get<SerieGrafica[]>(`${this.baseUrl}estadisticas_fecha/${id}`);
  }

  obtenerEstadisticasDispositivo(id: number): Observable<SerieGrafica[]> {
    return this.http.get<SerieGrafica[]>(`${this.baseUrl}estadisticas_dispositivo/${id}`);
  }

  obtenerEstadisticasHora(id: number): Observable<SerieGrafica[]> {
    return this.http.get<SerieGrafica[]>(`${this.baseUrl}estadisticas_hora/${id}`);
  }
}
