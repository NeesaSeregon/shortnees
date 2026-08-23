import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkService } from '../services/link.service';
import { LinkResponse } from '../interfaces/link-response';
import { AccesoService } from '../services/acceso.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.component.css'
})
export class HomeComponent {
  shortUrl: string = '';
  error: string = '';
  formulario: FormGroup;

  shortUrlP: string = '';
  errorP: string = '';
  formularioPersonalizar: FormGroup;

  isAuthenticated: boolean = false;

  constructor(
    private linkService: LinkService,
    private fb: FormBuilder,
    private accesoService: AccesoService,
  ) {
    this.formulario = this.fb.group({
      url: ['', Validators.required]
    });

    this.formularioPersonalizar = this.fb.group({
      urlOriginal: ['', Validators.required],
      urlPersonalizada: ['', Validators.required]
    });

    this.accesoService.isAuthenticated$.subscribe(val => this.isAuthenticated = val);
  }

  acortar() {
    if (this.formulario.valid) {
      this.linkService.enviarLink(this.formulario.value).subscribe({
        next: (data: LinkResponse) => {
          if (data.urlCorta === 'protocolo') {
            this.error = data.mensaje;
            this.shortUrl = '';
          } else if (data.mensaje === 'Enlace creado') {
            this.shortUrl = data.urlCorta;
            this.error = '';
          } else {
            this.error = data.mensaje;
            this.shortUrl = '';
          }
        },
        error: () => {
          this.error = 'No se pudo acortar el enlace. Intentelo de nuevo.';
          this.shortUrl = '';
        }
      });
    }
  }

  personalizar() {
    if (this.formularioPersonalizar.valid) {
      this.linkService.personalizarLink(this.formularioPersonalizar.value).subscribe({
        next: (data: LinkResponse) => {
          if (data.urlCorta === 'protocolo') {
            this.errorP = data.mensaje;
          } else if (data.mensaje === 'Enlace creado') {
            this.shortUrlP = data.urlCorta;
            this.errorP = data.mensaje;
          } else {
            this.errorP = data.mensaje;
          }
        },
        error: () => {
          this.errorP = 'No se pudo crear el enlace. Intentelo de nuevo.';
          this.shortUrlP = '';
        }
      });
    }
  }
}
