<?php
// ...
namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Clock\DatePoint;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

class RegistroController extends AbstractController
{
    #[Route('/registro', name: 'app_registro', methods: ['POST'])]
    public function registro(Request $request, UserPasswordHasherInterface $passwordHasher, UserRepository $usuarioRepository,
    EntityManagerInterface $entityManager):Response
    { 
        $request = $this->transformarJsonBody($request);
        $user = new User();
        $user->setEmail($request->get('email'));
        $textoPlanoPass = $request->get('password');
        $hashedPassword = $passwordHasher->hashPassword(
            $user,
            $textoPlanoPass
        );
        $user->setPassword($hashedPassword);
        $ahora = new DatePoint();
        $user->setFechaRegistro($ahora);
        if($usuarioRepository->crearUsuario($user, $entityManager)){
            return new JsonResponse(['message' => 'usuario registrado'], 200);
        }else{
            return new JsonResponse(['message' => 'Error al crear usuario']);
        }
    }
    #[Route('/login', name: 'app_login', methods: ['POST'])]
    public function login(Request $request, UserPasswordHasherInterface $passwordHasher, UserRepository $usuarioRepository,
    ):Response
    {
        try {
            $request = $this->transformarJsonBody($request);
            $user = new User();
            $user = $usuarioRepository->findOneByEmail($request->get('correo'));
            //Si el usuario no esta o la contraseña no es valida, devuelvo un mensaje de credenciales incorrectas
            if (!$user || !$passwordHasher->isPasswordValid($user, $request->get('password'))){
                return new JsonResponse(['message' => 'Invalid credentials'], 401);
            }
            if ($passwordHasher->isPasswordValid($user, $request->get('password'))){        
              //  $session = $request->getSession();
               // $session->start();
                //$session->set('email', $request->get('correo'));
                return new JsonResponse(['isSuccess' => true,
                                        'usuario' => $user], 200);
            }
        } catch (\InvalidArgumentException $e){
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }
    }
    #[Route('/session', name: 'app_session', methods: ['GET'])]
    public function getSessionData(SessionInterface $session): JsonResponse
    {
        if ($session->isStarted()){
            return new JsonResponse([
                'isLogged' => true,
                'email' => $session->get('email'),
            ], 200);
        }
        return new JsonResponse(['isLogged' => false],200);
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


