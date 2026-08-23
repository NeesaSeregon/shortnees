<?php

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

/**
 * Aqui solo queda el alta de usuarios.
 *
 * El inicio de sesion es cosa del firewall: /api/login_check (json_login de
 * Lexik) comprueba las credenciales y emite el JWT en la cookie BEARER.
 * Habia ademas un /login que repetia esa comprobacion a mano y un /session
 * que leia una sesion que nunca existe (todos los firewalls son stateless);
 * los dos se eliminaron. El nombre del usuario, que era lo unico que /login
 * aportaba, viaja ahora en el payload del token (ver AnadirNombreAlJwt).
 */
class RegistroController extends AbstractController
{
    #[Route('/registro', name: 'app_registro', methods: ['POST'])]
    public function registro(Request $request, UserPasswordHasherInterface $passwordHasher, UserRepository $usuarioRepository,
    EntityManagerInterface $entityManager):Response
    { 
        $request = $this->transformarJsonBody($request);
        $user = new User();
        $user->setEmail($request->request->get('email'));
        $user->setNombre($request->request->get('nombre'));
        $user->setRoles(['ROLE_USER']);
        $textoPlanoPass = $request->request->get('password');
        $hashedPassword = $passwordHasher->hashPassword(
            $user,
            $textoPlanoPass
        );
        $user->setPassword($hashedPassword);
        $ahora = new DatePoint();
        $user->setFechaRegistro($ahora);
        if($usuarioRepository->crearUsuario($user, $entityManager)){
            return new JsonResponse(['message' => 'usuario registrado'], 201);
        }else{
            return new JsonResponse(['message' => 'Error al crear usuario'], 400);
        }
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
