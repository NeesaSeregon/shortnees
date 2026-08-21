<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260821120943 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Elimina enlaces.codigo_qr: el QR se genera en cliente a partir de la url corta, asi que no habia nada que guardar. La columna solo contenia el relleno "soy un Qr".';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE enlaces DROP codigo_qr');
    }

    public function down(Schema $schema): void
    {
        // Recupera la columna vacia. No hay datos que restaurar: nunca los hubo.
        $this->addSql('ALTER TABLE enlaces ADD codigo_qr LONGTEXT DEFAULT NULL');
    }
}
