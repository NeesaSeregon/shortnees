<?php

namespace App\Controller;
use App\Repository\EnlacesRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\RedirectResponse;
use App\Entity\Enlaces;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Request;
use App\Entity\EstadisticasEnlaces;
use Doctrine\ORM\EntityManagerInterface;
#[Route('/shortns.com', name: 'app_redireccion')]
class RedireccionController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }
    const DOMINIO = 'shortns.com/';
    #[Route('/{urlCorta}', name: 'app_redireccion')]
    public function redirectToOriginalUrl(string $urlCorta, 
    EnlacesRepository $enlaceRepository, Request $request): RedirectResponse
    {
        if($enlaceRepository->findOneByUrlCorta(SELF::DOMINIO.$urlCorta)==null) {
            return $this->redirect('http://localhost:4200/not-found');
        }else {
            $enlace = new Enlaces();
            $enlace = $enlaceRepository->findOneByUrlCorta(SELF::DOMINIO.$urlCorta);

            //registro las estadisticas del click
            $ipUsuario = $request->getClientIp();
            $ubicacion = $this->getCountryByIp($ipUsuario);
            $userAgent = $request->headers->get('User-Agent');
            $this->registrarEstadistica($enlace, $ipUsuario, $ubicacion, $userAgent);
            return $this->redirect($enlace->getUrlOriginal());
        }
    }
    private function getCountryByIp($ip)
    {
        // Crear un cliente HTTP
        $client = HttpClient::create();
        
        // Realizar la solicitud a ip-api.com
        $response = $client->request('GET', 'http://ip-api.com/json/' . $ip);
        
        // Obtener el contenido de la respuesta
        $data = $response->toArray();

        // Verificar si la solicitud fue exitosa
        if ($data['status'] === 'success') {
            return $data['country']; // Retornar solo el país
        }

        return null; // Retornar null si no se pudo obtener el país
    }
    private function registrarEstadistica($enlace, $ipUsuario, $country, $userAgent)
{
    $estadistica = new EstadisticasEnlaces();
    $estadistica->setEnlace($enlace);
    $estadistica->setFechaClick(new \DateTimeImmutable());
    $estadistica->setIpUsuario($ipUsuario);
    
    // Establecer el país obtenido
    if ($country) {
        $estadistica->setUbicacion($country);
    }

    // Establecer el dispositivo basado en el User-Agent
    $dispositivo = $this->getDeviceType($userAgent);
    if ($dispositivo) {
        $estadistica->setDispositivo($dispositivo);
    }

    // Persistir la nueva estadística
    $this->entityManager->persist($estadistica);
    $this->entityManager->flush();
}
private function getDeviceType($userAgent)
{
    if (preg_match('/Mobile|Android|iPhone|iPad/', $userAgent)) {
        if (preg_match('/iPad/', $userAgent)) {
            return 'Tablet';
        }
        return 'Móvil';
    }
    return 'Desktop';
}
}
