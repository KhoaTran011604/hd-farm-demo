ALTER TABLE "health_records" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "health_records" ADD COLUMN "weight_kg" numeric(7, 2);