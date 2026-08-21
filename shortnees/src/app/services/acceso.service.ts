import { Injectable, inject } from '@angular/core';
import { ResponseAcceso } from '../interfaces/ResponseAcceso';
import { HttpClient } from '@angular/common/http';
import { appsettings } from '../settings/appsettings';
import { Usuario } from '../interfaces/Usuario';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Login } from '../interfaces/Login';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface UserData {
  nombre: string;
  email: string;
  rol: string[];
}

/** Lo que el backend mete en el payload del JWT. Ver AnadirNombreAlJwt. */
interface PayloadJwt {
  exp?: number;
  username?: string;
  roles?: string[];
  nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccesoService {
  private http = inject(HttpClient);
  private baseUrl: string = appsettings.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasSession());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private userData: UserData | null = null;

  constructor(private router: Router) {
    const storedUser = localStorage.getItem('userData');
    this.userData = storedUser ? JSON.parse(storedUser) : null;
  }

  /**
   * Una sola peticion: el firewall valida las credenciales, emite el JWT en la
   * cookie BEARER y lo devuelve tambien en el cuerpo. Nombre, email y roles
   * salen del propio payload, asi que no hace falta preguntarlos aparte.
   */
  login(objeto: Login): Observable<ResponseAcceso> {
    return this.http.post<ResponseAcceso>(`${this.baseUrl}api/login_check`, objeto).pipe(
      map((res: any) => {
        this.authSuccess(res.token);
        return res;
      })
    );
  }

  // Comprueba si hay una sesión activa usando el timestamp de expiración
  private hasSession(): boolean {
    const exp = localStorage.getItem('tokenExp');
    if (!exp) return false;
    const caducidad = parseInt(exp, 10);
    if (Number.isNaN(caducidad)) return false;
    return caducidad * 1000 > Date.now();
  }

  registrarse(objeto: Usuario): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}registro`, objeto);
  }

  // Decodifica el token para extraer exp y el perfil; el token nunca se guarda en localStorage
  authSuccess(token: string) {
    try {
      const decoded = jwtDecode<PayloadJwt>(token);
      localStorage.setItem('tokenExp', String(decoded.exp));
      this.guardarPerfil(decoded);
    } catch {}
    this.isAuthenticatedSubject.next(true);
  }

  /** El payload es la unica fuente del perfil desde que se elimino /login. */
  private guardarPerfil(payload: PayloadJwt): void {
    const datos: UserData = {
      nombre: payload.nombre ?? '',
      email: payload.username ?? '',
      rol: payload.roles ?? [],
    };
    this.userData = datos;
    localStorage.setItem('userData', JSON.stringify(datos));
  }

  logout(): void {
    localStorage.removeItem('tokenExp');
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
    localStorage.removeItem('userData');
    this.userData = null;
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['login']);
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.getValue();
  }

  get currentUserValue() {
    return this.userData;
  }
}
