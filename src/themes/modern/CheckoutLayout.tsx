import React from "react";
import { Outlet, Link, useOutletContext } from "react-router-dom";

const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
    "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
];

const CheckoutLayout = () => {
  // Grab the portfolio context passed down from the root PublicPortfolioLayout
  const { portfolio } = useOutletContext<{ portfolio: any }>();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative font-sans selection:bg-primary selection:text-primary-foreground">
      <main className="flex-grow w-full h-full relative z-10">
        <Outlet context={{ portfolio }} />
      </main>
    </div>
  );
};

export default CheckoutLayout;
