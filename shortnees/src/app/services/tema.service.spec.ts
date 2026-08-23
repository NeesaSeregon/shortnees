import { TestBed } from '@angular/core/testing';

import { TemaService } from './tema.service';

describe('TemaService', () => {
  let service: TemaService;

  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemaService);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('aplica el tema como clase del body', () => {
    service.setTheme('light');

    expect(document.body.classList.contains('theme-light')).toBeTrue();
  });

  it('quita el tema anterior al aplicar uno nuevo', () => {
    service.setTheme('light');
    service.setTheme('dark');

    expect(document.body.classList.contains('theme-dark')).toBeTrue();
    expect(document.body.classList.contains('theme-light')).toBeFalse();
  });

  it('no toca clases del body ajenas al tema', () => {
    document.body.classList.add('otra-clase');

    service.setTheme('light');

    expect(document.body.classList.contains('otra-clase')).toBeTrue();
  });

  it('guarda la preferencia en localStorage', () => {
    service.setTheme('light');

    expect(localStorage.getItem('app-theme')).toBe('light');
  });

  it('usa el tema oscuro cuando no hay preferencia guardada', () => {
    expect(service.getTheme()).toBe('dark');
  });

  it('recupera la preferencia guardada', () => {
    localStorage.setItem('app-theme', 'light');

    expect(service.getTheme()).toBe('light');
  });

  it('initTheme aplica la preferencia guardada', () => {
    localStorage.setItem('app-theme', 'light');

    service.initTheme();

    expect(document.body.classList.contains('theme-light')).toBeTrue();
  });
});
