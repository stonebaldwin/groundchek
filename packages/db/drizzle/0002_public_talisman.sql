DROP INDEX "permits_jurisdiction_idx";--> statement-breakpoint
DROP INDEX "permits_project_type_idx";--> statement-breakpoint
DROP INDEX "permits_status_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_event_subscription_idx" ON "alerts" USING btree ("permit_event_id","alert_subscription_id");--> statement-breakpoint
CREATE INDEX "contractors_permit_count_idx" ON "contractors" USING btree ("permit_count");--> statement-breakpoint
CREATE INDEX "permits_jurisdiction_issued_idx" ON "permits" USING btree ("jurisdiction_id","issued_date");--> statement-breakpoint
CREATE INDEX "permits_project_type_issued_idx" ON "permits" USING btree ("project_type","issued_date");--> statement-breakpoint
CREATE INDEX "permits_status_issued_idx" ON "permits" USING btree ("status","issued_date");