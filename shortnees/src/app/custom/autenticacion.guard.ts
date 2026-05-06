import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AccesoService } from '../services/acceso.service';
import { ResolverTokenService } from '../services/resolver-token.service';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionGuard implements CanActivate {

  constructor(
    private accesoService: AccesoService,
    private resolverTokenService: ResolverTokenService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.accesoService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }
    if (this.resolverTokenService.isTokenExpired()) {
      this.accesoService.logout();
      return false;
    }
    return true;
  }
}
