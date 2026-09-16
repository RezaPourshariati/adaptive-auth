CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
CREATE TYPE "public"."appointment_source" AS ENUM('online', 'phone', 'walk_in', 'staff_created');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"status" "appointment_status" DEFAULT 'confirmed' NOT NULL,
	"source" "appointment_source" NOT NULL,
	"guest_name" text NOT NULL,
	"guest_phone" text,
	"guest_email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_id_business" UNIQUE("id","business_id"),
	CONSTRAINT "appointment_end_after_start" CHECK ("appointment"."end_at" > "appointment"."start_at"),
	CONSTRAINT "appointment_guest_name" CHECK (char_length(btrim("appointment"."guest_name")) BETWEEN 1 AND 80)
);
--> statement-breakpoint
CREATE TABLE "appointment_service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"service_name_snapshot" text NOT NULL,
	"duration_minutes_snapshot" integer NOT NULL,
	"price_cents_snapshot" integer NOT NULL,
	"currency_snapshot" text DEFAULT 'CAD' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "appointment_service_duration" CHECK ("appointment_service"."duration_minutes_snapshot" >= 10 AND "appointment_service"."duration_minutes_snapshot" <= 240)
);
--> statement-breakpoint
CREATE TABLE "calendar_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"staff_member_id" uuid,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"title" text NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_block_end_after_start" CHECK ("calendar_block"."end_at" > "calendar_block"."start_at"),
	CONSTRAINT "calendar_block_title" CHECK (char_length(btrim("calendar_block"."title")) BETWEEN 1 AND 80)
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_staff_business_fk" FOREIGN KEY ("staff_member_id","business_id") REFERENCES "public"."staff_member"("id","business_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_service" ADD CONSTRAINT "appointment_service_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_service" ADD CONSTRAINT "appointment_service_appointment_business_fk" FOREIGN KEY ("appointment_id","business_id") REFERENCES "public"."appointment"("id","business_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_service" ADD CONSTRAINT "appointment_service_service_business_fk" FOREIGN KEY ("service_id","business_id") REFERENCES "public"."service"("id","business_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_block" ADD CONSTRAINT "calendar_block_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_block" ADD CONSTRAINT "calendar_block_staff_business_fk" FOREIGN KEY ("staff_member_id","business_id") REFERENCES "public"."staff_member"("id","business_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_business_start" ON "appointment" USING btree ("business_id","start_at");--> statement-breakpoint
CREATE INDEX "appointment_staff_start" ON "appointment" USING btree ("staff_member_id","start_at");--> statement-breakpoint
CREATE INDEX "appointment_business_status_start" ON "appointment" USING btree ("business_id","status","start_at");--> statement-breakpoint
CREATE INDEX "calendar_block_business_start" ON "calendar_block" USING btree ("business_id","start_at");--> statement-breakpoint
CREATE INDEX "calendar_block_staff_start" ON "calendar_block" USING btree ("staff_member_id","start_at");--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "during" tstzrange GENERATED ALWAYS AS (tstzrange("start_at", "end_at", '[)')) STORED;--> statement-breakpoint
ALTER TABLE "calendar_block" ADD COLUMN "during" tstzrange GENERATED ALWAYS AS (tstzrange("start_at", "end_at", '[)')) STORED;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_no_overlap" EXCLUDE USING gist (
	"staff_member_id" WITH =,
	"during" WITH &&
) WHERE ("status" IN ('confirmed', 'completed'));--> statement-breakpoint
ALTER TABLE "calendar_block" ADD CONSTRAINT "calendar_block_staff_no_overlap" EXCLUDE USING gist (
	"staff_member_id" WITH =,
	"during" WITH &&
) WHERE ("staff_member_id" IS NOT NULL AND "cancelled_at" IS NULL);--> statement-breakpoint
ALTER TABLE "calendar_block" ADD CONSTRAINT "calendar_block_shop_no_overlap" EXCLUDE USING gist (
	"business_id" WITH =,
	"during" WITH &&
) WHERE ("staff_member_id" IS NULL AND "cancelled_at" IS NULL);--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_appointment_has_service()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM appointment_service WHERE appointment_id = NEW.id
	) THEN
		RAISE EXCEPTION 'appointment must have at least one service'
			USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER appointment_has_service
AFTER INSERT ON appointment
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_appointment_has_service();