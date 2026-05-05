import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkService } from '../services/link.service';
import { LinkResponse } from '../interfaces/link-response';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  shortUrlP: string = '';
  errorP: string = '';
  formularioPersonalizar: FormGroup;

  constructor(
    private linkService: LinkService,
    private fb: FormBuilder,
  ) {
    this.formularioPersonalizar = this.fb.group({
      urlOriginal: ['', Validators.required],
      urlPersonalizada: ['', Validators.required]
    });
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
        }
      });
    }
  }
}
