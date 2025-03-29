import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { RouterOutlet, Router } from '@angular/router';
import { AccesoService } from '../services/acceso.service';
import { Usuario } from '../interfaces/Usuario';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  constructor (
    private router : Router, //dokerizacion
    private accesoService : AccesoService,
  ){}
  ngOnInit(): void {}
  formularioRegistro = new FormGroup({
    nombre: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl('')
  })
  submit() {
      let user: Usuario = {
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
