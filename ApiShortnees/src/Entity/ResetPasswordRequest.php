<?php

namespace App\Entity;

use App\Repository\ResetPasswordRequestRepository;
use Doctrine\ORM\Mapping as ORM;
use SymfonyCasts\Bundle\ResetPassword\Model\ResetPasswordRequestInterface;
use SymfonyCasts\Bundle\ResetPassword\Model\ResetPasswordRequestTrait;

/**
 * Una solicitud de recuperacion de contrasena pendiente.
 *
 * El token que viaja en el correo se parte en dos: el selector, que se guarda
 * tal cual y sirve para encontrar la fila, y el verificador, del que solo se
 * guarda un HMAC (hashedToken). Quien lea esta tabla no puede reconstruir un
 * enlace valido. Lo resuelve ResetPasswordRequestTrait; aqui solo queda el
 * usuario.
 */
#[ORM\Entity(repositoryClass: ResetPasswordRequestRepository::class)]
class ResetPasswordRequest implements ResetPasswordRequestInterface
{
    use ResetPasswordRequestTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // ON DELETE CASCADE a diferencia del resto de claves foraneas: una
    // solicitud pendiente no tiene valor sin su usuario, y sin el cascade
    // borrar una cuenta a mano fallaria por una fila que nadie va a echar de
    // menos.
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    public function __construct(User $user, \DateTimeInterface $expiresAt, string $selector, string $hashedToken)
    {
        $this->user = $user;
        $this->initialize($expiresAt, $selector, $hashedToken);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }
}
