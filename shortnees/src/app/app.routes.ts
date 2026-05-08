import { Routes, RouterModule } from '@angular/router';
import { RegistroComponent } from './registro/registro.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
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
    {path:'dashboard', component: DashboardComponent, canActivate:[AutenticacionGuard]},
    {path:'wellcome', component: WellcomeComponent},
    {path:'cuenta', component: CuentaComponent},
    {path:'generador', component: GeneradorQRComponent},
    {path:'not-found', component: NotFoundComponent},
    {path:'**', redirectTo:'not-found'},
];
