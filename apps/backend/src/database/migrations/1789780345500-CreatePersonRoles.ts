import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePersonRoles1789780345500 implements MigrationInterface {
  name = 'CreatePersonRoles1789780345500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`PERSON_ROLES\` (
        \`PSN_ID\` varchar(10) NOT NULL COMMENT 'รหัสบุคลากร',
        \`ROLE_ID\` int NOT NULL COMMENT 'รหัสบทบาท',
        INDEX \`IDX_PERSON_ROLES_PSN_ID\` (\`PSN_ID\`),
        INDEX \`IDX_PERSON_ROLES_ROLE_ID\` (\`ROLE_ID\`),
        PRIMARY KEY (\`PSN_ID\`, \`ROLE_ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='บทบาทของบุคลากร (เจ้าหน้าที่)'
    `);

    await queryRunner.query(`
      ALTER TABLE \`PERSON_ROLES\`
      ADD CONSTRAINT \`FK_PERSON_ROLES_PSN_ID\`
      FOREIGN KEY (\`PSN_ID\`) REFERENCES \`MSG_T_PERSON\`(\`PSN_ID\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`PERSON_ROLES\`
      ADD CONSTRAINT \`FK_PERSON_ROLES_ROLE_ID\`
      FOREIGN KEY (\`ROLE_ID\`) REFERENCES \`BUU_GET_T_ROLE\`(\`ROLE_ID\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`PERSON_ROLES\` DROP FOREIGN KEY \`FK_PERSON_ROLES_ROLE_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PERSON_ROLES\` DROP FOREIGN KEY \`FK_PERSON_ROLES_PSN_ID\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_PERSON_ROLES_ROLE_ID\` ON \`PERSON_ROLES\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_PERSON_ROLES_PSN_ID\` ON \`PERSON_ROLES\``,
    );
    await queryRunner.query(`DROP TABLE \`PERSON_ROLES\``);
  }
}
