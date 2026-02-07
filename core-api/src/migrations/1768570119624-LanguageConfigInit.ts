import { MigrationInterface, QueryRunner } from "typeorm";

export class LanguageConfigInit1768570119624 implements MigrationInterface {
    name = 'LanguageConfigInit1768570119624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "language_configs" ("language_id" character varying(20) NOT NULL, "display_name" character varying(50) NOT NULL, "docker_image" character varying(255) NOT NULL, "compile_command" text, "execute_command" text NOT NULL, "timeout_seconds" integer NOT NULL DEFAULT '10', "max_memory_mb" integer NOT NULL DEFAULT '256', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4f7b6f5f6c8e0f6c8e0f6c8e0f" PRIMARY KEY ("language_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "language_configs"`);
    }

}
