import { MigrationInterface, QueryRunner } from "typeorm";

export class RateLimitTrackingInit1768570119627 implements MigrationInterface {
    name = 'RateLimitTrackingInit1768570119627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rate_limit_tracking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "request_count" integer NOT NULL DEFAULT '0', "window_start" TIMESTAMP WITH TIME ZONE NOT NULL, "window_end" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_rate_limit_tracking_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_rate_limit_user_window" ON "rate_limit_tracking" ("user_id", "window_end")`);
        await queryRunner.query(`ALTER TABLE "rate_limit_tracking" ADD CONSTRAINT "FK_rate_limit_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rate_limit_tracking" DROP CONSTRAINT "FK_rate_limit_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_rate_limit_user_window"`);
        await queryRunner.query(`DROP TABLE "rate_limit_tracking"`);
    }

}
