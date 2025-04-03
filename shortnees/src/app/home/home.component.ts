import { Component, OnInit } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service';
import { Router, RouterOutlet } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';
import { Url } from '../interfaces/Url';
import { AccesoService } from '../services/acceso.service';
import { LinkResponse } from '../interfaces/link-response';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  username: string | undefined;
  roles: string[] | undefined;
  shortUrl: string = '';
  error: string = '';
  private accesoService = inject(AccesoService)
  isLoggedIn:any;
  formularioPersonalizar: FormGroup;
  formularioSinRegistro: FormGroup;
  constructor(
    private resolverToken: ResolverTokenService,
    private linkService : LinkService,
    private fb : FormBuilder
  ) {
    this.formularioPersonalizar = this.fb.group({
      urlOriginal: [''],
      urlPersonalizada: ['']
    });
    this.formularioSinRegistro = this.fb.group({
      urlOriginal: [''],
    });
  }
  ngOnInit() {
    const user = this.resolverToken.getUser();
    this.isLoggedIn = this.accesoService.loginStatus;
   
    if (user) {
      this.username = user.username;
      this.roles = user.roles;
      localStorage.setItem('email', this.username);
      localStorage.setItem('rol', this.roles[0]);
    
    }
  }
  acortarHash() {
    console.log(this.formularioSinRegistro.value['urlOriginal']);
    let url:Url = {
      url: this.formularioSinRegistro.value['urlOriginal']
    };
    if(this.formularioSinRegistro.value['urlOriginal'] != null){
      this.linkService.enviarLink(url).subscribe({
        next: (data:LinkResponse) => {
          if(data.urlCorta==='protocolo'){
            //si el protocolo no es https
            this.error=data.mensaje;
          }else if (data.mensaje === 'Enlace creado'){
            //si el enlace se acorto correctamente
            this.shortUrl=data.urlCorta;
            this.error = data.mensaje
          }else{
            this.error = 'todo lo demas'
          }
          //LLAMAR EVENTO: MOSTRAR LA URL 
        }
      })
    }
  }
  personalizar() {
    if (this.formularioPersonalizar.valid) {
      console.log(this.formularioPersonalizar.value);
      this.linkService.personalizarLink(this.formularioPersonalizar.value).subscribe({
        next: (data:LinkResponse) => {
          if(data.urlCorta==='protocolo'){
            //si el protocolo no es https
            this.error=data.mensaje;
          }else if (data.mensaje === 'Enlace creado'){
            //si el enlace se acorto correctamente
            this.shortUrl=data.urlCorta;
          }else{
            this.error = data.mensaje
          }
        }
      });
    }
  }
}
