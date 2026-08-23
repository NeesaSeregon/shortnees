import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LinkService } from '../services/link.service';
import { LinkResponse } from '../interfaces/link-response';
import { AccesoService } from '../services/acceso.service';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly linkService = inject(LinkService);
  private readonly fb = inject(FormBuilder);
  private readonly accesoService = inject(AccesoService);
  private readonly destroyRef = inject(DestroyRef);

  // Los cuatro mensajes se rellenan desde callbacks de RxJS, asi que van en
  // signals: con OnPush, asignarlos a un campo normal no repintaria nada.
  readonly shortUrl = signal('');
  readonly error = signal('');
  readonly shortUrlP = signal('');
  readonly errorP = signal('');

  readonly isAuthenticated = toSignal(this.accesoService.isAuthenticated$, { initialValue: false });

  readonly formulario: FormGroup = this.fb.group({
    url: ['', Validators.required]
  });

  readonly formularioPersonalizar: FormGroup = this.fb.group({
    urlOriginal: ['', Validators.required],
    urlPersonalizada: ['', Validators.required]
  });

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
