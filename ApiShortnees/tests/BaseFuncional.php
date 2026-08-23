<?php

namespace App\Tests;

use App\Entity\Enlaces;
use App\Entity\EstadisticasEnlaces;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\BrowserKit\Cookie;

/**
 * Base de los tests funcionales.
 *
 * WebTestCase mete una Request por el kernel y recoge la Response sin levantar
 * ningun servidor web: se recorre el enrutado, el firewall, los controladores y
 * Doctrine de verdad, pero en el mismo proceso de PHPUnit.
 *
 * Los datos los fabrica cada test con estos ayudantes en vez de leer los que ya
 * haya en la base. Asi el test dice por si solo en que situacion esta, y no
 * depende de cuantos enlaces tenga esta maquina hoy. DAMADoctrineTestBundle
 * envuelve cada test en una transaccion y la deshace al terminar, de modo que
 * webtools_test queda igual que estaba.
 */
abstract class BaseFuncional extends WebTestCase
{
    protected KernelBrowser $cliente;
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->cliente = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function crearUsuario(string $email, string $nombre = 'Prueba'): User
    {
        $usuario = new User();
        $usuario->setEmail($email);
        $usuario->setNombre($nombre);
        $usuario->setRoles(['ROLE_USER']);
        // No hace falta hashear: ningun test de estos pasa por el login.
        $usuario->setPassword('irrelevante-para-el-test');
        $usuario->setFechaRegistro(new \DateTimeImmutable());

        $this->em->persist($usuario);
        $this->em->flush();

        return $usuario;
    }

    protected function crearEnlace(User $usuario, string $codigo, string $destino = 'https://ejemplo.com'): Enlaces
    {
        $enlace = new Enlaces();
        $enlace->setUrlOriginal($destino);
        // url_corta guarda el dominio dentro de la cadena, no solo el codigo.
        $enlace->setUrlCorta('shortns.com/' . $codigo);
        $enlace->setFechaCreacion(new \DateTime());
        $enlace->setFechaExpiracion(new \DateTime('+1 year'));
        $enlace->setPersonalizado(false);
        $enlace->setUsuario($usuario);

        $this->em->persist($enlace);
        $this->em->flush();

        return $enlace;
    }

    protected function crearEstadistica(Enlaces $enlace, string $pais = 'ES', string $dispositivo = 'Desktop'): EstadisticasEnlaces
    {
        $estadistica = new EstadisticasEnlaces();
        $estadistica->setEnlace($enlace);
        $estadistica->setFechaClick(new \DateTimeImmutable());
        $estadistica->setUbicacion($pais);
        $estadistica->setDispositivo($dispositivo);

        $this->em->persist($estadistica);
        $this->em->flush();

        return $estadistica;
    }

    /**
     * Autentica poniendo un JWT real en la cookie BEARER.
     *
     * Se hace asi y no con $cliente->loginUser() a proposito: esta aplicacion no
     * usa la cabecera Authorization -el extractor esta desactivado en
     * lexik_jwt_authentication.yaml- sino una cookie httpOnly. Generando el
     * token de verdad, el test recorre el mismo camino que un navegador.
     */
    protected function autenticar(User $usuario): void
    {
        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($usuario);

        $this->cliente->getCookieJar()->set(new Cookie('BEARER', $token));
    }

    /**
     * Vacia el identity map de Doctrine.
     *
     * Hace falta porque el test y la peticion comparten EntityManager: el
     * cliente de WebTestCase usa el mismo contenedor. Cuando un test crea un
     * usuario y luego le anade enlaces, la coleccion $usuario->getEnlaces() que
     * quedo en memoria sigue vacia, porque Doctrine no rellena el lado inverso
     * de una relacion al persistir el lado propietario. En produccion no pasa:
     * cada peticion trae su propio EntityManager reciente.
     *
     * Llamando a esto antes de la peticion, el controlador carga las entidades
     * desde la base y ve exactamente lo que veria de verdad.
     */
    protected function olvidarEntidadesEnMemoria(): void
    {
        $this->em->clear();
    }

    /** Cuenta las filas de una tabla, para comprobar efectos secundarios. */
    protected function contarEstadisticasDe(Enlaces $enlace): int
    {
        return (int) $this->em->createQuery(
            'SELECT COUNT(e.id) FROM App\Entity\EstadisticasEnlaces e WHERE e.enlace = :enlace'
        )->setParameter('enlace', $enlace)->getSingleScalarResult();
    }
}
