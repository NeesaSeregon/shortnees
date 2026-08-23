<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Pone el esquema al dia con DBAL 4.
 *
 * DBAL 3 anotaba en un comentario de columna el tipo de Doctrine que no se podia
 * deducir del tipo SQL: COMMENT '(DC2Type:json)'. DBAL 4 elimino ese mecanismo y
 * usa directamente el tipo del motor. Resultado: dos columnas quedaron a medio
 * camino en cuanto se subio la libreria.
 *
 *  - estadisticas_enlaces.fecha_click: solo sobra el comentario. El tipo SQL ya
 *    era el correcto, asi que este cambio no toca ni un dato.
 *  - user.roles: pasa de LONGTEXT a JSON, el tipo nativo. En MariaDB, JSON es un
 *    alias de LONGTEXT con una restriccion CHECK (json_valid(...)), de modo que
 *    los datos se conservan tal cual; lo unico que se anade es la validacion.
 *    Si alguna fila tuviera JSON invalido, el ALTER fallaria: no deberia pasar,
 *    porque todas las escribio Doctrine, pero conviene saberlo antes de lanzarlo
 *    en produccion.
 *
 * Ninguno de los dos cambios altera el comportamiento de la aplicacion. Se
 * aplican para que el esquema y las entidades vuelvan a coincidir y
 * doctrine:migrations:diff deje de proponerlos en cada ejecucion.
 */
final class Version20260823111119 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Retira los comentarios DC2Type que DBAL 4 ya no usa y pasa user.roles a JSON nativo.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE estadisticas_enlaces CHANGE fecha_click fecha_click DATETIME NOT NULL');
        $this->addSql('ALTER TABLE user CHANGE roles roles JSON NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // Se devuelven los tipos y los comentarios que tenian con DBAL 3. Ojo:
        // el diff generaba aqui un 'JSON NOT NULL COMMENT ...', que no revertia
        // nada porque dejaba la columna en JSON. El tipo original era LONGTEXT.
        $this->addSql('ALTER TABLE estadisticas_enlaces CHANGE fecha_click fecha_click DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE user CHANGE roles roles LONGTEXT NOT NULL COMMENT \'(DC2Type:json)\'');
    }
}
