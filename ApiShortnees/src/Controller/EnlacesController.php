<?php
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
class EnlacesController extends AbstractController
{
    #[Route('/acortarUrl', name: 'acortar_url', methods: ['POST'])]
    public function acortarUrl(Request $request, AcortarUrlService $acortador, 
    EnlacesRepository $enlacesRepository,FiltrarUrlService $filtroUrl ,EntityManagerInterface $entityManager): Response
    {
        $request = $this->transformarJsonBody($request);
        $urlOriginal = $filtroUrl->limpiarCadena($request->get('url'));
        if ($urlOriginal == ''){
            return new JsonResponse(
                ['mensaje' => 'No puede dejar su URL en blanco',
                'urlCorta' => ''],
                200
            );}    
        if ($filtroUrl->verificarProtocolo($urlOriginal)){
                //comienzo la creacion del enlace
                $enlace = new Enlaces();
                $fechaActual = new \DateTime();
                $fechaExpiracion = clone $fechaActual;
                $fechaExpiracion->modify('+1 year');
                $enlace->setUrlOriginal($urlOriginal);
                //Creo la url acortada en un servicio dedicado
                $enlace->setUrlCorta($acortador->crearEnlace($enlace->getUrlOriginal()));
                
                $enlace->setFechaCreacion($fechaActual);
                $enlace->setFechaExpiracion($fechaExpiracion);
                $enlace->setPersonalizado(false);
                $enlace->setCodigoQr('soy un Qr');
                $enlacesRepository->guardarEnlace($enlace, $entityManager);
                return new JsonResponse(
                    ['mensaje' => 'Enlace creado',
                    'urlCorta' => $enlace->getUrlCorta()],
                    200
                ); 
            }
        else {
            //no es seguro
            return new JsonResponse(
                ['mensaje' => 'Este servicio solo acorta Urls seguras',
                'urlCorta' => 'protocolo'],
                200
            );
        }
    }

    #[Route('/personalizarUrl', name: 'app_enlaces', methods: ['POST'])]
    public function personalizarUrl(Request $request, 
    EnlacesRepository $enlacesRepository,FiltrarUrlService $filtroUrl ,EntityManagerInterface $entityManager): Response
    {
        $request = $this->transformarJsonBody($request);
        $urlOriginal = $filtroUrl->limpiarCadena($request->get('urlOriginal'));
        $urlPersonalizada = $filtroUrl->limpiarCadena($request->get('urlPersonalizada'));
        $urlPersonalizadaConDominio = 'shortns.com/'.$urlPersonalizada;
        if ($filtroUrl->verificarProtocolo($urlOriginal)){
            if ($urlPersonalizada == ''){
                return new JsonResponse(
                    ['mensaje' => 'No puede dejar su URL en blanco',
                    'urlCorta' => ''],
                    200
                );}    
        if ($filtroUrl->evitarColisionUrlCorta($urlPersonalizadaConDominio)){
                $enlace = new Enlaces();
                $enlace = $enlacesRepository->findOneByUrlcorta($urlPersonalizadaConDominio);
                return new JsonResponse(
                    ['mensaje' => 'El nombre esta en uso, elija otro',
                    'urlCorta' => $enlace->getUrlCorta()],
                    200
                );
            }else if(!$filtroUrl->esUrlAccesible($urlOriginal)){
                return new JsonResponse(
                    ['mensaje' => 'La Url no apunta a un sitio real',
                    'urlCorta' => $urlOriginal],
                    200
                );
            }else{
                //comienzo la creacion del enlace
                $enlace = new Enlaces();
                $fechaActual = new \DateTime();
                $fechaExpiracion = clone $fechaActual;
                $fechaExpiracion->modify('+1 year');
                $enlace->setUrlOriginal($urlOriginal);
                $usuarioActual = $this->getUser();
                if (!$usuarioActual) {
                    return new JsonResponse(['mensaje' => 'No autenticado',
                'urlCorta' => 'No autenticado'], 200);
                }
                
                $enlace->setUsuario($usuarioActual);
                //Creo la url acortada en un servicio dedicado
                $enlace->setUrlCorta($urlPersonalizadaConDominio);
                $enlace->setFechaCreacion($fechaActual);
                $enlace->setFechaExpiracion($fechaExpiracion);
                $enlace->setPersonalizado(true);
                $enlace->setCodigoQr('soy un Qr');
                $enlacesRepository->guardarEnlace($enlace, $entityManager);
                return new JsonResponse(
                    ['mensaje' => 'Enlace creado',
                    'urlCorta' => $enlace->getUrlCorta()],
                    200
                );
            }
        }else {
            //no es seguro
            return new JsonResponse(
                ['mensaje' => 'Este servicio solo acorta Urls seguras',
                'urlCorta' => 'protocolo'],
                200
            );
        }  
    }
    #[Route('/enlaces-usuario', name: 'get_user_enlaces', methods: ['GET'])]
    public function getUserEnlaces(Request $request, EnlacesRepository $enlacesRepository): JsonResponse
    {
        // Suponiendo que tienes un método para obtener el usuario actual
        $user = $this->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'No autenticado'], 401);
        }
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'No autenticado'], 401);
        }
        // Obtener todos los enlaces del usuario
        $enlaces = $user->getEnlaces(); // Obtiene la colección de enlaces

        // Transformar los datos a un formato adecuado para la respuesta
        $data = [];
        foreach ($enlaces as $enlace) {
            $data[] = [
                'id' => $enlace->getId(),
                'urlOriginal' => $enlace->getUrlOriginal(),
                'urlCorta' => $enlace->getUrlCorta(),
                'fechaCreacion' => $enlace->getFechaCreacion()->format('Y-m-d'),
                'fechaExpiracion' => $enlace->getFechaExpiracion()->format('Y-m-d'),
            ];
        }
        return new JsonResponse($data);
    }

    #[Route('/eliminar-enlace/{id}', name: 'eliminar_enlace', methods: ['DELETE'])]
    public function eliminarEnlace(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $enlace = $entityManager->getRepository(Enlaces::class)->find($id);

        if (!$enlace) {
            return new JsonResponse(['error' => 'Enlace no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Buscar y eliminar las estadísticas asociadas
        $estadisticas = $entityManager->getRepository(EstadisticasEnlaces::class)->findBy(['enlace' => $enlace]);

        foreach ($estadisticas as $estadistica) {
            $entityManager->remove($estadistica); // Eliminar cada estadística asociada
        }

        $entityManager->remove($enlace);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Enlace eliminado con éxito'], Response::HTTP_OK);
    }

    public function transformarJsonBody (Request $request) {
        $data = json_decode($request->getContent(), true);
        if(json_last_error() !== JSON_ERROR_NONE){
            throw new \InvalidArgumentException('Invalid JSON');
        }
        if($data === null){
            return $request;
        }
        $request->request->replace($data);
        return $request;
    }
}
