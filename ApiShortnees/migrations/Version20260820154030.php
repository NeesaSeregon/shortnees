<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260820154030 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Elimina estadisticas_enlaces.ip_usuario: dato personal que la aplicacion no necesita conservar (RGPD art. 5.1.c). El pais se sigue deduciendo en el momento del clic.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE estadisticas_enlaces DROP ip_usuario');
    }

    public function down(Schema $schema): void
    {
        // Recupera la columna, NO los datos: las IPs borradas no son recuperables,
        // que es justamente el objetivo de esta migracion.
        $this->addSql('ALTER TABLE estadisticas_enlaces ADD ip_usuario VARCHAR(40) DEFAULT NULL');
    }
}
