import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wellcome',
  imports: [RouterLink],
  templateUrl: './wellcome.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './wellcome.component.css'
})
export class WellcomeComponent {

}
