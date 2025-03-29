import { Injectable, effect, inject, signal } from '@angular/core';
import { ResponseAcceso } from '../interfaces/ResponseAcceso';
import { HttpClient } from '@angular/common/http';
import { appsettings } from '../settings/appsettings';
import { Usuario } from '../interfaces/Usuario';
import { Observable } from 'rxjs';
import { Login } from '../interfaces/Login';
@Injectable({
  providedIn: 'root'
})
export class AccesoService {
  private http = inject(HttpClient);
  private baseUrl: string = appsettings.apiUrl;
  private isLoggedIn = signal(false);
  private userName = signal<string>('');
  constructor() { 
    this.checkInitialAuthState();
    const storedUserName = localStorage.getItem('email');
    this.userName.set(storedUserName || '');
    effect(() => {
      localStorage.setItem('isLoggedIn', this.isLoggedIn().toString());
      localStorage.setItem('userName', this.userName().toString());
    });
  }
  registrarse(objeto:Usuario): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}registro`,objeto)
  }
  login(objeto:Login): Observable<ResponseAcceso>{
    this.userName.set(objeto.username);
    return this.http.post<ResponseAcceso>(`${this.baseUrl}api/login_check`,objeto)
  }
  get loginStatus() {
    return this.isLoggedIn.asReadonly();
  }
  get userNames() {
    return this.userName.asReadonly();
  }
  private checkInitialAuthState() {
    // Lógica para verificar si el usuario ya está autenticado
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn.set(true);
    }
  }

  logout(): void {
    localStorage.removeItem("token"); // Elimina el token del localStorage
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
    this.isLoggedIn.set(false);
  }
}
