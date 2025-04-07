<?php

// src/Controller/EstadisticasEnlacesController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\Request;
use App\Entity\Enlaces;
use App\Entity\User;
use App\Repository\EnlacesRepository;
use App\Services\AcortarUrlService;
use Symfony\Bundle\SecurityBundle\Security;
use App\Services\FiltrarUrlService;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\EstadisticasEnlaces;
class EstadisticasEnlacesController extends AbstractController
{

    #[Route('/enlace/{id}/estadisticas', name: 'obtener_estadisticas', methods: ['GET'])]
    public function obtenerEstadisticas(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        // Buscar el enlace por su ID
        $enlace = $entityManager->getRepository(Enlaces::class)->find($id);
    
        // Verificar si el enlace existe
        if (!$enlace) {
            return new JsonResponse(['error' => 'Enlace no encontrado'], Response::HTTP_NOT_FOUND);
        }
    
        // Obtener todas las estadísticas asociadas al enlace
        $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);
    
        // Contar los clics (apariciones)
        $numeroClicks = count($estadisticas);
    
        // Preparar la respuesta con las estadísticas
        $resultadoEstadisticas = [
            'id' => $enlace->getId(),
            'numeroClicks' => $numeroClicks,
            'detalles' => []
        ];
    
        foreach ($estadisticas as $estadistica) {
            $resultadoEstadisticas['detalles'][] = [
                'id' => $estadistica->getId(),
                'fecha_click' => $estadistica->getFechaClick()->format('Y-m-d H:i:s'),
                'ip_usuario' => $estadistica->getIpUsuario(),
                'ubicacion' => $estadistica->getUbicacion(),
                'dispositivo' => $estadistica->getDispositivo(),
            ];
        }
    
        // Devolver la respuesta con todas las estadísticas
        return new JsonResponse($resultadoEstadisticas, Response::HTTP_OK);
    }


    //crea un endpoint que devuelva en formato json el numero de visitas segmentado por paises
    #[Route('/enlace/{id}/estadisticas/pais', name: 'obtener_estadisticas', methods: ['GET'])]
    public function obtenerEstadisticasPorPais(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        // Buscar el enlace por su ID
        $enlace = $entityManager->getRepository(Enlaces::class)->find($id);
    
        // Verificar si el enlace existe
        if (!$enlace) {
            return new JsonResponse(['error' => 'Enlace no encontrado'], Response::HTTP_NOT_FOUND);
        }
    
        // Obtener todas las estadísticas asociadas al enlace
        $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);
    
        // Contar los clics (apariciones)
        $numeroClicks = count($estadisticas);
        

        // Preparar la respuesta con las estadísticas
        /*$resultadoEstadisticas = [
            'id' => $enlace->getId(),
            'numeroClicks' => $numeroClicks,
            'detalles' => []
        ];*/
        
        $resultadoEstadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findByPais($enlace->getId());
    

            

        // Devolver la respuesta con todas las estadísticas
        return new JsonResponse($resultadoEstadisticas, Response::HTTP_OK);
    }

    //crea un endpoint que devuelva en formato json el numero de visitas segmentado por fecha
    
    //crea un endpoint que devuelva en formato json el numero de visitas segmentado por dispositivo






    /*#[Route('/api/estadisticas/{id}', name: 'estadisticas_show', methods: ['GET'])]
    public function show(EstadisticasEnlaces $estadistica): JsonResponse
    {
        return new JsonResponse([
            'id' => $estadistica->getId(),
            'fecha_click' => $estadistica->getFechaClick()->format('Y-m-d H:i:s'),
            'ip_usuario' => $estadistica->getIpUsuario(),
            'ubicacion' => $estadistica->getUbicacion(),
            'dispositivo' => $estadistica->getDispositivo(),
        ]);
    }

    #[Route('/api/estadisticas', name: 'estadisticas_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Aquí deberías validar y procesar los datos del request
        // Por simplicidad, asumimos que los datos vienen en JSON

        $data = json_decode($request->getContent(), true);

        // Crear una nueva estadística
        $estadistica = new EstadisticasEnlaces();
        $estadistica->setFechaClick(new \DateTimeImmutable($data['fecha_click']));
        $estadistica->setIpUsuario($data['ip_usuario']);
        $estadistica->setUbicacion($data['ubicacion']);
        $estadistica->setDispositivo($data['dispositivo']);

        // Persistir la nueva estadística
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->persist($estadistica);
        $entityManager->flush();

        return new JsonResponse(['id' => $estadistica->getId()], Response::HTTP_CREATED);
    }

    #[Route('/api/estadisticas/{id}', name: 'estadisticas_delete', methods: ['DELETE'])]
    public function delete(EstadisticasEnlaces $estadistica): JsonResponse
    {
        // Eliminar la estadística
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->remove($estadistica);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }*/
}
