import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';

// Los tests 'should have the appFront title' y 'should render title' que traia
// el esqueleto de Angular se han eliminado: comprobaban un <h1> con el texto
// 'Hello, appFront' que dejo de existir al sustituir la plantilla de bienvenida.

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  it('monta la aplicacion con cabecera, pie y router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('app-header')).toBeTruthy();
    expect(html.querySelector('router-outlet')).toBeTruthy();
    expect(html.querySelector('app-footer')).toBeTruthy();
  });
});
