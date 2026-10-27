import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccesoService } from '../services/acceso.service';
import { IconoComponent } from '../icono/icono.component';

/**
 * Primer paso de la recuperacion: pedir el correo con el enlace.
 *
 * El acuse es el mensaje que devuelve la API, que es identico exista o no la
 * cuenta. La pagina no debe añadir nada que lo distinga.
 */
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink, IconoComponent],
  templateUrl: './recuperar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './recuperar.component.css'
})
export class RecuperarComponent {
  private readonly accesoService = inject(AccesoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly error = signal('');
  readonly acuse = signal('');
  readonly enviando = signal(false);

  formulario = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.error.set('Escribe el correo con el que te registraste.');
      return;
    }

    this.error.set('');
    this.enviando.set(true);

    this.accesoService.solicitarRecuperacion(this.formulario.value.email ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          this.acuse.set(respuesta.mensaje);
        },
        error: () => {
          this.enviando.set(false);
          this.error.set('No se ha podido enviar la solicitud. Inténtalo de nuevo en unos minutos.');
        }
      });
  }
}
