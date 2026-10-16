import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentField, ContentSchema } from "./schema";

interface SchemaFieldsProps {
  schema: ContentSchema;
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
  /** Opens the media library; `apply` receives the chosen URL. */
  onPickImage?: (apply: (url: string) => void) => void;
}

type PickImage = SchemaFieldsProps["onPickImage"];

function emptyItem(fields: ContentField[]) {
  return Object.fromEntries(fields.map((f) => [f.id, f.defaultValue ?? (f.type === "toggle" ? false : "")]));
}

function FieldControl({ field, value, onChange, onPickImage }: { field: ContentField; value: any; onChange: (v: any) => void; onPickImage?: PickImage }) {
  const current = value ?? field.defaultValue;

  switch (field.type) {
    case "toggle":
      return <Switch checked={!!current} onCheckedChange={onChange} />;
    case "textarea":
    case "richtext":
      return (
        <Textarea
          rows={field.type === "richtext" ? 8 : 4}
          value={current ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={current ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );
    case "select":
      return (
        <Select value={current ?? ""} onValueChange={onChange}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => {
              const v = typeof opt === "string" ? opt : opt.value;
              const l = typeof opt === "string" ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt.label;
              return (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    case "slider":
      return (
        <div className="pt-2">
          <Slider
            value={[current ?? field.min ?? 0]}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            onValueChange={([v]) => onChange(v)}
          />
          <p className="mt-1 text-right text-xs font-medium text-primary">{current ?? field.min ?? 0}</p>
        </div>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={field.label}
            className="h-10 w-10 cursor-pointer rounded border p-0.5"
            value={current || "#000000"}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input className="font-mono text-xs uppercase" value={current || ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "repeater":
      return <RepeaterControl field={field} value={Array.isArray(current) ? current : []} onChange={onChange} onPickImage={onPickImage} />;
    case "image":
      return (
        <div className="flex items-center gap-2">
          {current && <img src={current} alt="" className="h-10 w-10 shrink-0 rounded border object-cover" />}
          <Input value={current ?? ""} placeholder="https://…" onChange={(e) => onChange(e.target.value)} />
          {onPickImage && (
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Choose from media library" onClick={() => onPickImage(onChange)}>
              <ImageIcon size={16} />
            </Button>
          )}
        </div>
      );
    case "link":
    case "text":
    default:
      return (
        <Input
          type={field.type === "link" ? "url" : "text"}
          value={current ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function RepeaterControl({ field, value, onChange, onPickImage }: { field: ContentField; value: any[]; onChange: (v: any[]) => void; onPickImage?: PickImage }) {
  const itemFields = field.itemFields ?? [];

  const update = (index: number, key: string, v: any) =>
    onChange(value.map((item, i) => (i === index ? { ...item, [key]: v } : item)));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="truncate text-xs font-semibold text-muted-foreground">
              {(field.itemTitleKey && item?.[field.itemTitleKey]) || `${field.label} ${index + 1}`}
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move up" onClick={() => move(index, index - 1)}>
                <ArrowUp size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move down" onClick={() => move(index, index + 1)}>
                <ArrowDown size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Remove item" onClick={() => onChange(value.filter((_, i) => i !== index))}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          {itemFields.map((child) => {
            if (child.showIf && !child.showIf(item)) return null;
            return (
              <div key={child.id} className="space-y-1.5">
                <Label className="text-xs">{child.label}</Label>
                <FieldControl field={child} value={item?.[child.id]} onChange={(v) => update(index, child.id, v)} onPickImage={onPickImage} />
              </div>
            );
          })}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...value, emptyItem(itemFields)])}>
        <Plus size={14} className="mr-1.5" /> Add {field.label.toLowerCase()}
      </Button>
    </div>
  );
}

export function SchemaFields({ schema, values, onChange, onPickImage }: SchemaFieldsProps) {
  return (
    <div className="space-y-4">
      {schema.map((field) => {
        if (field.showIf && !field.showIf(values)) return null;
        return (
          <div key={field.id} className="space-y-2 rounded-lg border bg-muted/20 p-4">
            <Label className="text-sm font-medium">{field.label}</Label>
            <FieldControl field={field} value={values[field.id]} onChange={(v) => onChange(field.id, v)} onPickImage={onPickImage} />
            {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
