import { z } from "zod";
import { parseDateOnly, toDateInputValue } from "./dates";

export const itemTypeSchema = z.enum(["LOST", "FOUND"]);
export const categorySchema = z.enum([
  "ELECTRONICS",
  "DOCUMENTS",
  "ACCESSORIES",
  "BOOKS",
  "BAGS",
  "OTHER",
]);
export const contactTypeSchema = z.enum(["EMAIL", "PHONE"]);

const PHONE_RE = /^\+?[0-9]{7,15}$/;
const MAX_AGE_DAYS = 365;

const text = (required: string) => z.string({ error: required }).trim();

const dateSchema = z
  .string({ error: "Pick a date" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
  .refine((v) => {
    const d = parseDateOnly(v);
    return !Number.isNaN(d.getTime()) && toDateInputValue(d) === v; // rejects e.g. 2026-02-31
  }, "Pick a valid date")
  // One day of slack for time-zone differences between client and server.
  .refine((v) => parseDateOnly(v) <= parseDateOnly(toDateInputValue(new Date(Date.now() + 86_400_000))), "Date can't be in the future")
  .refine((v) => parseDateOnly(v).getTime() >= Date.now() - MAX_AGE_DAYS * 86_400_000, "Date must be within the last year");

// Contact format depends on contactType, so it's checked at object level — but still runs when other fields fail.
const contactReady = (p: { value: unknown }) => {
  const v = p.value as Record<string, unknown>;
  return typeof v?.contactValue === "string" && v.contactValue.trim() !== "" && (v.contactType === "EMAIL" || v.contactType === "PHONE");
};

export const createItemSchema = z
  .object({
    itemType: z.enum(["LOST", "FOUND"], { error: "Choose Lost or Found" }),
    name: text("Item name is required").min(2, "Name must be at least 2 characters").max(80, "Keep the name under 80 characters"),
    category: z.enum(categorySchema.options, { error: "Choose a category" }),
    location: text("Location is required").min(2, "Tell us where (e.g. Library)").max(80, "Keep the location under 80 characters"),
    date: dateSchema,
    description: text("Description is required")
      .min(10, "Add a few more details (at least 10 characters)")
      .max(1000, "Keep the description under 1000 characters"),
    contactName: z.string().trim().max(60, "Keep the name under 60 characters").optional().or(z.literal("")),
    contactType: z.enum(["EMAIL", "PHONE"], { error: "Choose email or phone" }),
    contactValue: text("Contact information is required").min(1, "Contact information is required"),
  })
  .refine((d) => d.contactType !== "EMAIL" || z.email().safeParse(d.contactValue).success, {
    path: ["contactValue"],
    message: "Enter a valid email address",
    when: contactReady,
  })
  .refine((d) => d.contactType !== "PHONE" || PHONE_RE.test(normalizePhone(d.contactValue)), {
    path: ["contactValue"],
    message: "Enter a valid phone number (7–15 digits)",
    when: contactReady,
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;

export function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  status: z.enum(["ALL", "LOST", "FOUND"]).catch("ALL").default("ALL"),
  category: z.union([categorySchema, z.literal("ALL")]).catch("ALL").default("ALL"),
  sort: z.enum(["newest", "oldest", "date"]).catch("newest").default("newest"),
  includeResolved: z
    .enum(["true", "false"])
    .catch("false")
    .default("false")
    .transform((v) => v === "true"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export const updateStatusSchema = z.object({ status: z.enum(["OPEN", "RESOLVED"]) });

/** Flatten Zod issues into { field: firstMessage } for forms and API responses. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
