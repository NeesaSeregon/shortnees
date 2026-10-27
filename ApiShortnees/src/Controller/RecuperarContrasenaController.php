<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

/**
 * Recuperacion de contrasena en dos pasos, los dos publicos.
 *
 * 1. /recuperar-contrasena recibe un email y, si es de una cuenta, le envia un
 *    enlace al front (shortnees.com/restablecer?token=...).
 * 2. /restablecer-contrasena recibe ese token y la contrasena nueva.
 *
 * El token lo genera y lo valida reset-password-bundle: caduca, es de un solo
 * uso y en la base solo queda su hash. Ver config/packages/reset_password.yaml.
 *
 * Las dos rutas son de un solo segmento. Este fichero se carga antes que
 * RedireccionController por orden alfabetico, asi que el catch-all /{urlCorta}
 * no las tapa; RutasTest lo comprueba.
 */
class RecuperarContrasenaController extends AbstractController
{
    /**
     * La misma respuesta exista o no la cuenta, y tambien si se ha frenado por
     * exceso de solicitudes o ha fallado el envio. Si se distinguieran, el
     * formulario serviria para averiguar que correos estan registrados: es el
     * mismo criterio que el 404 unico de los enlaces ajenos.
     */
    private const RESPUESTA_SOLICITUD = 'Si ese correo tiene una cuenta, te hemos enviado un enlace para restablecer la contraseña.';

    public const LONGITUD_MINIMA = 8;

    public function __construct(
        private readonly ResetPasswordHelperInterface $resetPasswordHelper,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'FRONT_URL')]
        private readonly string $urlFront,
        #[Autowire(env: 'MAILER_FROM')]
        private readonly string $remitente,
    ) {
    }

    #[Route('/recuperar-contrasena', name: 'recuperar_contrasena', methods: ['POST'])]
    public function solicitar(Request $request, UserRepository $usuarios, MailerInterface $mailer): JsonResponse
    {
        $datos = $this->leerJson($request);
        $email = trim((string) ($datos['email'] ?? ''));

        if ($email === '') {
            return new JsonResponse(['mensaje' => 'Indica tu correo.'], Response::HTTP_BAD_REQUEST);
        }

        $usuario = $usuarios->findOneBy(['email' => $email]);
        if (!$usuario instanceof User) {
            return $this->respuestaSolicitud();
        }

        try {
            $token = $this->resetPasswordHelper->generateResetToken($usuario);
        } catch (ResetPasswordExceptionInterface) {
            // Ya hay una solicitud reciente (throttle_limit). El primer correo
            // sigue valiendo; no se envia otro.
            return $this->respuestaSolicitud();
        }

        $enlace = rtrim($this->urlFront, '/') . '/restablecer?token=' . rawurlencode($token->getToken());

        try {
            $mailer->send($this->correoDeRecuperacion($usuario, $enlace));
        } catch (TransportExceptionInterface $e) {
            // Se retira la solicitud para que el usuario pueda volver a pedirla
            // sin esperar al throttle_limit por un correo que nunca le llego.
            $this->resetPasswordHelper->removeResetRequest($token->getToken());
            $this->logger->error('No se pudo enviar el correo de recuperacion: {error}', ['error' => $e->getMessage()]);
        }

        return $this->respuestaSolicitud();
    }

    #[Route('/restablecer-contrasena', name: 'restablecer_contrasena', methods: ['POST'])]
    public function restablecer(Request $request, UserPasswordHasherInterface $hasher, EntityManagerInterface $em): JsonResponse
    {
        $datos = $this->leerJson($request);
        $token = (string) ($datos['token'] ?? '');
        $password = (string) ($datos['password'] ?? '');

        // La longitud se comprueba antes de validar el token: validarlo no lo
        // consume, pero asi un error de formulario no cuesta ni una consulta.
        if (mb_strlen($password) < self::LONGITUD_MINIMA) {
            return new JsonResponse(
                ['mensaje' => sprintf('La contraseña debe tener al menos %d caracteres.', self::LONGITUD_MINIMA)],
                Response::HTTP_BAD_REQUEST
            );
        }

        try {
            /** @var User $usuario */
            $usuario = $this->resetPasswordHelper->validateTokenAndFetchUser($token);
        } catch (ResetPasswordExceptionInterface) {
            // Caducado, ya usado o inventado: al usuario le da igual cual, y
            // distinguirlos no le sirve de nada a nadie mas.
            return new JsonResponse(
                ['mensaje' => 'El enlace no es válido o ha caducado. Solicita uno nuevo.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Primero se gasta el token y luego se cambia la contrasena: si algo
        // falla entre medias, el enlace ya no sirve para un segundo intento.
        $this->resetPasswordHelper->removeResetRequest($token);

        $usuario->setPassword($hasher->hashPassword($usuario, $password));
        $em->flush();

        return new JsonResponse(['mensaje' => 'Contraseña actualizada.'], Response::HTTP_OK);
    }

    private function respuestaSolicitud(): JsonResponse
    {
        return new JsonResponse(['mensaje' => self::RESPUESTA_SOLICITUD], Response::HTTP_OK);
    }

    private function correoDeRecuperacion(User $usuario, string $enlace): Email
    {
        $minutos = intdiv($this->resetPasswordHelper->getTokenLifetime(), 60);
        $nombre = $usuario->getNombre() ?? '';
        $enlaceHtml = htmlspecialchars($enlace, ENT_QUOTES);
        $nombreHtml = htmlspecialchars($nombre, ENT_QUOTES);

        return (new Email())
            ->from($this->remitente)
            ->to($usuario->getEmail())
            ->subject('Restablece tu contraseña de Shortnees')
            ->text(
                "Hola, {$nombre}:\n\n"
                . "Alguien ha pedido restablecer la contraseña de tu cuenta de Shortnees. "
                . "Si has sido tú, abre este enlace para elegir una nueva:\n\n"
                . "{$enlace}\n\n"
                . "El enlace caduca en {$minutos} minutos y solo se puede usar una vez.\n\n"
                . "Si no lo has pedido tú, ignora este correo: tu contraseña no cambia."
            )
            ->html(
                "<p>Hola, {$nombreHtml}:</p>"
                . "<p>Alguien ha pedido restablecer la contraseña de tu cuenta de Shortnees. "
                . "Si has sido tú, abre este enlace para elegir una nueva:</p>"
                . "<p><a href=\"{$enlaceHtml}\">Restablecer la contraseña</a></p>"
                . "<p>El enlace caduca en {$minutos} minutos y solo se puede usar una vez.</p>"
                . "<p>Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.</p>"
            );
    }

    /** @return array<string, mixed> */
    private function leerJson(Request $request): array
    {
        $datos = json_decode($request->getContent(), true);

        return is_array($datos) ? $datos : [];
    }
}
