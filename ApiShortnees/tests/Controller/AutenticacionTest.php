<?php

namespace App\Tests\Controller;

use App\Entity\User;
use App\Tests\BaseFuncional;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Alta de usuarios e inicio de sesion.
 *
 * /api/login_check es la unica ruta de autenticacion que queda: el /login
 * artesanal que repetia a mano la comprobacion de credenciales se elimino, y
 * con el la segunda peticion que hacia el front en cada inicio de sesion. Lo
 * unico que aportaba era el nombre del usuario, que ahora viaja en el payload
 * del token gracias a EventListener\AnadirNombreAlJwt. Eso es justamente lo que
 * fijan estos tests.
 */
class AutenticacionTest extends BaseFuncional
{
    private const PASSWORD = 'ContrasenaDePrueba1';

    private function crearUsuarioConPassword(string $email, string $nombre = 'Ana'): User
    {
        $usuario = $this->crearUsuario($email, $nombre);
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $usuario->setPassword($hasher->hashPassword($usuario, self::PASSWORD));

        $this->em->flush();

        return $usuario;
    }

    private function iniciarSesion(string $email, string $password): void
    {
        $this->cliente->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => $email, 'password' => $password]));
    }

    // -------------------------------------------------------------- registro

    #[Test]
    public function un_alta_valida_devuelve_201_y_crea_el_usuario(): void
    {
        $this->cliente->request('POST', '/registro', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'nueva@ejemplo.com', 'nombre' => 'Nueva', 'password' => self::PASSWORD]));

        self::assertResponseStatusCodeSame(201);
        self::assertNotNull($this->em->getRepository(User::class)->findOneBy(['email' => 'nueva@ejemplo.com']));
    }

    #[Test]
    public function la_contrasena_no_se_guarda_en_claro(): void
    {
        $this->cliente->request('POST', '/registro', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'nueva@ejemplo.com', 'nombre' => 'Nueva', 'password' => self::PASSWORD]));

        $this->olvidarEntidadesEnMemoria();
        $guardada = $this->em->getRepository(User::class)->findOneBy(['email' => 'nueva@ejemplo.com'])->getPassword();

        self::assertNotSame(self::PASSWORD, $guardada);
        self::assertStringStartsWith('$2y$', $guardada);
    }

    #[Test]
    public function un_email_repetido_devuelve_400(): void
    {
        // La columna email es unica: crearUsuario() captura la excepcion y
        // devuelve false. Antes se comprobaba con if ($em->flush()), que siempre
        // era false porque flush() no devuelve nada.
        $this->crearUsuario('ocupado@ejemplo.com');
        $this->olvidarEntidadesEnMemoria();

        $this->cliente->request('POST', '/registro', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'ocupado@ejemplo.com', 'nombre' => 'Otro', 'password' => self::PASSWORD]));

        self::assertResponseStatusCodeSame(400);
    }

    // ------------------------------------------------------------------ login

    #[Test]
    public function con_las_credenciales_correctas_se_recibe_la_cookie_BEARER(): void
    {
        $this->crearUsuarioConPassword('ana@ejemplo.com');
        $this->olvidarEntidadesEnMemoria();

        $this->iniciarSesion('ana@ejemplo.com', self::PASSWORD);

        self::assertResponseIsSuccessful();
        $cookie = $this->cliente->getResponse()->headers->getCookies()[0] ?? null;
        self::assertNotNull($cookie, 'El login deberia devolver una cookie');
        self::assertSame('BEARER', $cookie->getName());
    }

    #[Test]
    public function la_cookie_del_token_es_httpOnly(): void
    {
        // Es lo que impide que un XSS lea el token desde JavaScript. Por eso el
        // front no guarda el token en localStorage: solo la fecha de caducidad.
        $this->crearUsuarioConPassword('ana@ejemplo.com');
        $this->olvidarEntidadesEnMemoria();

        $this->iniciarSesion('ana@ejemplo.com', self::PASSWORD);

        self::assertTrue($this->cliente->getResponse()->headers->getCookies()[0]->isHttpOnly());
    }

    #[Test]
    public function el_payload_del_token_incluye_el_nombre(): void
    {
        // De aqui saca el front el perfil del usuario sin una segunda peticion.
        $this->crearUsuarioConPassword('ana@ejemplo.com', 'Ana');
        $this->olvidarEntidadesEnMemoria();

        $this->iniciarSesion('ana@ejemplo.com', self::PASSWORD);

        $payload = $this->payloadDeLaCookie();

        self::assertSame('Ana', $payload['nombre']);
        self::assertSame('ana@ejemplo.com', $payload['username']);
        self::assertSame(['ROLE_USER'], $payload['roles']);
    }

    #[Test]
    public function el_payload_no_lleva_nada_que_el_usuario_no_pueda_ver(): void
    {
        // El payload es base64, no va cifrado: cualquiera con el token lo lee.
        $this->crearUsuarioConPassword('ana@ejemplo.com');
        $this->olvidarEntidadesEnMemoria();

        $this->iniciarSesion('ana@ejemplo.com', self::PASSWORD);

        self::assertSame(
            ['iat', 'exp', 'roles', 'username', 'nombre'],
            array_keys($this->payloadDeLaCookie()),
        );
    }

    #[Test]
    public function unas_credenciales_incorrectas_devuelven_401(): void
    {
        $this->crearUsuarioConPassword('ana@ejemplo.com');
        $this->olvidarEntidadesEnMemoria();

        $this->iniciarSesion('ana@ejemplo.com', 'no-es-la-suya');

        self::assertResponseStatusCodeSame(401);
        self::assertSame([], $this->cliente->getResponse()->headers->getCookies());
    }

    #[Test]
    public function un_usuario_inexistente_devuelve_401(): void
    {
        $this->iniciarSesion('nadie@ejemplo.com', self::PASSWORD);

        self::assertResponseStatusCodeSame(401);
    }

    /** Decodifica el payload del JWT que viaja en la cookie BEARER. */
    private function payloadDeLaCookie(): array
    {
        $token = $this->cliente->getResponse()->headers->getCookies()[0]->getValue();
        $payload = explode('.', $token)[1];

        return json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
    }
}
