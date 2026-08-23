<?php

namespace App\Controller;

use App\Entity\Enlaces;
use App\Entity\EstadisticasEnlaces;
use App\Repository\EnlacesRepository;
use App\Services\VisitanteService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class RedireccionController extends AbstractController
{
    const DOMINIO = 'shortns.com/';

    public function __construct(
        private EntityManagerInterface $entityManager,
        private VisitanteService $visitante,
    ) {
    }

    // priority negativa: este catch-all debe evaluarse el ULTIMO. Sin ella tapa
    // a /registro, que se carga despues por orden alfabetico de fichero.
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

        if ($this->visitante->esAgenteAutomatico($userAgent)) {
            return;
        }

        $estadistica = new EstadisticasEnlaces();
        $estadistica->setEnlace($enlace);
        $estadistica->setFechaClick(new \DateTimeImmutable());
        $estadistica->setUbicacion($this->visitante->pais($request->headers->get('CF-IPCountry')));
        $estadistica->setDispositivo($this->visitante->tipoDispositivo($userAgent));

        $this->entityManager->persist($estadistica);
        $this->entityManager->flush();
    }
}
