import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccesoService } from '../services/acceso.service';
import { IconoComponent } from '../icono/icono.component';

/** La misma que RecuperarContrasenaController::LONGITUD_MINIMA. La API manda;
 *  esto solo evita un viaje para un error que ya se ve aqui. */
export const LONGITUD_MINIMA = 8;

/**
 * Segundo paso: el enlace del correo trae aqui con ?token=... y se elige la
 * contraseña nueva. El token no se valida al entrar: la API lo hace al enviar,
 * y es la unica que sabe si ha caducado o ya se uso.
 */
@Component({
  selector: 'app-restablecer',
  imports: [ReactiveFormsModule, RouterLink, IconoComponent],
  templateUrl: './restablecer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './restablecer.component.css'
})
export class RestablecerComponent {
  private readonly accesoService = inject(AccesoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  readonly longitudMinima = LONGITUD_MINIMA;

  readonly error = signal('');
  readonly hecho = signal(false);
  readonly enviando = signal(false);

  formulario = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(LONGITUD_MINIMA)]),
    confirmacion: new FormControl('', Validators.required)
  });

  guardar(): void {
    const { password, confirmacion } = this.formulario.value;

    if (this.formulario.invalid) {
      this.error.set(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (password !== confirmacion) {
      this.error.set('Las dos contraseñas no coinciden.');
      return;
    }

    this.error.set('');
    this.enviando.set(true);

    this.accesoService.restablecerContrasena(this.token, password ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.hecho.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          // El 400 de la API trae un mensaje pensado para el usuario
          // (caducado, ya usado o corta); cualquier otro fallo, uno generico.
          this.error.set(err.status === 400 && err.error?.mensaje
            ? err.error.mensaje
            : 'No se ha podido cambiar la contraseña. Inténtalo de nuevo en unos minutos.');
        }
      });
  }
}
