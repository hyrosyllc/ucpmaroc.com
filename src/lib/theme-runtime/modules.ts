import * as React from "react";
import * as ReactDOM from "react-dom";
import * as LucideReact from "lucide-react";
import * as FramerMotion from "framer-motion";
import * as Recharts from "recharts";
import * as DateFns from "date-fns";
import confetti from "canvas-confetti";
import * as ReactRouter from "react-router-dom";
import { cn } from "@/lib/utils";
import { UCP } from "@/lib/ucp-sdk";
import * as Accordion from "@/components/ui/accordion";
import * as Avatar from "@/components/ui/avatar";
import * as Badge from "@/components/ui/badge";
import * as Button from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import * as Carousel from "@/components/ui/carousel";
import * as Checkbox from "@/components/ui/checkbox";
import * as Dialog from "@/components/ui/dialog";
import * as Input from "@/components/ui/input";
import * as Label from "@/components/ui/label";
import * as Select from "@/components/ui/select";
import * as Separator from "@/components/ui/separator";
import * as Skeleton from "@/components/ui/skeleton";
import * as Slider from "@/components/ui/slider";
import * as Switch from "@/components/ui/switch";
import * as Tabs from "@/components/ui/tabs";
import * as Textarea from "@/components/ui/textarea";

// Single allowlist for Studio preview, builder preview, and the live site.
// Only `Link` is exposed from the router so themes cannot navigate programmatically.
const MODULES: Record<string, unknown> = {
  react: React,
  "react-dom": ReactDOM,
  "@ucp/sdk": { UCP },
  "@/lib/utils": { cn },
  "framer-motion": FramerMotion,
  recharts: Recharts,
  "date-fns": DateFns,
  "canvas-confetti": confetti,
  "react-router-dom": { Link: ReactRouter.Link },
  "@/components/ui/accordion": Accordion,
  "@/components/ui/avatar": Avatar,
  "@/components/ui/badge": Badge,
  "@/components/ui/button": Button,
  "@/components/ui/card": Card,
  "@/components/ui/carousel": Carousel,
  "@/components/ui/checkbox": Checkbox,
  "@/components/ui/dialog": Dialog,
  "@/components/ui/input": Input,
  "@/components/ui/label": Label,
  "@/components/ui/select": Select,
  "@/components/ui/separator": Separator,
  "@/components/ui/skeleton": Skeleton,
  "@/components/ui/slider": Slider,
  "@/components/ui/switch": Switch,
  "@/components/ui/tabs": Tabs,
  "@/components/ui/textarea": Textarea,
};

// A missing icon renders a visible placeholder instead of crashing the whole section.
const lucide = new Proxy(LucideReact as Record<string, any>, {
  get: (target, prop: string) =>
    target[prop] ?? (() => React.createElement("span", { className: "text-red-500 text-xs" }, `[${String(prop)}]`)),
});

export const ALLOWED_THEME_MODULES = [...Object.keys(MODULES), "lucide-react"];

export function resolveThemeModule(specifier: string): unknown {
  if (specifier === "lucide-react") return lucide;
  if (specifier in MODULES) return MODULES[specifier];
  throw new Error(`Module "${specifier}" is not available in themes. Allowed: ${ALLOWED_THEME_MODULES.join(", ")}`);
}

export { React };
