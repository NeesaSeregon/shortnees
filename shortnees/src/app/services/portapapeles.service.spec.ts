import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { PortapapelesService } from './portapapeles.service';

/**
 * navigator.clipboard no se puede espiar con spyOn: en Chrome es una propiedad
 * de solo lectura del prototipo, y en un contexto no seguro ni siquiera existe.
 * Se sustituye entera y se restaura al salir.
 */
describe('PortapapelesService', () => {
  let service: PortapapelesService;
  let escribir: jasmine.Spy;
  let original: PropertyDescriptor | undefined;

  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard')
      ?? Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    escribir = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escribir },
      configurable: true,
    });

    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(PortapapelesService);
  });

  afterEach(() => {
    delete (navigator as any).clipboard;
    if (original) {
      Object.defineProperty(navigator, 'clipboard', original);
    }
  });

  it('no hay acuse antes de copiar nada', () => {
    expect(service.ultimoCopiado()).toBeNull();
  });

  it('copia el texto y lo recuerda', async () => {
    await service.copiar('shortns.com/abc123');

    expect(escribir).toHaveBeenCalledOnceWith('shortns.com/abc123');
    expect(service.ultimoCopiado()).toBe('shortns.com/abc123');
  });

  it('recuerda el TEXTO y no un si/no, para que cada boton compare con lo suyo', async () => {
    await service.copiar('shortns.com/uno');

    // Es lo que impide que copiar en una pantalla encienda el acuse de otra.
    expect(service.ultimoCopiado()).not.toBe('shortns.com/dos');
  });

  it('no intenta copiar una cadena vacia', async () => {
    await service.copiar('');

    expect(escribir).not.toHaveBeenCalled();
    expect(service.ultimoCopiado()).toBeNull();
  });

  it('si el navegador deniega el permiso no anuncia nada', async () => {
    escribir.and.returnValue(Promise.reject(new Error('denegado')));

    await service.copiar('shortns.com/abc123');

    expect(service.ultimoCopiado()).toBeNull();
  });

  it('sin API de portapapeles se queda quieto en vez de reventar', async () => {
    delete (navigator as any).clipboard;

    await expectAsync(service.copiar('shortns.com/abc123')).toBeResolved();
    expect(service.ultimoCopiado()).toBeNull();
  });
});
