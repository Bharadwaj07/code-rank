import { MigrationInterface, QueryRunner } from "typeorm";

export class ExecutionResultInit1768570119626 implements MigrationInterface {
    name = 'ExecutionResultInit1768570119626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "execution_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submission_id" uuid NOT NULL, "stdout" text, "stderr" text, "compilation_error" text, "runtime_error" text, "execution_time_ms" integer, "memory_used_kb" integer, "exit_code" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_execution_results_submission_id" UNIQUE ("submission_id"), CONSTRAINT "PK_execution_results_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_execution_results_submission_id" ON "execution_results" ("submission_id")`);
        await queryRunner.query(`ALTER TABLE "execution_results" ADD CONSTRAINT "FK_execution_results_submission_id" FOREIGN KEY ("submission_id") REFERENCES "code_submissions"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "execution_results" DROP CONSTRAINT "FK_execution_results_submission_id"`);
        await queryRunner.query(`DROP INDEX "IDX_execution_results_submission_id"`);
        await queryRunner.query(`DROP TABLE "execution_results"`);
    }

}
