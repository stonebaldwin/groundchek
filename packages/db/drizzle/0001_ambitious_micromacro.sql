ALTER TABLE "properties" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "zip" text;--> statement-breakpoint
CREATE INDEX "properties_zip_idx" ON "properties" USING btree ("zip");