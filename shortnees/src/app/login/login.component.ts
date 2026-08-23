import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { AccesoService } from '../services/acceso.service';
import { Login } from '../interfaces/Login';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);
  private accesoService = inject(AccesoService);
  public formBuild = inject(FormBuilder);
  public error:string='';
  public formularioLogin: FormGroup = this.formBuild.group({
    correo: ['',Validators.required],
    password: ['',Validators.required]
  });

  iniciarSesion(){
    if(this.formularioLogin.invalid){
      this.error = 'Introduzca sus datos de usuario.';
      return;
    };
    
    const objeto:Login= {
      username: this.formularioLogin.value.correo,
      password: this.formularioLogin.value.password
    }
    
    this.accesoService.login(objeto).subscribe({
      next: () => {
        this.router.navigate(['home']);
      },
      error: () => {
        this.error = 'Credenciales incorrectas';
      }
    })
  }
  registrarse () {
    this.router.navigate(["registro"]);
  }
}