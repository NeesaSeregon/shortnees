import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import QRCodeStyling, { FileExtension } from "qr-code-styling";
@Component({
  selector: 'app-generador-qr',
  standalone: true,
  imports: [],
  templateUrl: './generador-qr.component.html',
  styleUrl: './generador-qr.component.css'
})
export class GeneradorQRComponent implements OnInit{
  data = 'https://shortnees.com';
  extension = 'svg';
  qrCode: QRCodeStyling = new QRCodeStyling;
  constructor(){}
  @ViewChild('canvas', { static: true }) canvas!: ElementRef;
  ngOnInit(): void {
    this.qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
      data: this.data,
      //image: '/LogotipoShortneesClaro.png',
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'Q'
      },
      /*imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 20,
        crossOrigin: 'anonymous',
      },*/
      dotsOptions: {
        color: '#BD022D',
        type: 'rounded'
      },
      backgroundOptions: {
        color: '#e9ebee',
      },
      cornersSquareOptions: {
        color: '#BD022D',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#BD022D',
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
  onChange(event: any): void {
    this.extension = event.target.value;
  }
  download(): void {
    this.qrCode.download({ extension: this.extension as FileExtension});
  }
}