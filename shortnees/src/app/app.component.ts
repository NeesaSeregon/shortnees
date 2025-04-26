import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TemaService } from './services/tema.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, NgxChartsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'appFront';
  public email:any = 'Sin Session';
  constructor (private temaService: TemaService ){}
  ngOnInit() {
    this.temaService.initTheme();
  }
}
