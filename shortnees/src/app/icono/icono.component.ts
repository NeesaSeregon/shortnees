import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Los 25 iconos que usa la aplicacion, en SVG en linea.
 *
 * Antes se cargaban con Bootstrap Icons desde jsdelivr: ~200 kB y una fuente de
 * ~2000 glifos para usar 25, mas una peticion a un tercero que ve la IP de cada
 * visitante -lo mismo que se corrigio con las tipografias-. Aqui van los mismos
 * dibujos, extraidos de bootstrap-icons 1.11.3 (MIT, The Bootstrap Authors),
 * y pesan unos 11 kB que ademas viajan dentro del bundle.
 *
 * El @switch los compila estaticamente: no hay innerHTML ni sanitizador de por
 * medio, que es como suele acabar un componente de iconos y es justo lo que
 * conviene evitar con SVG.
 */
@Component({
  selector: 'app-icono',
  imports: [],
  templateUrl: './icono.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icono.component.css'
})
export class IconoComponent {
  /** Nombre del icono, el mismo que tenia en Bootstrap Icons sin el prefijo. */
  readonly nombre = input.required<NombreIcono>();

  /** Por defecto sigue al font-size de quien lo contiene. */
  readonly tamano = input('1em');
}

export const NOMBRES_ICONO = [
  'arrow-right', 'bar-chart-line', 'box-arrow-in-right',
  'box-arrow-right', 'calendar3', 'check-lg',
  'clipboard', 'clipboard-check', 'clock',
  'download', 'envelope', 'exclamation-circle-fill',
  'globe2', 'link-45deg', 'lock',
  'moon-stars', 'palette', 'pencil-square',
  'person', 'person-plus', 'phone',
  'qr-code', 'scissors', 'sun',
  'trash',
] as const;

/** Se deriva de la lista, no al reves: asi no puede haber un nombre en el tipo
 *  que no este en la lista que recorre el test. */
export type NombreIcono = typeof NOMBRES_ICONO[number];
