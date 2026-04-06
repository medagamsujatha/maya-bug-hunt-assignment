import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bugsTable = pgTable("bugs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Other"),
  severity: text("severity").notNull().default("Medium"),
  status: text("status").notNull().default("Draft"),
  environment: text("environment").notNull(),
  stepsToReproduce: text("steps_to_reproduce").notNull(),
  expectedBehaviour: text("expected_behaviour").notNull(),
  actualBehaviour: text("actual_behaviour").notNull(),
  rootCause: text("root_cause"),
  suggestedFix: text("suggested_fix"),
  submittedToForm: boolean("submitted_to_form").notNull().default(false),
  formSubmissionUrl: text("form_submission_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBugSchema = createInsertSchema(bugsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBug = z.infer<typeof insertBugSchema>;
export type Bug = typeof bugsTable.$inferSelect;
