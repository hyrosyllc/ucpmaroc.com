import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Loader2, Mail, User } from "lucide-react";

export default function CupertinoLoginLayout({ portfolio, name, setName, email, setEmail, password, setPassword, isSignUp, setIsSignUp, isLoading, error, successMessage, handleAuth, shopUrl }: any) {
  const field = "h-14 w-full rounded-full border-0 bg-slate-50 pl-12 pr-5 text-base font-medium text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-slate-900";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 pt-24 font-sans text-slate-900">
      <div className="w-full max-w-md">
        <Link to={shopUrl} className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 transition hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {portfolio.site_name || "Shop"}
        </Link>

        <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white"><Lock size={26} /></div>
            <h1 className="text-3xl font-[800] tracking-tighter">{isSignUp ? "Create an account" : "Customer portal"}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {isSignUp ? "Sign up to track your orders." : "Sign in to track your orders and manage your account."}
            </p>
          </div>

          {error && <div role="alert" className="mb-6 rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{error}</div>}
          {successMessage && <div role="status" className="mb-6 rounded-2xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">{successMessage}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <label className="relative block">
                <span className="sr-only">Full name</span>
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input type="text" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
              </label>
            )}
            <label className="relative block">
              <span className="sr-only">Email address</span>
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </label>
            <label className="relative block">
              <span className="sr-only">Password</span>
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </label>
            <button type="submit" disabled={isLoading} className="flex h-14 w-full items-center justify-center rounded-full bg-slate-900 text-base font-bold text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-60">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isSignUp ? "Sign up" : "Log in"}
            </button>
            <button type="button" disabled={isLoading} onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-sm font-semibold text-slate-500 transition hover:text-slate-900">
              {isSignUp ? "Already have an account? Log in" : "No account yet? Sign up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
