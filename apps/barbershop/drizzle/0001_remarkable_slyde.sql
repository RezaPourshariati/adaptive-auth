ALTER TABLE "working_hours" DROP CONSTRAINT "working_hours_unique_day";--> statement-breakpoint
ALTER TABLE "staff_service" DROP CONSTRAINT "staff_service_staff_member_id_staff_member_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_service" DROP CONSTRAINT "staff_service_service_id_service_id_fk";
--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_id_business" UNIQUE("id","business_id");--> statement-breakpoint
ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_id_business" UNIQUE("id","business_id");--> statement-breakpoint
ALTER TABLE "staff_service" ADD COLUMN "business_id" uuid;--> statement-breakpoint
UPDATE "staff_service" AS "ss"
SET "business_id" = "sm"."business_id"
FROM "staff_member" AS "sm"
WHERE "sm"."id" = "ss"."staff_member_id";--> statement-breakpoint
ALTER TABLE "staff_service" ALTER COLUMN "business_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_service" ADD CONSTRAINT "staff_service_member_business_fk" FOREIGN KEY ("staff_member_id","business_id") REFERENCES "public"."staff_member"("id","business_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_service" ADD CONSTRAINT "staff_service_service_business_fk" FOREIGN KEY ("service_id","business_id") REFERENCES "public"."service"("id","business_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "working_hours_business_day" ON "working_hours" USING btree ("business_id","weekday") WHERE "working_hours"."owner_type" = 'business' AND "working_hours"."staff_member_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "working_hours_staff_day" ON "working_hours" USING btree ("business_id","staff_member_id","weekday") WHERE "working_hours"."owner_type" = 'staff' AND "working_hours"."staff_member_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_owner_consistency" CHECK ((
      ("working_hours"."owner_type" = 'business' AND "working_hours"."staff_member_id" IS NULL)
      OR ("working_hours"."owner_type" = 'staff' AND "working_hours"."staff_member_id" IS NOT NULL)
    ));
