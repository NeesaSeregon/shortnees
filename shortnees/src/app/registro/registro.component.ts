import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccesoService } from '../services/acceso.service';
import { Usuario } from '../interfaces/Usuario';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  private readonly router = inject(Router);
  private readonly accesoService = inject(AccesoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly error = signal('');

  formularioRegistro = new FormGroup({
    nombre: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });

  submit(): void {
    if (this.formularioRegistro.invalid) {
      this.error.set('Rellene todos los campos.');
      return;
    }

    const user: Usuario = {
      nombre: this.formularioRegistro.value.nombre ?? '',
      email: this.formularioRegistro.value.email ?? '',
      password: this.formularioRegistro.value.password ?? ''
    };

    this.accesoService.registrarse(user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.router.navigate(['/login']); },
        // Faltaba: la plantilla ya tenia el hueco del mensaje, pero la
        // suscripcion no tenia rama de error, asi que /registro devolvia 400
        // ante un correo repetido y el formulario se quedaba mudo.
        error: () => {
          this.error.set('No se ha podido crear la cuenta. Puede que ese correo ya esté registrado.');
        }
      });
  }
}
