/**
 * Un enlace tal y como lo devuelve GET /enlaces-usuario.
 *
 * Las fechas son cadenas 'Y-m-d': el backend las formatea con format('Y-m-d')
 * antes de serializar, asi que por el cable nunca viaja un Date. El tipo
 * describe lo que llega, no lo que nos gustaria que llegara.
 */
export interface Links {
    id: number;
    urlOriginal: string;
    urlCorta: string;
    fechaCreacion: string;
    fechaExpiracion: string;
}
