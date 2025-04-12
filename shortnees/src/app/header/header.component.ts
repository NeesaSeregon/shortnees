import { Component, signal } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private accesoService = inject(AccesoService)
  private router = inject(Router);
  private resolverToken = inject(ResolverTokenService);
  public isLoggedIn : any;
  public userName :any;
  //isLoggedIn = signal(false);
  username: string | undefined;
  roles: string[] | undefined;

  ngOnInit() {
    //this.isLoggedIn = this.resolverToken.isLoggedIn();
    this.isLoggedIn = this.accesoService.loginStatus;
    this.userName = this.accesoService.userNames;
    const user = this.resolverToken.getUser();
    if (user) {
      this.username = user.username;
      this.roles = user.roles;
    }
  }
  logout() {
    this.accesoService.logout();
    this.router.navigate(['/login']);
  }
}
