<?php

namespace App\Controller;
use App\Repository\EnlacesRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\RedirectResponse;
use App\Entity\Enlaces;
use Symfony\Component\HttpFoundation\Request;
use App\Entity\EstadisticasEnlaces;
use Doctrine\ORM\EntityManagerInterface;
class RedireccionController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }
    const DOMINIO = 'shortns.com/';

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

    // priority negativa: este catch-all debe evaluarse el ULTIMO. Sin ella tapa
    // a /registro, /login y /session, que se cargan despues por orden alfabetico.
    #[Route('/{urlCorta}', name: 'app_redireccion', priority: -100)]
    public function redirectToOriginalUrl(string $urlCorta,
    EnlacesRepository $enlaceRepository, Request $request): RedirectResponse
    {
        $enlace = $enlaceRepository->findOneByUrlCorta(self::DOMINIO . $urlCorta);

        if ($enlace === null) {
            return $this->redirect('https://shortnees.com/not-found');
        }

        // Las estadisticas son accesorias: pase lo que pase, el visitante tiene
        // que llegar a su destino. Nunca deben poder romper una redireccion.
        try {
            $this->registrarEstadistica($enlace, $request);
        } catch (\Throwable $e) {
            // Se pierde una estadistica, no la redireccion.
        }

        return $this->redirect($enlace->getUrlOriginal());
    }

    private function registrarEstadistica(Enlaces $enlace, Request $request): void
    {
        $userAgent = $request->headers->get('User-Agent') ?? '';

        if ($this->esAgenteAutomatico($userAgent)) {
            return;
        }

        $estadistica = new EstadisticasEnlaces();
        $estadistica->setEnlace($enlace);
        $estadistica->setFechaClick(new \DateTimeImmutable());
        $estadistica->setUbicacion($this->obtenerPais($request));
        $estadistica->setDispositivo($this->obtenerTipoDispositivo($userAgent));

        $this->entityManager->persist($estadistica);
        $this->entityManager->flush();
    }

    /**
     * Codigo ISO 3166-1 alfa-2 del pais del visitante, que Cloudflare adjunta en
     * la cabecera CF-IPCountry cuando el dominio esta proxificado y la opcion
     * "IP Geolocation" activada (Network, en el panel de Cloudflare).
     *
     * Sustituye a la llamada que se hacia a ip-api.com. Cloudflare ya estaba en
     * el camino de la peticion, asi que no se anade ningun tercero nuevo: no hay
     * latencia, ni limite de peticiones, ni un fallo externo que pueda tumbar la
     * redireccion. Y sobre todo, ya no hace falta tratar la IP del visitante.
     *
     * 'XX' = Cloudflare no ha podido determinarlo. 'T1' = red Tor.
     */
    private function obtenerPais(Request $request): ?string
    {
        $codigo = $request->headers->get('CF-IPCountry');

        if (!$codigo || in_array(strtoupper($codigo), ['XX', 'T1'], true)) {
            return null;
        }

        return strtoupper($codigo);
    }

    private function obtenerTipoDispositivo(string $userAgent): string
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

    private function esAgenteAutomatico(string $userAgent): bool
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
}
