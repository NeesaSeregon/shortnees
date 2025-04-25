import { Injectable, effect, inject, signal } from '@angular/core';
import { ResponseAcceso } from '../interfaces/ResponseAcceso';
import { HttpClient } from '@angular/common/http';
import { appsettings } from '../settings/appsettings';
import { Usuario } from '../interfaces/Usuario';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Login } from '../interfaces/Login';
import { ResolverTokenService } from './resolver-token.service';
import { Router } from '@angular/router';
interface UserData {
  nombre: any;
  email: any;
  rol: any;
}
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
  private authToken: string | null = null;
  private userData: UserData | null = null;
  constructor(
    private router: Router,
    private resolverToken: ResolverTokenService
  ) { 
    this.initializeFromLocalStorage();
    const storedUser = localStorage.getItem('userData');
    this.userData = storedUser ? JSON.parse(storedUser) : null;
  }
  //inicializamos la informacion
  private initializeFromLocalStorage(): void {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      this.authToken = token;
    }
  }
  private getUserFromAPI(objeto:Login): any | null {
    return this.http.post<UserData>(`${this.baseUrl}login`,objeto);
  }
  login(objeto:Login): Observable<ResponseAcceso>{
    this.getUserFromAPI(objeto).subscribe({
      next: (data: UserData) => {
        this.userData = data;
        localStorage.setItem('userData', JSON.stringify(data));
      }
    });
    return this.http.post<ResponseAcceso>(`${this.baseUrl}api/login_check`,objeto).pipe(
      map((res: any) => {
        this.authSuccess(res.access_token);
        return res;
      })
    );
  }
  // Verifica si hay un token almacenado
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
  registrarse(objeto:Usuario): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}registro`,objeto)
  }
  
  // Método llamado al autenticar exitosamente
  authSuccess(token: string) {
    localStorage.setItem('token', token);
    this.authToken = token;
    // Actualiza el BehaviorSubject a true
    this.isAuthenticatedSubject.next(true);
  }
  logout(): void {
    localStorage.removeItem("token"); // Elimina el token del localStorage
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
    localStorage.removeItem('userData');
    this.userData = null;
    this.router.navigate(['login']);
  }
  get currentUserValue() {
    return this.userData;
  }
}
