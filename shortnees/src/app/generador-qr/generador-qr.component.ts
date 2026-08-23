import { Component, ElementRef, OnInit, ViewChild, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import QRCodeStyling, { FileExtension } from "qr-code-styling";

@Component({
  selector: 'app-generador-qr',
  imports: [],
  templateUrl: './generador-qr.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './generador-qr.component.css'
})
export class GeneradorQRComponent implements OnInit {
  data = 'https://shortnees.com';

  /** Formatos que ofrece qr-code-styling en download(). */
  readonly extensiones: readonly FileExtension[] = ['svg', 'png', 'jpeg', 'webp'];

  /**
   * El formato elegido se pinta (el control segmentado marca cuál está activo),
   * asi que va en un signal: con OnPush, un campo normal no repintaria nada.
   */
  readonly extension = signal<FileExtension>('svg');

  qrCode: QRCodeStyling = new QRCodeStyling;

  constructor(private ruta: ActivatedRoute) {}

  @ViewChild('canvas', { static: true }) canvas!: ElementRef;

  ngOnInit(): void {
    // El panel de control enlaza aqui con ?url=..., para no obligar al usuario
    // a copiar a mano su propio enlace corto.
    const urlRecibida = this.ruta.snapshot.queryParamMap.get('url');
    if (urlRecibida) {
      this.data = urlRecibida;
    }

    this.qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
      data: this.data,
      // El margen es la zona de silencio: sin ella muchos lectores no
      // encuentran los patrones de deteccion.
      margin: 12,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'Q'
      },
      // Modulos casi negros sobre blanco, pase lo que pase con el tema de la
      // aplicacion: un QR se lee por contraste, y el carmesi sobre gris que
      // habia antes se lo ponia dificil a la camara.
      dotsOptions: {
        color: '#0a0a0b',
        type: 'rounded'
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      cornersSquareOptions: {
        color: '#0a0a0b',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#0a0a0b',
        type: 'dot',
      }
    });

    this.qrCode.append(this.canvas.nativeElement);
  }

  onKey(event: any): void {
    this.data = event.target.value;
    this.qrCode.update({
      data: this.data
    });
  }

  seleccionarExtension(extension: FileExtension): void {
    this.extension.set(extension);
  }

  download(): void {
    this.qrCode.download({ extension: this.extension() });
  }
}
