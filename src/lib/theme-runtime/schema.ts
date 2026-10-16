import type { ContentField, FieldType } from "@/features/portfolio-builder/sections/schema";

const TYPE_ALIASES: Record<string, FieldType> = {
  string: "text",
  text: "text",
  textarea: "textarea",
  richtext: "richtext",
  number: "number",
  boolean: "toggle",
  toggle: "toggle",
  select: "select",
  color: "color",
  slider: "slider",
  image: "image",
  link: "link",
  repeater: "repeater",
};

function normalizeField(raw: any, fallbackId?: string): ContentField | null {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.key ?? fallbackId;
  if (!id) return null;
  return {
    ...raw,
    id: String(id),
    label: raw.label ?? String(id),
    type: TYPE_ALIASES[String(raw.type)] ?? "text",
    defaultValue: raw.defaultValue ?? raw.default,
    itemFields: Array.isArray(raw.itemFields) ? raw.itemFields.map((f: any) => normalizeField(f)).filter(Boolean) : raw.itemFields,
  };
}

/**
 * Accepts both schema formats themes use: the array `[{ id, type, label, defaultValue, options }]`
 * and the legacy object map `{ key: { type: "string", label, default } }`.
 */
export function normalizeSchema(raw: unknown): ContentField[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((f) => normalizeField(f)).filter((f): f is ContentField => !!f);
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, any>)
      .map(([key, field]) => normalizeField(field, key))
      .filter((f): f is ContentField => !!f);
  }
  return [];
}

/** Default values for every field that declares one. */
export function schemaDefaults(schema: ContentField[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const field of schema) if (field.defaultValue !== undefined) out[field.id] = field.defaultValue;
  return out;
}
