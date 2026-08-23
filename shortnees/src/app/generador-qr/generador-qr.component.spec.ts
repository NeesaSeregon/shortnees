import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { GeneradorQRComponent } from './generador-qr.component';

describe('GeneradorQRComponent', () => {
  let fixture: ComponentFixture<GeneradorQRComponent>;
  let component: GeneradorQRComponent;

  async function montar(parametros: Record<string, string>): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [GeneradorQRComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(parametros) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneradorQRComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('sin parametros usa la url por defecto', async () => {
    await montar({});

    expect(component.data).toBe('https://shortnees.com');
  });

  it('carga la url que le pasa el panel de control', async () => {
    await montar({ url: 'https://shortns.com/miEnlace' });

    expect(component.data).toBe('https://shortns.com/miEnlace');
  });

  it('muestra la url recibida en el campo de texto', async () => {
    await montar({ url: 'https://shortns.com/miEnlace' });
    // La interpolacion value={{data}} fija la PROPIEDAD del DOM, no el atributo:
    // getAttribute('value') devolveria null.
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('https://shortns.com/miEnlace');
  });

  it('pinta el codigo QR', async () => {
    await montar({ url: 'https://shortns.com/miEnlace' });

    expect((fixture.nativeElement as HTMLElement).querySelector('svg, canvas')).toBeTruthy();
  });

  describe('formato del archivo', () => {
    function segmentos(): HTMLButtonElement[] {
      return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.qr-seg'));
    }

    it('ofrece los cuatro formatos y arranca en SVG', async () => {
      await montar({});

      expect(segmentos().map((b) => b.textContent!.trim()))
        .toEqual(['SVG', 'PNG', 'JPEG', 'WEBP']);
      expect(component.extension()).toBe('svg');
      expect(segmentos()[0].getAttribute('aria-pressed')).toBe('true');
    });

    it('elegir otro formato lo marca en pantalla sin forzar el repintado', async () => {
      await montar({});

      segmentos()[1].click();
      await fixture.whenStable();

      expect(component.extension()).toBe('png');
      expect(segmentos()[1].classList).toContain('qr-seg--activo');
      expect(segmentos()[0].classList).not.toContain('qr-seg--activo');
    });

    it('descarga en el formato elegido', async () => {
      await montar({});
      spyOn(component.qrCode, 'download');

      component.seleccionarExtension('webp');
      component.download();

      expect(component.qrCode.download).toHaveBeenCalledWith({ extension: 'webp' });
    });
  });

  it('al escribir otra url actualiza el codigo', async () => {
    await montar({});
    spyOn(component.qrCode, 'update');

    component.onKey({ target: { value: 'https://otra.com' } });

    expect(component.data).toBe('https://otra.com');
    expect(component.qrCode.update).toHaveBeenCalledWith({ data: 'https://otra.com' });
  });
});
