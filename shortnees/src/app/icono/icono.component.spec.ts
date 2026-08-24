import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { IconoComponent, NOMBRES_ICONO } from './icono.component';

/** Modo zoneless y sin forzar el repintado: ver la seccion Tests de CLAUDE.md. */
describe('IconoComponent', () => {
  let fixture: ComponentFixture<IconoComponent>;

  async function montar(nombre: string, tamano?: string): Promise<SVGElement> {
    fixture = TestBed.createComponent(IconoComponent);
    fixture.componentRef.setInput('nombre', nombre);
    if (tamano !== undefined) {
      fixture.componentRef.setInput('tamano', tamano);
    }
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('svg')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconoComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  /**
   * El test que justifica que NOMBRES_ICONO sea una lista de verdad y no solo un
   * tipo: si alguien añade un nombre y se olvida del @case, el icono no se pinta
   * y no falla nada. Aqui si falla.
   */
  it('los 25 nombres declarados pintan un dibujo', async () => {
    for (const nombre of NOMBRES_ICONO) {
      const svg = await montar(nombre);

      expect(svg.querySelectorAll('path, circle, rect').length)
        .withContext(`el icono '${nombre}' no pinta nada: ¿falta su @case?`)
        .toBeGreaterThan(0);
    }
  });

  it('un nombre desconocido no pinta nada en vez de romper la pagina', async () => {
    const svg = await montar('no-existe-este-icono');

    expect(svg).toBeTruthy();
    expect(svg.querySelectorAll('path, circle, rect').length).toBe(0);
  });

  it('cada nombre pinta un dibujo distinto', async () => {
    const uno = (await montar('scissors')).innerHTML;
    const otro = (await montar('trash')).innerHTML;

    expect(uno).not.toBe(otro);
  });

  /** 1em es lo que hace que el icono siga al font-size de quien lo contiene,
   *  igual que hacia la fuente de iconos. Por eso el CSS no tuvo que cambiar. */
  it('por defecto mide 1em, para heredar el tamano del texto', async () => {
    const svg = await montar('scissors');

    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('height')).toBe('1em');
  });

  it('admite un tamano explicito', async () => {
    const svg = await montar('scissors', '24px');

    expect(svg.getAttribute('width')).toBe('24px');
    expect(svg.getAttribute('height')).toBe('24px');
  });

  it('es decorativo: ni lo lee el lector de pantalla ni recibe el foco', async () => {
    const svg = await montar('scissors');

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });
});
