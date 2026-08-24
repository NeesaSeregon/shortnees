import { Component, OnInit, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccesoService } from '../services/acceso.service';
import { Router, RouterLink } from '@angular/router';
import { TemaService } from '../services/tema.service';
import { Links } from '../interfaces/Links';
import { LinkService } from '../services/link.service';

@Component({
  selector: 'app-cuenta',
  imports: [RouterLink],
  templateUrl: './cuenta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals: cada set() avisa a Angular, que es lo que hace segura la
  // estrategia OnPush de este componente.
  readonly totalEnlaces = signal(0);
  readonly seleccionarTema = signal('dark');

  // El tema azul se retiro: su combinacion (#00FFFF sobre #007171) no llegaba
  // al contraste minimo y no encajaba con el resto del sistema visual.
  temas = [
    { value: 'dark',  label: 'Oscuro', icono: 'bi-moon-stars' },
    { value: 'light', label: 'Claro',  icono: 'bi-sun'        },
  ];

  constructor(
    public accesoService: AccesoService,
    private temaService: TemaService,
    private linkService: LinkService,
  ) {}

  ngOnInit() {
    this.seleccionarTema.set(this.temaService.getTheme());

    // takeUntilDestroyed sustituye a la Subscription guardada a mano y al
    // ngOnDestroy que la cancelaba. Esta suscripcion no pinta nada: solo echa
    // al visitante si pierde la sesion.
    this.accesoService.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isAuthenticated) => {
        if (!isAuthenticated) { this.router.navigate(['/login']); }
      });

    this.linkService.getUserEnlaces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Links[]) => { this.totalEnlaces.set(data.length); },
        error: () => {}
      });
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
    this.seleccionarTema.set(theme);
    this.temaService.setTheme(theme);
  }

  logout() {
    this.accesoService.logout();
  }
}
