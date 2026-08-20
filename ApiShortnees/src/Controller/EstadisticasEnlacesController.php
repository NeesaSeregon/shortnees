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
use DateTime;
use App\Services\FechasService;

class EstadisticasEnlacesController extends AbstractController
{
    /**
     * Busca un enlace y comprueba que pertenece al usuario autenticado.
     * Devuelve el enlace, o la JsonResponse de error que el endpoint debe devolver tal cual.
     */
    private function buscarEnlacePropio(int $id, EntityManagerInterface $entityManager): Enlaces|JsonResponse
    {
        $usuario = $this->getUser();
        if (!$usuario instanceof User) {
            return new JsonResponse(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        // Un enlace ajeno responde igual que uno inexistente: asi un usuario
        // registrado no puede sondear que ids existen recorriendolos.
        $enlace = $entityManager->getRepository(Enlaces::class)->find($id);
        if (!$enlace || $enlace->getUsuario()?->getId() !== $usuario->getId()) {
            return new JsonResponse(['error' => 'Enlace no encontrado'], Response::HTTP_NOT_FOUND);
        }

        return $enlace;
    }

    /**
     * Cloudflare entrega el pais como codigo ISO ('ES'). Se guarda asi, neutro
     * respecto al idioma, y se traduce al mostrarlo.
     */
    private function nombrePais(?string $codigo): string
    {
        if (!$codigo) {
            return 'Desconocido';
        }

        // Registros anteriores a CF-IPCountry: guardaban el nombre completo.
        if (strlen($codigo) !== 2) {
            return $codigo;
        }

        if (class_exists(\Locale::class)) {
            $nombre = \Locale::getDisplayRegion('-' . $codigo, 'es');
            if ($nombre !== '' && $nombre !== $codigo) {
                return $nombre;
            }
        }

        return $codigo;
    }

    #[Route('/estadisticas/{id}', name: 'obtener_estadisticas', methods: ['GET'])]
    public function obtenerEstadisticas(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $enlace = $this->buscarEnlacePropio($id, $entityManager);
        if ($enlace instanceof JsonResponse) {
            return $enlace;
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
        //doy formato a los datos
        foreach ($estadisticas as $estadistica) {
            $resultadoEstadisticas['detalles'][] = [
                'id' => $estadistica->getId(),
                'fecha_click' => $estadistica->getFechaClick()->format('Y-m-d H:i:s'),
                'ubicacion' => $this->nombrePais($estadistica->getUbicacion()),
                'dispositivo' => $estadistica->getDispositivo(),
            ];
        }
    
        // Devolver la respuesta con todas las estadísticas
        return new JsonResponse($resultadoEstadisticas, Response::HTTP_OK);
    }
    //crea un endpoint que devuelva en formato json el numero de visitas segmentado por paises
    #[Route('/estadisticas_pais/{id}', name: 'estadisticas_pais', methods: ['GET'])]
    public function obtenerEstadisticasPorPais(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $enlace = $this->buscarEnlacePropio($id, $entityManager);
        if ($enlace instanceof JsonResponse) {
            return $enlace;
        }
        // Obtener todas las estadísticas asociadas al enlace
        $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);
        // Contar los clics
        $numeroClicks = count($estadisticas);
        $clicsPorPais = [];
        foreach ($estadisticas as $estadistica) {
            $pais = $this->nombrePais($estadistica->getUbicacion());
            if (!isset($clicsPorPais[$pais])) {
                $clicsPorPais[$pais] = 0;
            }
            $clicsPorPais[$pais]++;
        }
        $resultado = [];
        foreach ($clicsPorPais as $pais => $numeroClics) {
            $resultado[] = [
                'name' => $pais,
                'value' => $numeroClics
            ];
        }
        return new JsonResponse($resultado, Response::HTTP_OK);
    }
    //crea un endpoint que devuelva en formato json el numero de visitas segmentado por fecha
    #[Route('/estadisticas_fecha/{id}', name: 'estadisticas_fecha', methods: ['GET'])]
     public function obtenerEstadisticasPorFecha(int $id, EntityManagerInterface $entityManager, FechasService $servicio_fechas): JsonResponse
     {
         $enlace = $this->buscarEnlacePropio($id, $entityManager);
         if ($enlace instanceof JsonResponse) {
             return $enlace;
         }
         // Obtener todas las estadísticas asociadas al enlace
         $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);
         // Contar los clics 
         $clicksPorAnoyMes = [];
         foreach ($estadisticas as $estadistica) {
            $fecha = $estadistica->getFechaClick(); //probablemente con formatear aqui, lo tengas 1*
            if ($fecha === null || $fecha === '') {
                $fecha = 'Desconocido';
            }
            $fecha = $servicio_fechas->formatearFecha($fecha);
            if (!isset($clicksPorAnoyMes[$fecha])) {
                $clicksPorAnoyMes[$fecha] = 0;
            }
            $clicksPorAnoyMes[$fecha]++;
          }  
        $resultado = [];
        foreach ($clicksPorAnoyMes as $anoyMes => $numeroClics) {
            $resultado[] = [
                'name' => $anoyMes,
                'value' => $numeroClics
            ];
        }
        
        
         return new JsonResponse($resultado,Response::HTTP_OK);
     }
    //crea un endpoint que devuelva en formato json el numero de visitas segmentado por dispositivo
     //reparto de los clics por hora del dia, con los datos que ya se guardaban
     #[Route('/estadisticas_hora/{id}', name: 'estadisticas_hora', methods: ['GET'])]
     public function obtenerEstadisticasPorHora(int $id, EntityManagerInterface $entityManager): JsonResponse
     {
         $enlace = $this->buscarEnlacePropio($id, $entityManager);
         if ($enlace instanceof JsonResponse) {
             return $enlace;
         }

         $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);

         // Se devuelven las 24 franjas aunque esten a cero: una grafica con
         // huecos se lee peor que una con valles.
         // Ojo: la hora es la del servidor, no la del visitante.
         $clicsPorHora = array_fill(0, 24, 0);
         foreach ($estadisticas as $estadistica) {
             $clicsPorHora[(int) $estadistica->getFechaClick()->format('G')]++;
         }

         $resultado = [];
         foreach ($clicsPorHora as $hora => $numeroClics) {
             $resultado[] = [
                 'name' => sprintf('%02d:00', $hora),
                 'value' => $numeroClics
             ];
         }

         return new JsonResponse($resultado, Response::HTTP_OK);
     }
     #[Route('/estadisticas_dispositivo/{id}', name: 'estadisticas_dispositivo', methods: ['GET'])]
     public function obtenerEstadisticasPorDispositivo(int $id, EntityManagerInterface $entityManager): JsonResponse
     {
         $enlace = $this->buscarEnlacePropio($id, $entityManager);
         if ($enlace instanceof JsonResponse) {
             return $enlace;
         }
         $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);
         $numeroClicks = count($estadisticas);
         $clicsPorDispositivo = [];
         foreach ($estadisticas as $estadistica) {
            $dispositivo = $estadistica->getDispositivo(); 
            if ($dispositivo === null || $dispositivo === '') {
                $dispositivo = 'Desconocido';
            }
            if (!isset($clicsPorDispositivo[$dispositivo])) {
                $clicsPorDispositivo[$dispositivo] = 0;
            }
            $clicsPorDispositivo[$dispositivo]++;
        }
        $resultado = [];
        foreach ($clicsPorDispositivo as $dispositivo => $numeroClics) {
            $resultado[] = [
                'name' => $dispositivo,
                'value' => $numeroClics
            ];
        }
         return new JsonResponse($resultado,Response::HTTP_OK);
     }

}
