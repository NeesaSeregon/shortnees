import { Injectable, signal } from '@angular/core';

/**
 * Copia texto al portapapeles y recuerda durante unos segundos qué se copió,
 * para que quien haya pulsado el botón vea un acuse de recibo.
 *
 * Guarda el TEXTO y no un booleano a proposito: asi cada pantalla compara con
 * lo suyo y el acuse no se enciende en un boton que no se ha pulsado.
 */
@Injectable({
  providedIn: 'root'
})
export class PortapapelesService {
  /** Cuanto dura el acuse en pantalla. */
  private static readonly MILISEGUNDOS_ACUSE = 2000;

  private readonly _ultimoCopiado = signal<string | null>(null);

  /** Lo ultimo que se copio, o null si ya paso el acuse. */
  readonly ultimoCopiado = this._ultimoCopiado.asReadonly();

  private temporizador: ReturnType<typeof setTimeout> | null = null;

  /**
   * navigator.clipboard no existe en contextos no seguros (http que no sea
   * localhost), asi que se comprueba: sin el, el boton simplemente no confirma
   * nada en vez de reventar.
   *
   * Devuelve la promesa para que los tests puedan esperarla; quien llama desde
   * una plantilla la ignora.
   */
  copiar(texto: string): Promise<void> {
    if (!texto || !navigator.clipboard) {
      return Promise.resolve();
    }

    return navigator.clipboard.writeText(texto).then(
      () => {
        if (this.temporizador !== null) {
          clearTimeout(this.temporizador);
        }
        this._ultimoCopiado.set(texto);
        this.temporizador = setTimeout(() => {
          this._ultimoCopiado.set(null);
          this.temporizador = null;
        }, PortapapelesService.MILISEGUNDOS_ACUSE);
      },
      () => { /* El navegador denego el permiso: no hay nada que anunciar. */ }
    );
  }
}
