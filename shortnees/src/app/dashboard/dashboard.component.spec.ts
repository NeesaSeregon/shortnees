import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';

const ENLACES: Links[] = [
  {
    id: 1, urlOriginal: 'https://ejemplo.com', urlCorta: 'shortns.com/uno',
    fechaCreacion: new Date('2026-01-01'), fechaExpiracion: new Date('2027-01-01'),
  },
  {
    id: 2, urlOriginal: 'https://otro.com', urlCorta: 'shortns.com/dos',
    fechaCreacion: new Date('2026-02-01'), fechaExpiracion: new Date('2027-02-01'),
  },
];

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let linkService: any;
  let router: { navigate: jasmine.Spy };

  async function montar(enlaces: Links[] | null = ENLACES): Promise<void> {
    linkService = {
      getUserEnlaces: jasmine.createSpy('getUserEnlaces').and.returnValue(
        enlaces === null ? throwError(() => new Error('sin red')) : of(enlaces)),
      obtenerEstadisticas: jasmine.createSpy('obtenerEstadisticas')
        .and.returnValue(of({ id: 1, numeroClicks: 3, detalles: [] })),
      obtenerEstadisticasPais: jasmine.createSpy('obtenerEstadisticasPais').and.returnValue(of([])),
      obtenerEstadisticasFecha: jasmine.createSpy('obtenerEstadisticasFecha').and.returnValue(of([])),
      obtenerEstadisticasDispositivo: jasmine.createSpy('obtenerEstadisticasDispositivo').and.returnValue(of([])),
      obtenerEstadisticasHora: jasmine.createSpy('obtenerEstadisticasHora').and.returnValue(of([])),
      eliminarEnlace: jasmine.createSpy('eliminarEnlace').and.returnValue(of({})),
    };

    router = { navigate: jasmine.createSpy('navigate') };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: LinkService, useValue: linkService },
        { provide: Router, useValue: router },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('pide los enlaces del usuario al iniciarse', async () => {
    await montar();

    expect(linkService.getUserEnlaces).toHaveBeenCalledTimes(1);
    expect(component.enlaces.length).toBe(2);
  });

  it('pinta un boton por enlace', async () => {
    await montar();
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button.button-enlaces');

    expect(botones.length).toBe(2);
    expect(botones[0].textContent).toContain('shortns.com/uno');
  });

  it('avisa cuando el usuario no tiene enlaces', async () => {
    await montar([]);

    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('No tienes enlaces disponibles');
  });

  it('no rompe si la carga de enlaces falla', async () => {
    await montar(null);

    expect(component.enlaces).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('No tienes enlaces disponibles');
  });

  it('seleccionar un enlace pide sus cinco estadisticas con el mismo id', async () => {
    await montar();

    component.seleccionar(ENLACES[1]);

    expect(linkService.obtenerEstadisticas).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasPais).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasFecha).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasDispositivo).toHaveBeenCalledOnceWith(2);
    expect(linkService.obtenerEstadisticasHora).toHaveBeenCalledOnceWith(2);
  });

  it('seleccionar marca el enlace y muestra sus clics', async () => {
    await montar();

    component.seleccionar(ENLACES[0]);
    fixture.detectChanges();

    expect(component.enlaceSeleccionadoId).toBe(1);
    expect(component.urlCortaSeleccionada).toBe('shortns.com/uno');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('clics totales');
  });

  describe('boton de QR', () => {
    it('pinta un boton de QR por enlace', async () => {
      await montar();
      const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button.button-qr');

      expect(botones.length).toBe(2);
    });

    it('lleva al generador con la url corta del enlace', async () => {
      await montar();

      component.verQr(ENLACES[0]);

      expect(router.navigate).toHaveBeenCalledOnceWith(
        ['/generador'],
        { queryParams: { url: 'https://shortns.com/uno' } },
      );
    });

    it('anade el protocolo, que url_corta no lo guarda', async () => {
      await montar();

      component.verQr(ENLACES[0]);
      const parametros = router.navigate.calls.mostRecent().args[1];

      expect(parametros.queryParams.url.startsWith('https://')).toBeTrue();
    });

    it('no duplica el protocolo si la url ya lo trae', async () => {
      await montar();

      component.verQr({ ...ENLACES[0], urlCorta: 'https://shortns.com/uno' });

      expect(router.navigate).toHaveBeenCalledOnceWith(
        ['/generador'],
        { queryParams: { url: 'https://shortns.com/uno' } },
      );
    });
  });

  it('eliminar un enlace recarga la lista', async () => {
    await montar();

    component.eliminarEnlace(1);

    expect(linkService.eliminarEnlace).toHaveBeenCalledOnceWith(1);
    expect(linkService.getUserEnlaces).toHaveBeenCalledTimes(2);
  });
});
