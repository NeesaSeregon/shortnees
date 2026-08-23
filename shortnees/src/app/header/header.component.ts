import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AccesoService } from '../services/acceso.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public readonly accesoService = inject(AccesoService);

  /**
   * Antes esto era un campo normal que rellenaba una suscripcion manual, con su
   * ngOnInit, su ngOnDestroy y su Subscription guardada a mano.
   *
   * toSignal hace las tres cosas: se suscribe, se desuscribe cuando el
   * componente se destruye, y -por ser un signal- avisa a Angular en cada
   * cambio. Ese aviso es lo que permite usar OnPush sin riesgo: la cabecera se
   * repinta al iniciar o cerrar sesion porque el propio dato lo pide, no porque
   * algo ajeno dispare una comprobacion global.
   */
  public readonly isLoggedIn = toSignal(this.accesoService.isAuthenticated$, { initialValue: false });

  /** AccesoService.logout() ya navega a /login; no hay que navegar otra vez. */
  logout() {
    this.accesoService.logout();
  }
}
