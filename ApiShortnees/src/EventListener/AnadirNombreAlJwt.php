<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

/**
 * Anade el nombre del usuario al payload del JWT.
 *
 * Lexik solo incluye username (el email) y roles. El front necesita ademas el
 * nombre para la cabecera, y sin esto haria falta una segunda peticion solo
 * para eso: era la unica razon de ser del endpoint /login, que reimplementaba
 * a mano la autenticacion que /api/login_check ya hace bien.
 *
 * El payload de un JWT es base64 legible, no cifrado. No se expone nada nuevo:
 * nombre y email ya viajaban en claro al front y se guardan en localStorage.
 * No metas aqui nada que no pudiera ver el propio usuario.
 */
#[AsEventListener(event: Events::JWT_CREATED)]
final class AnadirNombreAlJwt
{
    public function __invoke(JWTCreatedEvent $event): void
    {
        $usuario = $event->getUser();
        if (!$usuario instanceof User) {
            return;
        }

        $payload = $event->getData();
        $payload['nombre'] = $usuario->getNombre();
        $event->setData($payload);
    }
}
