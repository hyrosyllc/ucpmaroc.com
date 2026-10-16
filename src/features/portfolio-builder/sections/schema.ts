export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "toggle"
  | "select"
  | "color"
  | "slider"
  | "image"
  | "link"
  | "repeater";

export interface ContentField {
  id: string;
  label: string;
  type: FieldType;
  help?: string;
  defaultValue?: any;
  placeholder?: string;
  options?: Array<string | { value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  /** Fields of each item when `type` is "repeater". */
  itemFields?: ContentField[];
  /** Label template for a repeater item, e.g. "question". */
  itemTitleKey?: string;
  showIf?: (values: Record<string, any>) => boolean;
}

export type ContentSchema = ContentField[];
