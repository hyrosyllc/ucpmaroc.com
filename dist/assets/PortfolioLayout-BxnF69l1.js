import{u as T,a as M,b as I,r as F,t as C,j as t,L,c as H,H as S,O as q,C as A,d as R,T as O,D as U,e as z,s as $}from"./index-BC-Tlk-P.js";function B(s){s=s.replace(/^#/,"");let a=parseInt(s.substring(0,2),16)/255,i=parseInt(s.substring(2,4),16)/255,e=parseInt(s.substring(4,6),16)/255,o=Math.max(a,i,e),c=Math.min(a,i,e),d=0,u=0,l=(o+c)/2;if(o!==c){let r=o-c;switch(u=l>.5?r/(2-o-c):r/(o+c),o){case a:d=(i-e)/r+(i<e?6:0);break;case i:d=(e-a)/r+2;break;case e:d=(a-i)/r+4;break}d/=6}return`${Math.round(d*360)} ${Math.round(u*100)}% ${Math.round(l*100)}%`}const k={modern:{light:{background:"0 0% 100%",foreground:"240 10% 3.9%",card:"0 0% 100%",cardForeground:"240 10% 3.9%",popover:"0 0% 100%",popoverForeground:"240 10% 3.9%",secondary:"240 4.8% 95.9%",secondaryForeground:"240 5.9% 10%",muted:"240 4.8% 95.9%",mutedForeground:"240 3.8% 46.1%",accent:"240 4.8% 95.9%",accentForeground:"240 5.9% 10%",border:"240 5.9% 90%",input:"240 5.9% 90%",ring:"240 5.9% 10%"},dark:{background:"0 0% 4%",foreground:"0 0% 98%",card:"0 0% 9%",cardForeground:"0 0% 98%",popover:"0 0% 9%",popoverForeground:"0 0% 98%",secondary:"240 3.7% 15.9%",secondaryForeground:"0 0% 98%",muted:"0 0% 15%",mutedForeground:"240 5% 64.9%",accent:"240 3.7% 15.9%",accentForeground:"0 0% 98%",border:"240 3.7% 15.9%",input:"240 3.7% 15.9%",ring:"240 4.9% 83.9%"}},cinematic:{light:{background:"222.2 84% 4.9%",foreground:"210 40% 98%",card:"222.2 84% 4.9%",cardForeground:"210 40% 98%",popover:"222.2 84% 4.9%",popoverForeground:"210 40% 98%",secondary:"217.2 32.6% 17.5%",secondaryForeground:"210 40% 98%",muted:"217.2 32.6% 17.5%",mutedForeground:"215 20.2% 65.1%",accent:"217.2 32.6% 17.5%",accentForeground:"210 40% 98%",border:"217.2 32.6% 17.5%",input:"217.2 32.6% 17.5%",ring:"212.7 26.8% 83.9%"},dark:{background:"222.2 84% 4.9%",foreground:"210 40% 98%",card:"222.2 84% 4.9%",cardForeground:"210 40% 98%",popover:"222.2 84% 4.9%",popoverForeground:"210 40% 98%",secondary:"217.2 32.6% 17.5%",secondaryForeground:"210 40% 98%",muted:"217.2 32.6% 17.5%",mutedForeground:"215 20.2% 65.1%",accent:"217.2 32.6% 17.5%",accentForeground:"210 40% 98%",border:"217.2 32.6% 17.5%",input:"217.2 32.6% 17.5%",ring:"212.7 26.8% 83.9%"}}};function G({customDomain:s}){const{slug:a}=T(),e=M().pathname==="/builder-preview",{data:o,isLoading:c,isError:d}=K({slug:e?void 0:a,customDomain:e?void 0:s}),u=I();F.useEffect(()=>{if(!e&&(o!=null&&o.portfolio)&&o.portfolio.actor_id){const m=`viewed_${o.portfolio.id}_${new Date().toDateString()}`;sessionStorage.getItem(m)||(C(o.portfolio.actor_id,"page_view",{portfolio_id:o.portfolio.id}),sessionStorage.setItem(m,"true"))}},[o,e]);const l=F.useMemo(()=>e?{portfolio:{sections:u.sections,theme_config:u.themeConfig,id:"preview-id",actor_id:"preview-actor-id",site_name:"Live Preview"},actorProfile:{ActorName:"Preview Mode"}}:o,[e,u.sections,u.themeConfig,o]);if(!e&&c)return t.jsx("div",{className:"h-[100dvh] w-full flex items-center justify-center bg-background",children:t.jsx(L,{className:"animate-spin text-primary w-10 h-10"})});if(!e&&(d||!(l!=null&&l.portfolio)))return t.jsxs("div",{className:"h-[100dvh] w-full flex flex-col items-center justify-center text-center p-4 bg-background text-foreground",children:[t.jsx("h1",{className:"text-3xl font-bold mb-2",children:"Portfolio Not Found"}),t.jsx("p",{className:"text-muted-foreground",children:"This page does not exist or has not been published yet."})]});const{portfolio:r,actorProfile:f}=l||{},v=(r==null?void 0:r.sections)||[],p=(r==null?void 0:r.theme_config)||{},h=p.templateId||"modern",j=O[h]||U,g=v.find(m=>m.type==="header"),b=g?H(j,"header"):null,_=(r==null?void 0:r.site_name)||(f==null?void 0:f.ActorName)||"Portfolio",E=p.primaryColor?B(p.primaryColor):"259 94% 51%",x=p.font||"Inter",P=`https://fonts.googleapis.com/css2?family=${x.replace(/ /g,"+")}:wght@300;400;500;600;700;800;900&display=swap`,N=p.radius!==void 0?p.radius:.5,y=k[h]||k.modern,w=p.colorMode||"dark",n=w==="light"?y.light:y.dark;return t.jsxs(t.Fragment,{children:[t.jsx(S,{children:t.jsx("title",{children:_})}),t.jsx("style",{children:`
          @import url('${P}');
          
          :root, .portfolio-canvas-wrapper {
            --primary: ${E};
            --radius: ${N}rem;
            --background: ${n.background};
            --foreground: ${n.foreground};
            --card: ${n.card};
            --card-foreground: ${n.cardForeground};
            --popover: ${n.popover};
            --popover-foreground: ${n.popoverForeground};
            --secondary: ${n.secondary};
            --secondary-foreground: ${n.secondaryForeground};
            --muted: ${n.muted};
            --muted-foreground: ${n.mutedForeground};
            --accent: ${n.accent};
             --accent-foreground: ${n.accentForeground};
            --border: ${n.border};
            --input: ${n.input};
            --ring: ${n.ring};
          }
  




          .portfolio-canvas-wrapper {
            font-family: '${x}', sans-serif;
            /* Force the background color of the wrapper to match the theme */
            background-color: var(--background);
            color: var(--foreground);
          }
          
          .portfolio-canvas-wrapper button, 
          .portfolio-canvas-wrapper input, 
          .portfolio-canvas-wrapper textarea,
          .portfolio-canvas-wrapper select {
            font-family: inherit;
          }
        `}),t.jsxs("div",{className:R("portfolio-canvas-wrapper min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary",w==="dark"?"dark":""),children:[b&&(g==null?void 0:g.isVisible)&&t.jsx("div",{className:"relative z-50",children:t.jsx(b,{data:g.data,allSections:v,id:g.id,actorId:r==null?void 0:r.actor_id,portfolioId:r==null?void 0:r.id,isPreview:e})}),t.jsx("main",{className:"flex-grow relative z-0 flex flex-col min-h-[calc(100vh-80px)]",children:t.jsx(q,{context:{portfolio:r,actorProfile:f,isPreview:e}})}),!e&&t.jsx(A,{theme:h,username:a,isPreview:!1})]})]})}const K=({slug:s,customDomain:a,enabled:i=!0})=>z({queryKey:["portfolio",{slug:s,customDomain:a}],queryFn:async()=>{console.log("Fetching portfolio...",{slug:s,customDomain:a});let e=$.from("portfolios").select("*").eq("is_published",!0);if(a)e=e.eq("custom_domain",a);else if(s)e=e.eq("public_slug",s);else throw new Error("No identifier provided");const{data:o,error:c}=await e.single();if(c||!o)throw new Error("Portfolio not found");const{data:d}=await $.from("actors").select("id, ActorName, HeadshotURL, bio").eq("id",o.actor_id).single();return{portfolio:o,actorProfile:d}},enabled:i&&(!!s||!!a),refetchOnWindowFocus:!1});export{G as default};
