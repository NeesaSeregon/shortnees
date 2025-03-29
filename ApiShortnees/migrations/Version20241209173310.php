<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20241209173310 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE estadisticas_enlaces (id INT AUTO_INCREMENT NOT NULL, fecha_click DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', ip_usuario VARCHAR(40) DEFAULT NULL, ubicacion VARCHAR(255) DEFAULT NULL, dispositivo VARCHAR(255) DEFAULT NULL, fuente VARCHAR(255) DEFAULT NULL, cantidad_click INT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE enlaces ADD estadisticas_enlaces_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE enlaces ADD CONSTRAINT FK_325312217429C4FC FOREIGN KEY (estadisticas_enlaces_id) REFERENCES estadisticas_enlaces (id)');
        $this->addSql('CREATE INDEX IDX_325312217429C4FC ON enlaces (estadisticas_enlaces_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enlaces DROP FOREIGN KEY FK_325312217429C4FC');
        $this->addSql('DROP TABLE estadisticas_enlaces');
        $this->addSql('DROP INDEX IDX_325312217429C4FC ON enlaces');
        $this->addSql('ALTER TABLE enlaces DROP estadisticas_enlaces_id');
    }
}
