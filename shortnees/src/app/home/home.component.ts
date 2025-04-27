import { Component, OnInit } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service';
import { Router, RouterOutlet } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LinkService } from '../services/link.service';
import { Url } from '../interfaces/Url';
import { AccesoService } from '../services/acceso.service';
import { LinkResponse } from '../interfaces/link-response';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  shortUrl: string = '';
  error: string = '';
  shortUrlP: string = '';
  errorP: string = '';
  isLoggedIn:any;
  formularioPersonalizar: FormGroup;
  formularioSinRegistro: FormGroup;
  user2: any;private authSubscription: Subscription | undefined;
  constructor(
    private resolverToken: ResolverTokenService,
    private linkService : LinkService,
    private fb : FormBuilder,
    private accesoService: AccesoService,
    private router: Router
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
    this.authSubscription = this.accesoService.isAuthenticated$.subscribe(
      (isAuthenticated) => {
        this.isLoggedIn = isAuthenticated;
      }
    );
  }
  acortarHash() {
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
            this.errorP=data.mensaje;
          }else if (data.mensaje === 'Enlace creado'){
            //si el enlace se acorto correctamente
            this.shortUrlP=data.urlCorta;
            this.errorP = data.mensaje
          }else{
            this.errorP = data.mensaje
          }
        }
      });
    }
  }
  ngOnDestroy(): void {
    // Importante: cancelar la suscripción para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
