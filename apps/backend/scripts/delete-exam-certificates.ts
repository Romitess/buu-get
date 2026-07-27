import dataSource from '../src/database/data-source';

const EXAM_ID = Number(process.argv[2] ?? '31');

async function main(): Promise<void> {
  if (!Number.isInteger(EXAM_ID) || EXAM_ID <= 0) {
    throw new Error(`Invalid EXAM_ID: ${process.argv[2]}`);
  }

  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const certificates = (await queryRunner.query(
      `SELECT c.CERT_ID, c.CERT_CODE, c.USER_ID, c.SCORES_ID, s.ERM_ID
       FROM EXAM_T_CERTIFICATES c
       INNER JOIN EXAM_T_SCORES s ON s.SCORES_ID = c.SCORES_ID
       INNER JOIN EXAM_T_ENROLLMENTS e ON e.ERM_ID = s.ERM_ID
       INNER JOIN EXAM_T_SESSIONS ss ON ss.SS_ID = e.SESSION_ID
       WHERE ss.EXAM_ID = ?`,
      [EXAM_ID],
    )) as {
      CERT_ID: number;
      CERT_CODE: string;
      USER_ID: number;
      SCORES_ID: number;
      ERM_ID: number;
    }[];

    console.log(`Certificates matched for EXAM_ID=${EXAM_ID}: ${certificates.length}`);

    if (certificates.length === 0) {
      await queryRunner.rollbackTransaction();
      return;
    }

    const certIds = certificates.map((row) => row.CERT_ID);
    const placeholders = certIds.map(() => '?').join(',');

    const result = await queryRunner.query(
      `DELETE FROM EXAM_T_CERTIFICATES WHERE CERT_ID IN (${placeholders})`,
      certIds,
    );

    await queryRunner.commitTransaction();

    console.log(`Deleted certificates: ${result.affectedRows ?? result}`);
    for (const row of certificates) {
      console.log(
        `  CERT_ID=${row.CERT_ID} CODE=${row.CERT_CODE} USER_ID=${row.USER_ID} SCORES_ID=${row.SCORES_ID} ERM_ID=${row.ERM_ID}`,
      );
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
