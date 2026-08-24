import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccesoService } from '../services/acceso.service';
import { Login } from '../interfaces/Login';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);
  private accesoService = inject(AccesoService);
  public formBuild = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  public readonly error = signal('');
  public formularioLogin: FormGroup = this.formBuild.group({
    correo: ['',Validators.required],
    password: ['',Validators.required]
  });

  iniciarSesion(){
    if(this.formularioLogin.invalid){
      this.error.set('Introduzca sus datos de usuario.');
      return;
    };
    
    const objeto:Login= {
      username: this.formularioLogin.value.correo,
      password: this.formularioLogin.value.password
    }
    
    this.accesoService.login(objeto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['home']);
        },
        error: () => {
          this.error.set('Credenciales incorrectas');
        }
      });
  }
}