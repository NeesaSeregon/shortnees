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
    service.setTheme('blue');

    expect(document.body.classList.contains('theme-blue')).toBeTrue();
    expect(document.body.classList.contains('theme-light')).toBeFalse();
  });

  it('no toca clases del body ajenas al tema', () => {
    document.body.classList.add('otra-clase');

    service.setTheme('light');

    expect(document.body.classList.contains('otra-clase')).toBeTrue();
  });

  it('guarda la preferencia en localStorage', () => {
    service.setTheme('blue');

    expect(localStorage.getItem('app-theme')).toBe('blue');
  });

  it('usa el tema oscuro cuando no hay preferencia guardada', () => {
    expect(service.getTheme()).toBe('dark');
  });

  it('recupera la preferencia guardada', () => {
    localStorage.setItem('app-theme', 'light');

    expect(service.getTheme()).toBe('light');
  });

  it('initTheme aplica la preferencia guardada', () => {
    localStorage.setItem('app-theme', 'blue');

    service.initTheme();

    expect(document.body.classList.contains('theme-blue')).toBeTrue();
  });
});
