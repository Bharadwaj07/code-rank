import { MigrationInterface, QueryRunner } from "typeorm";

export class CodeSubmissionInit1768570119625 implements MigrationInterface {
    name = 'CodeSubmissionInit1768570119625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "code_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "language" character varying(20) NOT NULL, "source_code" text NOT NULL, "input_data" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "execution_started_at" TIMESTAMP WITH TIME ZONE, "execution_completed_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_abc123" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_code_submissions_user_id" ON "code_submissions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_code_submissions_status" ON "code_submissions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_code_submissions_submitted_at" ON "code_submissions" ("submitted_at" DESC)`);
        await queryRunner.query(`ALTER TABLE "code_submissions" ADD CONSTRAINT "FK_code_submissions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "code_submissions" ADD CONSTRAINT "FK_code_submissions_language" FOREIGN KEY ("language") REFERENCES "language_configs"("language_id") ON DELETE RESTRICT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "code_submissions" DROP CONSTRAINT "FK_code_submissions_language"`);
        await queryRunner.query(`ALTER TABLE "code_submissions" DROP CONSTRAINT "FK_code_submissions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_code_submissions_submitted_at"`);
        await queryRunner.query(`DROP INDEX "IDX_code_submissions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_code_submissions_user_id"`);
        await queryRunner.query(`DROP TABLE "code_submissions"`);
    }

}
