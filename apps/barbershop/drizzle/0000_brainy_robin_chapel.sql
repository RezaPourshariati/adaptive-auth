CREATE TYPE "public"."hours_owner_type" AS ENUM('business', 'staff');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('owner', 'manager', 'barber');--> statement-breakpoint
CREATE TABLE "business" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address_line" text NOT NULL,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"timezone" text DEFAULT 'America/Vancouver' NOT NULL,
	"cancel_notice_hours" integer DEFAULT 4 NOT NULL,
	"late_cancel_behavior" text DEFAULT 'contact_shop' NOT NULL,
	"contact_instructions" text NOT NULL,
	"deposit_percent" integer DEFAULT 20 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_business_name" UNIQUE("business_id","name")
);
--> statement-breakpoint
CREATE TABLE "staff_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_service" (
	"staff_member_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	CONSTRAINT "staff_service_staff_member_id_service_id_pk" PRIMARY KEY("staff_member_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "staff_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "staff_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "staff_role" DEFAULT 'owner' NOT NULL,
	"staff_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_business_email" UNIQUE("business_id","email")
);
--> statement-breakpoint
CREATE TABLE "working_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"owner_type" "hours_owner_type" NOT NULL,
	"staff_member_id" uuid,
	"weekday" smallint NOT NULL,
	"start_local" time NOT NULL,
	"end_local" time NOT NULL,
	CONSTRAINT "working_hours_unique_day" UNIQUE("business_id","owner_type","staff_member_id","weekday")
);
--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_service" ADD CONSTRAINT "staff_service_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_service" ADD CONSTRAINT "staff_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_session" ADD CONSTRAINT "staff_session_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_user" ADD CONSTRAINT "staff_user_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_user" ADD CONSTRAINT "staff_user_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;