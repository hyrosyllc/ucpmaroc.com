import React from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema: any[] = [];

export default function CupertinoServicesShowcase({ data = {}, id, isPreview, actorId }: any) {
  const { services, loading } = UCP.useServicesShowcase(actorId);

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center bg-slate-50" role="status"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }
  if (services.length === 0) {
    return isPreview ? <div className="bg-slate-50 py-16 text-center text-sm text-slate-400">Enable services in your profile to show them here.</div> : null;
  }

  const renderDemo = (demo: any) =>
    demo.demo_type === "audio" ? <UCP.AudioDemoCard key={demo.demo_id} demo={demo} />
    : demo.demo_type === "video" ? <UCP.VideoDemoCard key={demo.demo_id} demo={demo} />
    : <UCP.ScriptDemoCard key={demo.demo_id} demo={demo} />;

  return (
    <section className="bg-slate-50 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} fallback="Services & Rates" />
        <Tabs defaultValue={services[0].id} className="w-full">
          <TabsList className="mx-auto mb-10 flex h-auto w-fit flex-wrap justify-center gap-1 rounded-full bg-white p-1.5 shadow-sm">
            {services.map((s) => <TabsTrigger key={s.id} value={s.id} className="rounded-full px-6 py-2.5 font-bold">{s.title}</TabsTrigger>)}
          </TabsList>
          {services.map((s) => (
            <TabsContent key={s.id} value={s.id} className="space-y-8">
              <div className="rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:p-10">
                <h3 className="text-3xl font-[800] tracking-tight text-slate-900">{s.title}</h3>
                <p className="mt-2 max-w-2xl font-medium text-slate-500">{s.description}</p>
                <p className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700">{s.rate}</p>
              </div>
              {s.demos.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">{s.demos.map(renderDemo)}</div>
              ) : (
                <p className="text-center text-slate-400">No demos yet.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
