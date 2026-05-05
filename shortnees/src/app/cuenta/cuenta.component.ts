import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemaService } from '../services/tema.service';
import { LinkService } from '../services/link.service';

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authSubscription: Subscription | undefined;

  totalEnlaces: number = 0;
  seleccionarTema: string = 'dark';

  temas = [
    { value: 'dark',  label: 'Oscuro' },
    { value: 'light', label: 'Claro'  },
    { value: 'blue',  label: 'Azul'   },
  ];

  constructor(
    public accesoService: AccesoService,
    private temaService: TemaService,
    private linkService: LinkService,
  ) {}

  ngOnInit() {
    this.seleccionarTema = this.temaService.getTheme();
    this.authSubscription = this.accesoService.isAuthenticated$.subscribe(
      (isAuthenticated) => { if (!isAuthenticated) this.router.navigate(['/login']); }
    );
    this.linkService.getUserEnlaces().subscribe({
      next: (data: any) => { this.totalEnlaces = data.length; },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  get iniciales(): string {
    const nombre = this.accesoService.currentUserValue?.nombre ?? '';
    return nombre.slice(0, 2).toUpperCase();
  }

  get rolLabel(): string {
    const rol = this.accesoService.currentUserValue?.rol;
    if (!rol) return '';
    const raw = Array.isArray(rol) ? rol[0] : rol;
    return raw.replace('ROLE_', '').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
  }

  onThemeChange(theme: string) {
    this.seleccionarTema = theme;
    this.temaService.setTheme(theme);
  }

  logout() {
    this.accesoService.logout();
  }
}
