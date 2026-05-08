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
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasSession());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private userData: UserData | null = null;

  constructor(private router: Router) {
    const storedUser = localStorage.getItem('userData');
    this.userData = storedUser ? JSON.parse(storedUser) : null;
  }

  private getUserFromAPI(objeto: Login): any | null {
    return this.http.post<UserData>(`${this.baseUrl}login`, objeto);
  }

  login(objeto: Login): Observable<ResponseAcceso> {
    this.getUserFromAPI(objeto).subscribe({
      next: (data: UserData) => {
        this.userData = data;
        localStorage.setItem('userData', JSON.stringify(data));
      }
    });
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
    return parseInt(exp) * 1000 > Date.now();
  }

  registrarse(objeto: Usuario): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}registro`, objeto);
  }

  // Decodifica el token solo para extraer exp; el token nunca se guarda en localStorage
  authSuccess(token: string) {
    try {
      const decoded: any = jwtDecode(token);
      localStorage.setItem('tokenExp', String(decoded.exp));
    } catch {}
    this.isAuthenticatedSubject.next(true);
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
