import { Component, OnInit } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  public isLoggedIn: any = false;
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
