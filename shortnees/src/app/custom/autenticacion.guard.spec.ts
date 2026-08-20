import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AutenticacionGuard } from './autenticacion.guard';

describe('AutenticacionGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('se instancia', () => {
    expect(TestBed.inject(AutenticacionGuard)).toBeTruthy();
  });
});
