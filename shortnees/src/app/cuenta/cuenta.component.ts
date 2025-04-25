import { Component, OnInit, signal } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service'
import { Subscription } from 'rxjs';
import { Usuario } from '../interfaces/Usuario';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [NgIf, CommonModule],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent {
  private resolverToken = inject(ResolverTokenService);
  public isLoggedIn : any = false;
  private authSubscription: Subscription | undefined;
  constructor(public accesoService: AccesoService,private router: Router) {}
  ngOnInit() {
    this.authSubscription = this.accesoService.isAuthenticated$.subscribe(
      (isAuthenticated) => {
        this.isLoggedIn = isAuthenticated;
      }
    );
  }
  logout() {
    this.accesoService.logout();
    this.router.navigate(['/login']);
  }
  ngOnDestroy(): void {
    // Importante: cancelar la suscripción para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
