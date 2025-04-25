import { Component, OnInit, signal } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service'
import { Subscription } from 'rxjs';import { Usuario } from '../interfaces/Usuario';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgIf,MatListModule,MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  private resolverToken = inject(ResolverTokenService);
  public isLoggedIn : any = false;
  private authSubscription: Subscription | undefined;
  constructor(public accesoService: AccesoService) {}
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
