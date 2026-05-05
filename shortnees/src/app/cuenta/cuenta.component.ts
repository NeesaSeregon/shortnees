import { Component, OnInit, signal } from '@angular/core';
import { AccesoService } from '../services/acceso.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { ResolverTokenService } from '../services/resolver-token.service'
import { Subscription } from 'rxjs';
import { Usuario } from '../interfaces/Usuario';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TemaService } from '../services/tema.service';
@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [NgIf, CommonModule],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent implements OnInit{
  private resolverToken = inject(ResolverTokenService);
  public isLoggedIn : any = false;
  private authSubscription: Subscription | undefined;
  temas = [
    { value: 'dark', label: 'Oscuro' },
    { value: 'light', label: 'Claro' },
    { value: 'blue', label: 'Azul' }
  ];

  constructor(public accesoService: AccesoService,private router: Router, private temaService: TemaService) 
  {}
  seleccionarTema: string | undefined;
  ngOnInit() {
    this.seleccionarTema = this.temaService.getTheme();
    this.authSubscription = this.accesoService.isAuthenticated$.subscribe(
      (isAuthenticated) => {
        this.isLoggedIn = isAuthenticated;
      }
    );
  }

  ngOnDestroy(): void {
    // Importante: cancelar la suscripción para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  //funciones para el control estetico
  onThemeChange(theme: string) {
    this.seleccionarTema = theme;
    
    this.temaService.setTheme(theme);
  }

  editarNombre() {

  }
  cambiarNombreUsuario (nombre:string) {

  }
  cambiarEmail (email:string) {

  }

}
