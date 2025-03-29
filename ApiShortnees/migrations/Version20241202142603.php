<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20241202142603 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE enlaces (id INT AUTO_INCREMENT NOT NULL, usuario_id INT DEFAULT NULL, url_original VARCHAR(2100) NOT NULL, url_corta VARCHAR(2100) NOT NULL, fecha_creacion DATETIME NOT NULL, fecha_expiracion DATETIME NOT NULL, personalizado TINYINT(1) NOT NULL, codigo_qr LONGTEXT DEFAULT NULL, INDEX IDX_32531221DB38439E (usuario_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE enlaces ADD CONSTRAINT FK_32531221DB38439E FOREIGN KEY (usuario_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enlaces DROP FOREIGN KEY FK_32531221DB38439E');
        $this->addSql('DROP TABLE enlaces');
    }
}
