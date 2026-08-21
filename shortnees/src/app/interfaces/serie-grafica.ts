/**
 * Una serie de las que consume ngx-charts: es literalmente el formato que
 * esperan sus componentes en [results].
 *
 * Los cuatro endpoints de estadisticas agregadas (pais, fecha, dispositivo y
 * hora) devuelven un array de esto. Tenian una interfaz identica cada uno.
 */
export interface SerieGrafica {
  name: string;
  value: number;
}
