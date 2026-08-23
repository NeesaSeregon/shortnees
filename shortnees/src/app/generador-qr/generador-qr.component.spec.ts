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

  it('al escribir otra url actualiza el codigo', async () => {
    await montar({});
    spyOn(component.qrCode, 'update');

    component.onKey({ target: { value: 'https://otra.com' } });

    expect(component.data).toBe('https://otra.com');
    expect(component.qrCode.update).toHaveBeenCalledWith({ data: 'https://otra.com' });
  });
});
