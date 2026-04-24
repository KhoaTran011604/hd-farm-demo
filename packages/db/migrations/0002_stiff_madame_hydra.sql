ALTER TABLE "disease_records" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "disease_records" ADD COLUMN "recorded_by_id" uuid;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD COLUMN "withdrawal_days" integer;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD COLUMN "ended_at" timestamp;