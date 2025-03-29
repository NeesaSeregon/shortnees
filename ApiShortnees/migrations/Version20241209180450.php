<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20241209180450 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enlaces DROP FOREIGN KEY FK_325312217429C4FC');
        $this->addSql('DROP INDEX IDX_325312217429C4FC ON enlaces');
        $this->addSql('ALTER TABLE enlaces DROP estadisticas_enlaces_id');
        $this->addSql('ALTER TABLE estadisticas_enlaces ADD enlace_id INT DEFAULT NULL, DROP fuente, DROP cantidad_click, CHANGE ubicacion ubicacion VARCHAR(150) DEFAULT NULL, CHANGE dispositivo dispositivo VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE estadisticas_enlaces ADD CONSTRAINT FK_7BC04AD8F1488E2C FOREIGN KEY (enlace_id) REFERENCES enlaces (id)');
        $this->addSql('CREATE INDEX IDX_7BC04AD8F1488E2C ON estadisticas_enlaces (enlace_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enlaces ADD estadisticas_enlaces_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE enlaces ADD CONSTRAINT FK_325312217429C4FC FOREIGN KEY (estadisticas_enlaces_id) REFERENCES estadisticas_enlaces (id)');
        $this->addSql('CREATE INDEX IDX_325312217429C4FC ON enlaces (estadisticas_enlaces_id)');
        $this->addSql('ALTER TABLE estadisticas_enlaces DROP FOREIGN KEY FK_7BC04AD8F1488E2C');
        $this->addSql('DROP INDEX IDX_7BC04AD8F1488E2C ON estadisticas_enlaces');
        $this->addSql('ALTER TABLE estadisticas_enlaces ADD fuente VARCHAR(255) DEFAULT NULL, ADD cantidad_click INT NOT NULL, DROP enlace_id, CHANGE ubicacion ubicacion VARCHAR(255) DEFAULT NULL, CHANGE dispositivo dispositivo VARCHAR(255) DEFAULT NULL');
    }
}
