import React from "react";
import { useActiveTheme } from "@/features/portfolio-builder/hooks/useActiveTheme";
import type { CommerceViewKey } from "@/lib/theme-runtime/commerceViews";

class ViewBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Custom commerce view crashed; using the built-in view.", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Props {
  themeId?: string | null;
  themeVersion?: number | null;
  view: CommerceViewKey;
  /** Built-in view used when the theme has none, is still loading, or its view crashes. */
  fallback: React.ComponentType<any>;
  [prop: string]: any;
}

/** Renders the theme's commerce view (built-in or custom) when it provides one, otherwise the platform's default view. */
export function CommerceView({ themeId, themeVersion, view, fallback: Fallback, ...props }: Props) {
  const { theme, isLoading } = useActiveTheme(themeId, themeVersion);
  const Custom = isLoading ? undefined : (theme as any)?.[view];
  if (!Custom) return <Fallback {...props} />;
  return (
    <ViewBoundary fallback={<Fallback {...props} />}>
      <React.Suspense fallback={null}>
        <Custom {...props} />
      </React.Suspense>
    </ViewBoundary>
  );
}
