<?php

namespace App\Tests\Controller;

use App\Entity\ResetPasswordRequest;
use App\Entity\User;
use App\Tests\BaseFuncional;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Recuperacion de contrasena: /recuperar-contrasena y /restablecer-contrasena.
 *
 * En test el MAILER_DSN es null://null, asi que ningun correo sale de verdad;
 * el MessageLoggerListener de Symfony los registra igualmente y las aserciones
 * de correo de WebTestCase los leen de ahi. El token se saca del propio correo,
 * que es exactamente lo que haria el usuario.
 */
class RecuperarContrasenaTest extends BaseFuncional
{
    private const NUEVA = 'ContrasenaNueva123';

    private function solicitar(string $email): void
    {
        $this->cliente->request('POST', '/recuperar-contrasena', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email]));
    }

    private function restablecer(string $token, string $password): void
    {
        $this->cliente->request('POST', '/restablecer-contrasena', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['token' => $token, 'password' => $password]));
    }

    /** Pide el enlace para $email y devuelve el token que trae el correo. */
    private function obtenerToken(string $email): string
    {
        $this->solicitar($email);

        /** @var Email $correo */
        $correo = self::getMailerMessage();
        self::assertNotNull($correo, 'No se envio ningun correo.');
        self::assertSame(1, preg_match('#/restablecer\?token=([^\s"<&]+)#', $correo->getTextBody(), $m));

        return rawurldecode($m[1]);
    }

    private function cuerpo(): array
    {
        return json_decode($this->cliente->getResponse()->getContent(), true);
    }

    // ------------------------------------------------------------- solicitud

    #[Test]
    public function con_un_correo_registrado_se_envia_un_enlace_al_front(): void
    {
        $this->crearUsuario('ana@ejemplo.com', 'Ana');

        $this->solicitar('ana@ejemplo.com');

        self::assertResponseIsSuccessful();
        self::assertEmailCount(1);
        $correo = self::getMailerMessage();
        self::assertEmailAddressContains($correo, 'To', 'ana@ejemplo.com');
        // FRONT_URL de .env: el enlace lleva al front, no a la API.
        self::assertEmailTextBodyContains($correo, 'https://shortnees.com/restablecer?token=');
        self::assertEmailHtmlBodyContains($correo, 'https://shortnees.com/restablecer?token=');
    }

    #[Test]
    public function con_un_correo_desconocido_no_se_envia_nada(): void
    {
        $this->solicitar('nadie@ejemplo.com');

        self::assertResponseIsSuccessful();
        self::assertEmailCount(0);
    }

    #[Test]
    public function la_respuesta_no_revela_si_la_cuenta_existe(): void
    {
        $this->crearUsuario('ana@ejemplo.com');

        $this->solicitar('ana@ejemplo.com');
        $existente = $this->cliente->getResponse();
        $this->solicitar('nadie@ejemplo.com');
        $inexistente = $this->cliente->getResponse();

        self::assertSame($existente->getStatusCode(), $inexistente->getStatusCode());
        self::assertSame($existente->getContent(), $inexistente->getContent());
    }

    #[Test]
    public function una_segunda_solicitud_seguida_no_envia_otro_correo_ni_lo_delata(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $this->solicitar('ana@ejemplo.com');
        $primera = $this->cliente->getResponse()->getContent();

        $this->solicitar('ana@ejemplo.com');

        self::assertEmailCount(0);
        self::assertSame($primera, $this->cliente->getResponse()->getContent());
    }

    #[Test]
    public function sin_correo_responde_400(): void
    {
        $this->solicitar('   ');

        self::assertResponseStatusCodeSame(400);
    }

    #[Test]
    public function en_la_base_no_queda_el_token_del_correo(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');

        $fila = $this->em->getConnection()->fetchAssociative('SELECT selector, hashed_token FROM reset_password_request');

        // Selector (20 caracteres) + verificador. Solo el selector va en claro.
        self::assertStringStartsWith($fila['selector'], $token);
        self::assertStringNotContainsString(substr($token, 20), $fila['hashed_token']);
    }

    // ---------------------------------------------------------- restablecer

    #[Test]
    public function con_el_enlace_se_cambia_la_contrasena_y_se_puede_entrar_con_ella(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');

        $this->restablecer($token, self::NUEVA);
        self::assertResponseIsSuccessful();

        $this->cliente->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'ana@ejemplo.com', 'password' => self::NUEVA]));
        self::assertResponseIsSuccessful();
    }

    #[Test]
    public function la_contrasena_nueva_se_guarda_hasheada(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');

        $this->restablecer($token, self::NUEVA);

        $this->olvidarEntidadesEnMemoria();
        $usuario = $this->em->getRepository(User::class)->findOneBy(['email' => 'ana@ejemplo.com']);
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        self::assertNotSame(self::NUEVA, $usuario->getPassword());
        self::assertTrue($hasher->isPasswordValid($usuario, self::NUEVA));
    }

    #[Test]
    public function el_enlace_solo_sirve_una_vez(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');
        $this->restablecer($token, self::NUEVA);

        $this->restablecer($token, 'OtraContrasena456');

        self::assertResponseStatusCodeSame(400);
    }

    #[Test]
    public function un_enlace_caducado_no_sirve(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');
        $this->em->getConnection()->executeStatement(
            'UPDATE reset_password_request SET expires_at = ?', [(new \DateTimeImmutable('-1 minute'))->format('Y-m-d H:i:s')]
        );

        $this->restablecer($token, self::NUEVA);

        self::assertResponseStatusCodeSame(400);
    }

    #[Test]
    public function un_token_inventado_no_sirve(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');
        // El selector bueno con un verificador falso: encuentra la fila, pero
        // el hash no coincide.
        $falso = substr($token, 0, 20) . str_repeat('x', strlen($token) - 20);

        $this->restablecer($falso, self::NUEVA);

        self::assertResponseStatusCodeSame(400);
    }

    #[Test]
    public function una_contrasena_corta_se_rechaza_sin_gastar_el_enlace(): void
    {
        $this->crearUsuario('ana@ejemplo.com');
        $token = $this->obtenerToken('ana@ejemplo.com');

        $this->restablecer($token, 'corta');
        self::assertResponseStatusCodeSame(400);
        self::assertStringContainsString('8 caracteres', $this->cuerpo()['mensaje']);

        $this->restablecer($token, self::NUEVA);
        self::assertResponseIsSuccessful();
    }

    #[Test]
    public function borrar_el_usuario_borra_sus_solicitudes_pendientes(): void
    {
        $usuario = $this->crearUsuario('ana@ejemplo.com');
        $this->obtenerToken('ana@ejemplo.com');

        // Con SQL y no con el EntityManager: lo que se prueba es el
        // ON DELETE CASCADE de la clave foranea, que es lo que actua cuando se
        // borra una cuenta a mano desde phpMyAdmin.
        $this->em->getConnection()->executeStatement('DELETE FROM user WHERE id = ?', [$usuario->getId()]);

        $this->olvidarEntidadesEnMemoria();
        self::assertSame(0, $this->em->getRepository(ResetPasswordRequest::class)->count([]));
    }
}
