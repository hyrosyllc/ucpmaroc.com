import React from "react";
import { UCP } from "@ucp/sdk";

export const schema: any[] = [];

// The HTML itself is owner-authored and isolated by the platform; the theme only places it.
export default function CupertinoHtml({ data = {}, isPreview }: any) {
  if (!data.code) {
    return isPreview ? (
      <div className="mx-auto my-12 flex max-w-3xl flex-col items-center rounded-[2rem] border-2 border-dashed border-slate-300 py-12 text-sm text-slate-400">
        <p className="font-semibold">Custom HTML block</p>
        <p className="text-xs">Paste your code in the sidebar to preview.</p>
      </div>
    ) : null;
  }
  return (
    <UCP.HtmlSandbox
      code={data.code}
      allowJavascript={data.allowJavascript}
      useTailwind={data.useTailwind}
      useFullPage={data.useFullPage}
      iframeHeight={data.iframeHeight}
    />
  );
}
