import{u as P,a as $,b as I,r as w,t as k,j as o,L as C,c as T,H as L,O as M,C as F,d as H,T as S,D as q,e as A,s as b}from"./index-BO6xQAtW.js";function R(i){i=i.replace(/^#/,"");let s=parseInt(i.substring(0,2),16)/255,a=parseInt(i.substring(2,4),16)/255,e=parseInt(i.substring(4,6),16)/255,r=Math.max(s,a,e),n=Math.min(s,a,e),c=0,l=0,d=(r+n)/2;if(r!==n){let t=r-n;switch(l=d>.5?t/(2-r-n):t/(r+n),r){case s:c=(a-e)/t+(a<e?6:0);break;case a:c=(e-s)/t+2;break;case e:c=(s-a)/t+4;break}c/=6}return`${Math.round(c*360)} ${Math.round(l*100)}% ${Math.round(d*100)}%`}function z({customDomain:i}){const{slug:s}=P(),e=$().pathname==="/builder-preview",{data:r,isLoading:n,isError:c}=O({slug:e?void 0:s,customDomain:e?void 0:i}),l=I();w.useEffect(()=>{if(!e&&(r!=null&&r.portfolio)&&r.portfolio.actor_id){const h=`viewed_${r.portfolio.id}_${new Date().toDateString()}`;sessionStorage.getItem(h)||(k(r.portfolio.actor_id,"page_view",{portfolio_id:r.portfolio.id}),sessionStorage.setItem(h,"true"))}},[r,e]);const d=w.useMemo(()=>e?{portfolio:{sections:l.sections,theme_config:l.themeConfig,id:"preview-id",actor_id:"preview-actor-id",site_name:"Live Preview"},actorProfile:{ActorName:"Preview Mode"}}:r,[e,l.sections,l.themeConfig,r]);if(!e&&n)return o.jsx("div",{className:"h-[100dvh] w-full flex items-center justify-center bg-background",children:o.jsx(C,{className:"animate-spin text-primary w-10 h-10"})});if(!e&&(c||!(d!=null&&d.portfolio)))return o.jsxs("div",{className:"h-[100dvh] w-full flex flex-col items-center justify-center text-center p-4 bg-background text-foreground",children:[o.jsx("h1",{className:"text-3xl font-bold mb-2",children:"Portfolio Not Found"}),o.jsx("p",{className:"text-muted-foreground",children:"This page does not exist or has not been published yet."})]});const{portfolio:t,actorProfile:u}=d||{},g=(t==null?void 0:t.sections)||[],f=(t==null?void 0:t.theme_config)||{},p=f.templateId||"modern",y=S[p]||q,m=g.find(h=>h.type==="header"),v=m?T(y,"header"):null,j=(t==null?void 0:t.site_name)||(u==null?void 0:u.ActorName)||"Portfolio",_=f.primaryColor?R(f.primaryColor):"259 94% 51%",x=f.font||"Inter",E=`https://fonts.googleapis.com/css2?family=${x.replace(/ /g,"+")}:wght@300;400;500;600;700;800;900&display=swap`,N=f.radius!==void 0?f.radius:.5;return o.jsxs(o.Fragment,{children:[o.jsx(L,{children:o.jsx("title",{children:j})}),o.jsx("style",{children:`
          @import url('${E}');
          
          :root {
            --primary: ${_};
            --radius: ${N}rem;
          }

          .portfolio-canvas-wrapper {
            font-family: '${x}', sans-serif;
            /* Force the background color of the wrapper to match the theme */
            background-color: ${p==="cinematic"?"#0f172a":"var(--background)"};
            color: ${p==="cinematic"?"#f8fafc":"var(--foreground)"};
          }
          
          .portfolio-canvas-wrapper button, 
          .portfolio-canvas-wrapper input, 
          .portfolio-canvas-wrapper textarea,
          .portfolio-canvas-wrapper select {
            font-family: inherit;
          }
        `}),o.jsxs("div",{className:H("portfolio-canvas-wrapper min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary",p==="cinematic"?"dark":""),children:[v&&(m==null?void 0:m.isVisible)&&o.jsx("div",{className:"relative z-50",children:o.jsx(v,{data:m.data,allSections:g,id:m.id,actorId:t==null?void 0:t.actor_id,portfolioId:t==null?void 0:t.id,isPreview:e})}),o.jsx("main",{className:"flex-grow relative z-0 flex flex-col min-h-[calc(100vh-80px)]",children:o.jsx(M,{context:{portfolio:t,actorProfile:u,isPreview:e}})}),!e&&o.jsx(F,{theme:p,username:s,isPreview:!1})]})]})}const O=({slug:i,customDomain:s,enabled:a=!0})=>A({queryKey:["portfolio",{slug:i,customDomain:s}],queryFn:async()=>{console.log("Fetching portfolio...",{slug:i,customDomain:s});let e=b.from("portfolios").select("*").eq("is_published",!0);if(s)e=e.eq("custom_domain",s);else if(i)e=e.eq("public_slug",i);else throw new Error("No identifier provided");const{data:r,error:n}=await e.single();if(n||!r)throw new Error("Portfolio not found");const{data:c}=await b.from("actors").select("id, ActorName, HeadshotURL, bio").eq("id",r.actor_id).single();return{portfolio:r,actorProfile:c}},enabled:a&&(!!i||!!s),refetchOnWindowFocus:!1});export{z as default};
