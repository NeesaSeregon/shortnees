<?php

namespace App\Services;

/**
 * Todo lo que la aplicacion deduce de un visitante a partir de su peticion.
 *
 * Vivia dentro de RedireccionController como tres metodos privados. Sacarlo
 * aqui cumple dos objetivos: el controlador vuelve a hacer solo lo suyo
 * -orquestar- y esta logica pasa a ser comprobable sin levantar el kernel ni
 * fabricar una Request, porque las tres funciones son puras: entra una cadena,
 * sale un valor, y no tocan nada mas.
 */
class VisitanteService
{
    /**
     * Servicios que visitan el enlace de forma automatica, sobre todo para
     * generar la vista previa al compartirlo. No son visitas de personas: si se
     * contabilizan, un enlace pegado en un grupo de WhatsApp suma clics antes de
     * que nadie lo haya pulsado.
     *
     * Lista deliberadamente corta y explicita. Buscar la subcadena 'bot' a secas
     * daria falsos positivos (por ejemplo los moviles Cubot). Para una deteccion
     * completa, la mejora pendiente es matomo/device-detector.
     */
    private const AGENTES_AUTOMATICOS = [
        // Vistas previas al compartir
        'facebookexternalhit', 'WhatsApp', 'TelegramBot', 'Slackbot', 'Slack-ImgProxy',
        'Discordbot', 'Twitterbot', 'LinkedInBot', 'SkypeUriPreview', 'redditbot',
        'Embedly', 'Iframely', 'Quora Link Preview', 'vkShare', 'Pinterest',
        // Buscadores
        'Googlebot', 'bingbot', 'YandexBot', 'DuckDuckBot', 'Baiduspider', 'Applebot',
        // Clientes automaticos y herramientas
        'curl/', 'Wget/', 'python-requests', 'Go-http-client', 'axios/', 'okhttp',
        'Java/', 'HeadlessChrome', 'PhantomJS', 'crawler', 'spider', 'scraper',
    ];

    /** Codigos que Cloudflare usa para "no lo se" y para la red Tor. */
    private const PAISES_NO_VALIDOS = ['XX', 'T1'];

    public function esAgenteAutomatico(string $userAgent): bool
    {
        // Un navegador real siempre manda User-Agent.
        if ($userAgent === '') {
            return true;
        }

        foreach (self::AGENTES_AUTOMATICOS as $agente) {
            if (stripos($userAgent, $agente) !== false) {
                return true;
            }
        }

        return false;
    }

    public function tipoDispositivo(string $userAgent): string
    {
        // Una tablet Android manda 'Android' pero NO 'Mobile'; los moviles mandan
        // ambos. Es la forma de distinguirlas sin recurrir a una libreria.
        if (preg_match('/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i', $userAgent)) {
            return 'Tablet';
        }

        if (preg_match('/Mobile|Android|iPhone|iPod|IEMobile|Opera Mini/i', $userAgent)) {
            return 'Móvil';
        }

        return 'Desktop';
    }

    /**
     * Normaliza el codigo ISO 3166-1 alfa-2 que Cloudflare adjunta en la
     * cabecera CF-IPCountry cuando el dominio esta proxificado y la opcion
     * "IP Geolocation" esta activada (Network, en el panel de Cloudflare).
     *
     * Devuelve null cuando no hay dato utilizable, que es lo que el resto de la
     * aplicacion traduce como "Desconocido".
     */
    public function pais(?string $codigoIso): ?string
    {
        if (!$codigoIso) {
            return null;
        }

        $codigo = strtoupper($codigoIso);

        return in_array($codigo, self::PAISES_NO_VALIDOS, true) ? null : $codigo;
    }
}
