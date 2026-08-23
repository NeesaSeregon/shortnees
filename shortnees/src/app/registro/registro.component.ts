
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterOutlet, Router } from '@angular/router';
import { AccesoService } from '../services/acceso.service';
import { Usuario } from '../interfaces/Usuario';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  error:string='';
  constructor (
    private router : Router, //dokerizacion
    private accesoService : AccesoService,
  ){}
  ngOnInit(): void {}
  formularioRegistro = new FormGroup({
    nombre: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  })
  submit() {
      let user: Usuario = {
        nombre: this.formularioRegistro.value.nombre ?? '',
        email: this.formularioRegistro.value.email ?? '',
        password: this.formularioRegistro.value.password ?? ''
      };
      return this.accesoService.registrarse(user)
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        }
      })
  }
}
