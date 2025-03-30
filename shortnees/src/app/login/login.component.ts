import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { AccesoService } from '../services/acceso.service';
import { Login } from '../interfaces/Login';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { ResolverTokenService } from '../services/resolver-token.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterOutlet,ReactiveFormsModule, CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);
  private accesoService = inject(AccesoService)
  public formBuild = inject(FormBuilder);
  public resolverTokenService = inject(ResolverTokenService);
  public formularioLogin: FormGroup = this.formBuild.group({
    correo: ['',Validators.required],
    password: ['',Validators.required]
  })
  constructor(private resolverToken: ResolverTokenService) {}
  iniciarSesion(){
    if(this.formularioLogin.invalid) return;
    const objeto:Login= {
      username: this.formularioLogin.value.correo,
      password: this.formularioLogin.value.password
    }
    this.accesoService.login(objeto).subscribe({
      next:(data)=>{
        console.log(data);
        if(data.token){
          localStorage.setItem("token", data.token)
        }else{
          alert("Credenciales incorrectas")
        }
        this.router.navigate(['wellcome']);
      },
      error:(error) => {
        console.log(error.message);
      }
    })
  }
  registrarse () {
    this.router.navigate(["registro"]);
  }
}