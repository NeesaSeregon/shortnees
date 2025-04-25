import { Injectable, effect, inject, signal } from '@angular/core';
import { ResponseAcceso } from '../interfaces/ResponseAcceso';
import { HttpClient } from '@angular/common/http';
import { appsettings } from '../settings/appsettings';
import { Usuario } from '../interfaces/Usuario';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Login } from '../interfaces/Login';
import { ResolverTokenService } from './resolver-token.service';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AccesoService {
  private http = inject(HttpClient);
  private baseUrl: string = appsettings.apiUrl;
  // BehaviorSubject para mantener y compartir el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  // Observable público que los componentes pueden suscribir
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  constructor(
    private router: Router,
    private resolverToken: ResolverTokenService
  ) { }
  // Verifica si hay un token almacenado
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
  registrarse(objeto:Usuario): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}registro`,objeto)
  }
  login(objeto:Login): Observable<ResponseAcceso>{
    //this.userName.set(objeto.username);
    return this.http.post<ResponseAcceso>(`${this.baseUrl}api/login_check`,objeto).pipe(
      map((res: any) => {
        this.authSuccess(res.access_token);
        return res;
      })
    );
  }
  
  // Método llamado al autenticar exitosamente
  authSuccess(token: string) {
    localStorage.setItem('token', token);
    this.resolverToken.getUsername()
    
    /*
    ocuparse aqui de nombre de usuario y opciones
    
    */ 
    // Actualiza el BehaviorSubject a true
    this.isAuthenticatedSubject.next(true);
  }
  logout(): void {
    localStorage.removeItem("token"); // Elimina el token del localStorage
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
    this.router.navigate(['login']);
  }
}
