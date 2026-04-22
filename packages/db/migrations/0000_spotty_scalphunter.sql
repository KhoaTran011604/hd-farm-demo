CREATE TABLE "animal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"species" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "animals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"pen_id" uuid,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"status" text DEFAULT 'healthy' NOT NULL,
	"qr_code" text NOT NULL,
	"type_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "animals_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "companies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "disease_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"disease_type_id" uuid,
	"severity" text NOT NULL,
	"symptoms" text,
	"diagnosed_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disease_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"species" text,
	"symptoms" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "feed_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"species" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeding_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"pen_id" uuid,
	"feed_type_id" uuid,
	"amount" numeric(10, 3),
	"unit" text DEFAULT 'kg',
	"fed_by_id" uuid NOT NULL,
	"fed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"checker_id" uuid NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reproduction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"partner_id" uuid,
	"offspring_count" integer,
	"notes" text,
	"recorded_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"disease_record_id" uuid,
	"medicine" text NOT NULL,
	"dosage" text,
	"treated_by_id" uuid NOT NULL,
	"treated_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_farm_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'worker' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vaccination_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"vaccine_type_id" uuid,
	"batch_number" text,
	"vaccinated_by_id" uuid NOT NULL,
	"vaccinated_at" timestamp DEFAULT now() NOT NULL,
	"next_due_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaccine_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"species" text,
	"description" text,
	"interval_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_pen_id_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."pens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_records" ADD CONSTRAINT "disease_records_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_records" ADD CONSTRAINT "disease_records_disease_type_id_disease_types_id_fk" FOREIGN KEY ("disease_type_id") REFERENCES "public"."disease_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeding_records" ADD CONSTRAINT "feeding_records_pen_id_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."pens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeding_records" ADD CONSTRAINT "feeding_records_feed_type_id_feed_types_id_fk" FOREIGN KEY ("feed_type_id") REFERENCES "public"."feed_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pens" ADD CONSTRAINT "pens_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reproduction_events" ADD CONSTRAINT "reproduction_events_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reproduction_events" ADD CONSTRAINT "reproduction_events_partner_id_animals_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_disease_record_id_disease_records_id_fk" FOREIGN KEY ("disease_record_id") REFERENCES "public"."disease_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_farm_roles" ADD CONSTRAINT "user_farm_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_farm_roles" ADD CONSTRAINT "user_farm_roles_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_vaccine_type_id_vaccine_types_id_fk" FOREIGN KEY ("vaccine_type_id") REFERENCES "public"."vaccine_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "animals_company_farm_idx" ON "animals" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "animals_status_idx" ON "animals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "animals_qr_code_idx" ON "animals" USING btree ("qr_code");--> statement-breakpoint
CREATE INDEX "animals_deleted_at_idx" ON "animals" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "batches_company_farm_idx" ON "batches" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "disease_records_company_farm_idx" ON "disease_records" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "disease_records_animal_idx" ON "disease_records" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "farms_company_idx" ON "farms" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "feeding_records_company_farm_idx" ON "feeding_records" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "feeding_records_pen_idx" ON "feeding_records" USING btree ("pen_id");--> statement-breakpoint
CREATE INDEX "health_records_company_farm_idx" ON "health_records" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "health_records_animal_idx" ON "health_records" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "pens_zone_idx" ON "pens" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "pens_company_farm_idx" ON "pens" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "reproduction_events_company_farm_idx" ON "reproduction_events" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "reproduction_events_animal_idx" ON "reproduction_events" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "treatment_records_company_farm_idx" ON "treatment_records" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "treatment_records_animal_idx" ON "treatment_records" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "user_farm_roles_user_farm_idx" ON "user_farm_roles" USING btree ("user_id","farm_id");--> statement-breakpoint
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vaccination_records_company_farm_idx" ON "vaccination_records" USING btree ("company_id","farm_id");--> statement-breakpoint
CREATE INDEX "vaccination_records_animal_idx" ON "vaccination_records" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "zones_farm_idx" ON "zones" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "zones_company_farm_idx" ON "zones" USING btree ("company_id","farm_id");