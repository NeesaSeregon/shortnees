import { Injectable, inject } from '@angular/core';
import { ResponseAcceso } from '../interfaces/ResponseAcceso';
import { HttpClient } from '@angular/common/http';
import { appsettings } from '../settings/appsettings';
import { Usuario } from '../interfaces/Usuario';
import { Observable } from 'rxjs';
import { Login } from '../interfaces/Login';
import { Links } from '../interfaces/Links';
import { Url } from '../interfaces/Url';
import { LinkResponse } from '../interfaces/link-response';
import { Urls } from '../interfaces/Urls';
import { Estadisticas } from '../interfaces/estadisticas';
@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private http = inject(HttpClient);
  private baseUrl: string = appsettings.apiUrl;
  constructor() { }

  enviarLink(url:Url): Observable<LinkResponse>{
    return this.http.post<LinkResponse>(`${this.baseUrl}acortarUrl`,url)
  }
  personalizarLink(urls:Urls): Observable<LinkResponse>{
    return this.http.post<LinkResponse>(`${this.baseUrl}personalizarUrl`,urls)
  }
  getUserEnlaces(): Observable<Links> {
    return this.http.get<Links>(`${this.baseUrl}enlaces-usuario`);
  }
  eliminarEnlace(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}eliminar-enlace/${id}`);
  }
  obtenerEstadisticas(id: number): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.baseUrl}estadisticas/${id}`);
  }
}
