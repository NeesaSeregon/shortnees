import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, IconoComponent],
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {}
