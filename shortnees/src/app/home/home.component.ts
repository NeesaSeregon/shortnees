import { Component, DestroyRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LinkService } from '../services/link.service';
import { LinkResponse } from '../interfaces/link-response';
import { AccesoService } from '../services/acceso.service';
import { PortapapelesService } from '../services/portapapeles.service';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, IconoComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly linkService = inject(LinkService);
  private readonly fb = inject(FormBuilder);
  private readonly accesoService = inject(AccesoService);
  private readonly portapapeles = inject(PortapapelesService);
  private readonly destroyRef = inject(DestroyRef);

  // Los cuatro mensajes se rellenan desde callbacks de RxJS, asi que van en
  // signals: con OnPush, asignarlos a un campo normal no repintaria nada.
  readonly shortUrl = signal('');
  readonly error = signal('');
  readonly shortUrlP = signal('');
  readonly errorP = signal('');

  /**
   * Acuse del boton de copiar. Se compara con la URL que hay en pantalla, no
   * con un booleano global: asi el acuse no se enciende por algo que se copio
   * en otra pantalla.
   */
  readonly copiado = computed(() => {
    const copiado = this.portapapeles.ultimoCopiado();
    return copiado !== null && (copiado === this.shortUrl() || copiado === this.shortUrlP());
  });

  readonly isAuthenticated = toSignal(this.accesoService.isAuthenticated$, { initialValue: false });

  readonly formulario: FormGroup = this.fb.group({
    url: ['', Validators.required]
  });

  readonly formularioPersonalizar: FormGroup = this.fb.group({
    urlOriginal: ['', Validators.required],
    urlPersonalizada: ['', Validators.required]
  });

  /** Copia la URL corta al portapapeles. El panel de control hace lo mismo. */
  copiar(url: string): Promise<void> {
    return this.portapapeles.copiar(url);
  }

  /**
   * url_corta se guarda sin protocolo ('shortns.com/abc'), y un QR sin esquema
   * no abre el navegador al escanearlo. Misma regla que en el panel.
   */
  urlAbsoluta(urlCorta: string): string {
    return /^https?:\/\//i.test(urlCorta) ? urlCorta : `https://${urlCorta}`;
  }

  acortar(): void {
    if (!this.formulario.valid) {
      return;
    }

    this.linkService.enviarLink(this.formulario.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // La API responde 200 aunque haya error: el error viaja en 'mensaje' y
        // se discrimina comparando cadenas. Si se tocan esos textos en el
        // backend, esto deja de funcionar (ver la seccion Backend de CLAUDE.md).
        next: (data: LinkResponse) => {
          if (data.urlCorta === 'protocolo') {
            this.error.set(data.mensaje);
            this.shortUrl.set('');
          } else if (data.mensaje === 'Enlace creado') {
            this.shortUrl.set(data.urlCorta);
            this.error.set('');
          } else {
            this.error.set(data.mensaje);
            this.shortUrl.set('');
          }
        },
        error: () => {
          this.error.set('No se pudo acortar el enlace. Intentelo de nuevo.');
          this.shortUrl.set('');
        }
      });
  }

  personalizar(): void {
    if (!this.formularioPersonalizar.valid) {
      return;
    }

    this.linkService.personalizarLink(this.formularioPersonalizar.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: LinkResponse) => {
          if (data.urlCorta === 'protocolo') {
            this.errorP.set(data.mensaje);
          } else if (data.mensaje === 'Enlace creado') {
            this.shortUrlP.set(data.urlCorta);
            this.errorP.set(data.mensaje);
          } else {
            this.errorP.set(data.mensaje);
          }
        },
        error: () => {
          this.errorP.set('No se pudo crear el enlace. Intentelo de nuevo.');
          this.shortUrlP.set('');
        }
      });
  }
}
