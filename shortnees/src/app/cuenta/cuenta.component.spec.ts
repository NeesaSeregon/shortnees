import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { CuentaComponent } from './cuenta.component';
import { AccesoService } from '../services/acceso.service';
import { LinkService } from '../services/link.service';
import { TemaService } from '../services/tema.service';
import { Links } from '../interfaces/Links';

const ENLACES: Links[] = [
  {
    id: 1, urlOriginal: 'https://ejemplo.com', urlCorta: 'shortns.com/uno',
    fechaCreacion: '2026-01-01', fechaExpiracion: '2027-01-01',
  },
  {
    id: 2, urlOriginal: 'https://otro.com', urlCorta: 'shortns.com/dos',
    fechaCreacion: '2026-02-01', fechaExpiracion: '2027-02-01',
  },
];

/**
 * Como el de HeaderComponent: modo zoneless y sin forzar el repintado en ningun
 * momento. Si totalEnlaces dejara de ser un signal, el numero de enlaces no
 * llegaria nunca a la pantalla y estos tests lo dirian.
 */
describe('CuentaComponent', () => {
  let fixture: ComponentFixture<CuentaComponent>;
  let component: CuentaComponent;
  let autenticado: BehaviorSubject<boolean>;
  // No se sustituye el Router: la plantilla usa routerLink y la directiva
  // necesita el de verdad. Se espia el metodo que interesa y punto.
  let navigate: jasmine.Spy;
  let tema: { getTheme: jasmine.Spy; setTheme: jasmine.Spy };

  async function montar(enlaces: Links[] = ENLACES): Promise<void> {
    autenticado = new BehaviorSubject<boolean>(true);
    tema = {
      getTheme: jasmine.createSpy('getTheme').and.returnValue('light'),
      setTheme: jasmine.createSpy('setTheme'),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CuentaComponent],
      providers: [
        {
          provide: AccesoService,
          useValue: {
            isAuthenticated$: autenticado,
            currentUserValue: { nombre: 'Luis', email: 'luis@ejemplo.com', rol: ['ROLE_USER'] },
            logout: jasmine.createSpy('logout'),
          },
        },
        { provide: LinkService, useValue: { getUserEnlaces: () => of(enlaces) } },
        { provide: TemaService, useValue: tema },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(CuentaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('se crea y su plantilla compila', async () => {
    await montar();

    expect(component).toBeTruthy();
  });

  it('pinta cuantos enlaces tiene el usuario sin forzar el repintado', async () => {
    await montar();

    expect(component.totalEnlaces()).toBe(2);
    expect((fixture.nativeElement as HTMLElement).querySelector('.stat-value')!.textContent!.trim())
      .toBe('2');
  });

  it('un usuario sin enlaces ve un cero, no un hueco', async () => {
    await montar([]);

    expect((fixture.nativeElement as HTMLElement).querySelector('.stat-value')!.textContent!.trim())
      .toBe('0');
  });

  it('arranca con el tema que tenga guardado el servicio', async () => {
    await montar();

    expect(component.seleccionarTema()).toBe('light');
  });

  it('cambiar de tema lo guarda y actualiza la seleccion', async () => {
    await montar();

    component.onThemeChange('light');
    await fixture.whenStable();

    expect(tema.setTheme).toHaveBeenCalledOnceWith('light');
    expect(component.seleccionarTema()).toBe('light');
  });

  it('si se pierde la sesion echa al visitante al login', async () => {
    await montar();

    autenticado.next(false);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('el avatar muestra las dos primeras letras del nombre', async () => {
    await montar();

    expect((fixture.nativeElement as HTMLElement).querySelector('.avatar')!.textContent!.trim())
      .toBe('LU');
  });

  /**
   * El selector de tema era un <select> nativo; ahora es un control segmentado
   * de dos botones, como el del generador de QR.
   */
  describe('selector de tema', () => {
    function botonesTema(): HTMLButtonElement[] {
      return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tema-seg'));
    }

    it('ofrece los dos temas y marca el que esta activo', async () => {
      await montar();

      expect(botonesTema().map((b) => b.textContent!.trim())).toEqual(['Oscuro', 'Claro']);
      // El doble de TemaService devuelve 'light'.
      expect(botonesTema()[1].getAttribute('aria-pressed')).toBe('true');
      expect(botonesTema()[0].getAttribute('aria-pressed')).toBe('false');
    });

    it('pulsar un tema lo aplica y lo marca sin forzar el repintado', async () => {
      await montar();

      botonesTema()[0].click();
      await fixture.whenStable();

      expect(tema.setTheme).toHaveBeenCalledWith('dark');
      expect(botonesTema()[0].classList).toContain('tema-seg--activo');
      expect(botonesTema()[1].classList).not.toContain('tema-seg--activo');
    });

    it('ya no ofrece el tema azul, que no llegaba al contraste minimo', async () => {
      await montar();

      expect(botonesTema().length).toBe(2);
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Azul');
    });
  });

});
