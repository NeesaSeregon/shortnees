import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ResolverTokenService } from '../services/resolver-token.service';  // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class AutenticacionGuard implements CanActivate {

  constructor(private ResolverTokenService: ResolverTokenService, private router: Router) {}

  canActivate(): boolean {
    const isAuthenticated = this.ResolverTokenService.isLoggedIn(); // Verifica si el usuario está autenticado
    if (!isAuthenticated) {
      this.router.navigate(['/login']); // Redirige al login si no está autenticado
      return false;
    }
    return true; // Permite el acceso si está autenticado
  }
}
