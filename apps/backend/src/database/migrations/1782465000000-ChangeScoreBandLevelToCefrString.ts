import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeScoreBandLevelToCefrString1782465000000 implements MigrationInterface {
  name = 'ChangeScoreBandLevelToCefrString1782465000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `EXAM_T_SCORES` CHANGE `SC_BAND_LEVEL` `SC_BAND_LEVEL` varchar(20) NULL COMMENT 'ระดับ CEFR'",
    );
    await queryRunner.query(
      "UPDATE `EXAM_T_SCORES` SET `SC_BAND_LEVEL` = CASE `SC_BAND_LEVEL` WHEN '1' THEN 'A2' WHEN '2' THEN 'A2' WHEN '3' THEN 'B1' WHEN '4' THEN 'B1' WHEN '5' THEN 'B2' ELSE NULL END WHERE `SC_BAND_LEVEL` IS NOT NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `EXAM_T_SCORES` SET `SC_BAND_LEVEL` = CASE UPPER(TRIM(`SC_BAND_LEVEL`)) WHEN 'A2' THEN '1' WHEN 'B1' THEN '3' WHEN 'B2' THEN '5' ELSE NULL END WHERE `SC_BAND_LEVEL` IS NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `EXAM_T_SCORES` CHANGE `SC_BAND_LEVEL` `SC_BAND_LEVEL` int NULL COMMENT 'ระดับ Band'",
    );
  }
}
