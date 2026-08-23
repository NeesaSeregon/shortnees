import { Routes } from '@angular/router';
import { RegistroComponent } from './registro/registro.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AutenticacionGuard } from './custom/autenticacion.guard';
import { WellcomeComponent } from './wellcome/wellcome.component';
import { CuentaComponent } from './cuenta/cuenta.component';
import { GeneradorQRComponent } from './generador-qr/generador-qr.component';
import { NotFoundComponent } from './not-found/not-found.component';
//import { autenticacionGuard } from './custom/autenticacion.guard';
export const routes: Routes = [
    {path:'', pathMatch:'full', redirectTo:'home'},
    {path:'registro', component: RegistroComponent},
    {path:'login', component: LoginComponent},
    {path:'home', component: HomeComponent},
    // Perezosa a proposito. DashboardComponent es el unico que importa
    // NgxChartsModule, y un import estatico aqui obligaba a descargar la
    // libreria de graficas entera en la primera visita, aunque el visitante no
    // llegara nunca al panel. Con loadComponent son 180 kB menos en el bundle
    // inicial (38 kB de transferencia), que pasan a un fichero aparte que solo
    // se pide al entrar aqui.
    {
      path: 'dashboard',
      loadComponent: () => import('./dashboard/dashboard.component')
        .then((m) => m.DashboardComponent),
      canActivate: [AutenticacionGuard],
    },
    {path:'wellcome', component: WellcomeComponent},
    {path:'cuenta', component: CuentaComponent},
    {path:'generador', component: GeneradorQRComponent},
    {path:'not-found', component: NotFoundComponent},
    {path:'**', redirectTo:'not-found'},
];
