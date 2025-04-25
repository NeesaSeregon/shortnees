import { Component, signal } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service'
import { Subscription } from 'rxjs';;
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private router = inject(Router);
  private resolverToken = inject(ResolverTokenService);
  public isLoggedIn : any = false;
  private authSubscription: Subscription | undefined;
  //isLoggedIn = signal(false);
  username: string | undefined;
  roles: string[] | undefined;
  constructor(private accesoService: AccesoService) {}
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
