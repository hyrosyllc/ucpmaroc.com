import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Outlet,
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  User,
  Music,
  AudioLines,
  Settings,
  LogOut,
  MessageSquare,
  Menu,
  DollarSign,
  ChevronRight,
  LayoutTemplate,
  BarChart3,
  Briefcase,
  Package,
  Mail,
  ShoppingBag,
  Layers,
  CreditCard,
  Truck,
  Tag,
  FileText,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  Coins,
  Plus,
  ArrowRightLeft,
  Sparkles,
  Palette,
  LayoutDashboard,
  ShoppingCart,
  Globe,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionProvider } from "../context/SubscriptionContext";
import ThemeToggle from "../components/ThemeToggle";
import TopUpModal from "@/components/dashboard/TopUpModal"; // 🚀 IMPORT TOPUP MODAL

export interface ActorDashboardContextType {
  actorData: Partial<Actor>;
  role: string;
}

// --- 1. Interface ---
interface Actor {
  id: string;
  ActorName: string;
  HeadshotURL?: string;
  is_p2p_enabled?: boolean;
  wallet_balance?: number;
  country?: string;
  marketplace_status?: string;
  email?: string;
}

// --- NAVIGATION STRUCTURE ---
const NAV_GROUPS = [
  {
    label: "Portfolio & Shop",
    items: [
      {
        to: "/dashboard/portfolio",
        name: "Website Editor",
        icon: LayoutTemplate,
        description: "Edit your site",
      },
      {
        to: "/dashboard",
        name: "Overview",
        icon: BarChart3,
        description: "Traffic & Shop Stats",
      },
      {
        to: "/dashboard/products",
        name: "Products",
        icon: ShoppingBag,
        description: "Manage inventory",
      },
      {
        to: "/dashboard/orders",
        name: "Direct Orders",
        icon: Package,
        description: "Manage sales",
      },
      {
        to: "/dashboard/leads",
        name: "Leads & Inbox",
        icon: Mail,
        description: "Contact submissions",
      },
    ],
  },
  {
        label: "e-Commerce Manager",
        isAccordion: true,
        icon: ShoppingCart,
        items: [
          {
            to: "/dashboard/payments",
            name: "Payments & Integrations",
            icon: CreditCard,
            description: "Stripe & Payouts",
          },
          {
            to: "/dashboard/markets",
            name: "Markets & Regions",
            icon: Globe,
            description: "Where you sell",
          },
          {
            to: "/dashboard/shipping",
            name: "Shipping Rates",
            icon: Truck,
            description: "Manage shipping rules",
          },
          {
            to: "/dashboard/coupons",
            name: "Coupons",
            icon: Tag,
            description: "Discounts & Promos",
          },
          {
            to: "/dashboard/forms",
            name: "Forms & Checkout",
            icon: FileText,
            description: "Checkout fields",
          },
        ],
      },
      {
    label: "Account & Settings",
    items: [
      {
        to: "/dashboard/settings",
        name: "Settings & Sites",
        icon: Settings,
        description: "Manage domains & profile",
      },
      {
        to: "/dashboard/profile",
        name: "My Profile",
        icon: User,
        description: "Manage personal details",
      },
      {
        to: "/dashboard/creator-hub",
        name: "All Themes",
        icon: LayoutDashboard,
        description: "Manage Themes",
      },
      {
        to: "/dashboard/studio",
        name: "Theme Editor",
        icon: Palette,
        description: "Build Themes & Earn",
      },
    ],
  },
  {
    label: "UCP Agency (Marketplace)",
    marketplaceOnly: true, // 🚀 NEW FLAG FOR GATING
    items: [
      {
        to: "/dashboard/job-orders",
        name: "Job Orders",
        icon: Briefcase,
        description: "Active jobs",
      },
      {
        to: "/dashboard/messages",
        name: "Inbox",
        icon: MessageSquare,
        description: "Client messages",
      },
      {
        to: "/dashboard/services",
        name: "Services",
        icon: Settings,
        description: "Manage rates",
      },
      {
        to: "/dashboard/demos",
        name: "Demos",
        icon: Music,
        description: "Your audio/video",
      },
      {
        to: "/dashboard/library",
        name: "Library",
        icon: AudioLines,
        description: "Delivered files",
      },
      {
        to: "/dashboard/earnings",
        name: "Earnings",
        icon: DollarSign,
        description: "Payouts & History",
      },
    ],
  },
];

const mobilePrimaryItems = [
  { to: "/dashboard", name: "Stats", icon: BarChart3 },
  { to: "/dashboard/portfolio", name: "Editor", icon: LayoutTemplate },
  { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare },
];

const ActorDashboardLayout = () => {
  const [actorData, setActorData] = useState<Partial<Actor>>({});
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false); // 🚀 TOPUP MODAL STATE
  const [isEcommerceOpen, setIsEcommerceOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesPage = location.pathname.includes("/dashboard/messages");
  const isShopActive =
    location.pathname.includes("/products") ||
    location.pathname.includes("/collections");

  const [tourStep, setTourStep] = useState(0);
  useEffect(() => {
    const handleTour = (e: any) => setTourStep(e.detail);
    window.addEventListener("TOUR_STEP_CHANGED", handleTour);
    return () => window.removeEventListener("TOUR_STEP_CHANGED", handleTour);
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/dashboard/portfolio") || location.pathname.includes("/dashboard/studio")) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      location.pathname.includes("/dashboard/payments") ||
      location.pathname.includes("/dashboard/shipping") ||
      location.pathname.includes("/dashboard/coupons") ||
      location.pathname.includes("/dashboard/forms")
    ) {
      setIsEcommerceOpen(true);
    }
  }, [location.pathname]);

  const fetchActorData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/actor-login");
      return;
    }

    const { data: actorProfile, error: actorError } = await supabase
      .from("actors")
      .select(
        "id, ActorName, HeadshotURL, is_p2p_enabled, wallet_balance, country, marketplace_status"
      )
      .eq("user_id", user.id)
      .single();

    if (actorError || !actorProfile) {
      navigate("/create-profile", { state: { roleToCreate: "actor" } });
      return;
    }

    setActorData({ ...actorProfile, email: user.email });
    setLoading(false);

    // 🚀 REALTIME LISTENER FOR TOPBAR WALLET BALANCE
    const channel = supabase
      .channel("topbar_wallet")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "actors",
          filter: `id=eq.${actorProfile.id}`,
        },
        (payload) => {
          setActorData((prev) => ({
            ...prev,
            wallet_balance: payload.new.wallet_balance,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    fetchActorData();
  }, [fetchActorData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/actor-login");
  };

  const handleSwitchToClient = () => {
    navigate("/client-dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  const isMoroccan = actorData.country === "Morocco";
  const isApprovedMarketplace = actorData.marketplace_status === "approved";

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-foreground flex flex-col antialiased">
      <SubscriptionProvider actorId={actorData.id}>
        {/* --- GLOBAL TOP-UP MODAL --- */}
        <TopUpModal
          isOpen={isTopUpOpen}
          onOpenChange={setIsTopUpOpen}
          actorData={actorData}
          profile={actorData}
          onSuccess={fetchActorData}
          notify={(type, title, msg) => console.log(type, title, msg)} // Ideally pass your real notify function here if available globally
        />

              {/* --- TOPBAR --- */}
      <header className="flex h-14 border-b border-border/40 bg-background/95 backdrop-blur fixed top-0 w-full z-50 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (

                <PanelLeftClose size={18} />
              )}
            </Button>
            <div className="font-bold tracking-tight text-sm flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs">
                PRO
              </span>
              Workspace
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🚀 THE WALLET WIDGET */}
            <div className={cn("flex items-center bg-amber-500/10 border border-amber-500/20 rounded-full pr-1 pl-3 h-9 mr-2 transition-all", tourStep === 2 && "relative z-[10001] ring-4 ring-amber-500/50 bg-background shadow-2xl scale-105 pointer-events-auto")}>
              <Coins size={14} className="text-amber-500 mr-2" />
              <span className="font-black text-sm text-amber-600 dark:text-amber-400 mr-3">
                {actorData.wallet_balance?.toLocaleString() || 0}
              </span>
              <Button
                size="icon"
                className={cn("h-7 w-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all", tourStep === 2 && "animate-pulse")}
                onClick={() => {
                  setIsTopUpOpen(true);
                  if (tourStep === 2) {
                    window.dispatchEvent(new CustomEvent("TOUR_STEP_CHANGED", { detail: 3 }));
                  }
                }}
              >
                <Plus size={14} />
              </Button>
            </div>

            <div className={cn("flex items-center gap-2 transition-opacity duration-300", tourStep === 2 && "opacity-20 pointer-events-none")}>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              >
                <Search size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              >
                <Bell size={18} />
              </Button>
              <ThemeToggle />

              <div className="h-6 w-px bg-border mx-2" />

              {/* 🚀 THE PROFILE SWITCHER DROPDOWN */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 ml-2 cursor-pointer group outline-none">
                    <span className="text-sm font-semibold text-foreground hidden lg:block group-hover:text-primary transition-colors">
                      {actorData.ActorName}
                    </span>
                    <Avatar className="h-8 w-8 border border-border group-hover:opacity-80 transition-opacity ring-2 ring-transparent group-hover:ring-primary/20">
                      <AvatarImage
                        src={actorData.HeadshotURL}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {actorData.ActorName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{actorData.ActorName}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {actorData.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSwitchToClient}
                    className="cursor-pointer py-2 text-sm font-medium"
                  >
                    <ArrowRightLeft
                      size={16}
                      className="mr-2 text-muted-foreground"
                    />
                    Switch to Client Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                    className="cursor-pointer py-2 text-sm font-medium"
                  >
                    <User size={16} className="mr-2 text-muted-foreground" />{" "}
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 py-2 font-bold"
                  >
                    <LogOut size={16} className="mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* 2. THE APP BODY (Sidebar + Main Content)     */}
        {/* ========================================== */}
        <div className="flex flex-1 pt-14">
          <aside
            className={cn(
              "hidden md:flex flex-col fixed left-0 h-[calc(100vh-3.5rem)] border-r border-border/40 bg-background/80 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[72px]" : "w-[260px]"
            )}
          >
            <nav className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar overflow-x-hidden">
              {NAV_GROUPS.map((group, idx) => {
                // 🚀 MARKETPLACE GATING LOGIC
                if (group.marketplaceOnly && !isApprovedMarketplace)
                  return null;

                if (group.isAccordion) {
                  return (
                    <div key={idx} className="space-y-1 mb-2">
                      <div className="px-3">
                        <button
                          onClick={() => setIsEcommerceOpen(!isEcommerceOpen)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-foreground",
                            isCollapsed && "justify-center"
                          )}
                          title={isCollapsed ? group.label : undefined}
                        >
                          <div className="flex items-center gap-3">
                            {group.icon && <group.icon className={cn("shrink-0 transition-colors text-primary", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />}
                            {!isCollapsed && <span>{group.label}</span>}
                          </div>
                          {!isCollapsed && (
                            <ChevronDown
                              size={14}
                              className={cn(
                                "transition-transform duration-200 text-muted-foreground",
                                isEcommerceOpen && "rotate-180 text-primary"
                              )}
                            />
                          )}
                        </button>
          
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300",
                            isEcommerceOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                          )}
                        >
                          <div className={cn("flex flex-col space-y-1", !isCollapsed && "pl-3 border-l-2 border-border/40 ml-4 mt-1 mb-2")}>
                            {group.items.map((item) => (
                              <NavLink
                                key={item.name}
                                to={item.to}
                                end={["/dashboard", "/dashboard/settings", "/dashboard/payments"].includes(item.to)}
                                className={({ isActive }) =>
                                  cn(
                                    "group flex items-center rounded-lg transition-all duration-200 outline-none select-none relative gap-3 py-2 w-full",
                                    !isCollapsed && "px-3",
                                    isCollapsed && "justify-center h-10 w-10 mx-auto",
                                    isActive
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                  )
                                }
                                title={isCollapsed ? item.name : undefined}
                              >
                                <item.icon className={cn("shrink-0 transition-colors", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                                {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="space-y-1">
                    <h3
                      className={cn(
                        "px-4 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 transition-opacity duration-200",
                        isCollapsed && "opacity-0 h-0 overflow-hidden mb-0"
                      )}
                    >
                      {group.label}
                    </h3>
                    <div className="space-y-1 px-3">
                      {group.items.map((item) => {
                        const isProductTab = item.to === "/dashboard/products";
                        const isActiveOverride = isProductTab && isShopActive;

                        return (
                          <div key={item.name}>
                            <NavLink
                              to={item.to}
                              end={[
                                "/dashboard",
                                "/dashboard/settings",
                                "/dashboard/payments",
                              ].includes(item.to)}
                              title={isCollapsed ? item.name : undefined}
                              className={({ isActive }) =>
                                cn(
                                  "group flex items-center rounded-lg transition-all duration-200 outline-none select-none relative",
                                  isCollapsed
                                    ? "justify-center h-10 w-10 mx-auto"
                                    : "gap-3 px-3 py-2 w-full",
                                  isActive || isActiveOverride
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )
                              }
                            >
                              <item.icon
                                className={cn(
                                  "shrink-0 transition-colors",
                                  isCollapsed ? "h-5 w-5" : "h-4 w-4"
                                )}
                              />
                              {!isCollapsed && (
                                <>
                                  <span className="text-sm font-medium truncate">
                                    {item.name}
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    className={cn(
                                      "ml-auto transition-all",
                                      isActiveOverride ||
                                        location.pathname === item.to
                                        ? "opacity-100"
                                        : "opacity-0",
                                      isShopActive &&
                                        isProductTab &&
                                        "rotate-90"
                                    )}
                                  />
                                </>
                              )}
                            </NavLink>
                            {/* DYNAMIC SUBMENU */}
                            {!isCollapsed && isProductTab && isShopActive && (
                              <div className="ml-9 mt-1 mb-2 flex flex-col space-y-1 border-l-2 border-border/50 pl-3 animate-in slide-in-from-top-2 duration-200">
                                <NavLink
                                  to="/dashboard/products"
                                  end
                                  className={({ isActive }) =>
                                    cn(
                                      "text-sm py-1.5 px-2 rounded-md transition-colors",
                                      isActive
                                        ? "text-foreground font-semibold bg-muted/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                    )
                                  }
                                >
                                  All Products
                                </NavLink>
                                <NavLink
                                  to="/dashboard/collections"
                                  className={({ isActive }) =>
                                    cn(
                                      "text-sm py-1.5 px-2 rounded-md transition-colors flex items-center",
                                      isActive
                                        ? "text-foreground font-semibold bg-muted/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                    )
                                  }
                                >
                                  <Layers className="w-3.5 h-3.5 mr-2 opacity-70" />{" "}
                                  Collections
                                </NavLink>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* 🚀 AGENCY APPLICATION UPSELL (Visible only to unapproved Moroccans) */}
              {isMoroccan && !isApprovedMarketplace && !isCollapsed && (
                <div className="px-4">
                  <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-background p-4 mt-6 group animate-in fade-in">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
                      <Sparkles size={48} />
                    </div>
                    <div className="flex items-center gap-2 mb-1 text-amber-600 dark:text-amber-500">
                      <Briefcase size={14} />
                      <h4 className="font-bold text-xs tracking-wide uppercase">
                        Join Agency
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3 font-medium leading-relaxed">
                      You're in Morocco! Apply to the UCP Marketplace to get
                      hired directly.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/dashboard/profile")}
                      className="w-full h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              )}
            </nav>
          </aside>

          {/* ========================================== */}
          {/* 3. THE MAIN CONTENT AREA                     */}
          {/* ========================================== */}
          <main
            className={cn(
              "flex-1 min-h-[calc(100vh-3.5rem)] flex flex-col transition-all duration-300 ease-in-out bg-zinc-50/50 dark:bg-black",
              isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]",
              isMessagesPage ? "pb-[88px] md:pb-0" : "pb-[96px] md:pb-8"
            )}
          >
            <Outlet context={{ actorData, role: "actor" }} />
          </main>
        </div>

        {/* --- MOBILE BOTTOM NAV --- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          <div className="bg-background/80 backdrop-blur-xl border-t border-border/60 pb-safe pt-1">
            <div className="flex justify-around items-center h-16 px-1">
              {mobilePrimaryItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group flex flex-col items-center justify-center w-full h-full space-y-1 relative active:scale-90 transition-transform duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute -top-1 w-8 h-1 rounded-b-full bg-primary shadow-[0_0_10px_rgba(0,0,0,0.2)] shadow-primary/50" />
                      )}
                      <div
                        className={cn(
                          "p-1.5 rounded-xl transition-colors",
                          isActive ? "bg-primary/10" : "group-hover:bg-muted"
                        )}
                      >
                        <item.icon
                          className={cn("h-5 w-5", isActive && "fill-current")}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </div>
                      <span className="text-[10px] font-semibold tracking-tight">
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}

              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground active:scale-90 transition-transform">
                    <div className="p-1.5 rounded-xl hover:bg-muted">
                      <Menu className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-tight">
                      Menu
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:w-[400px] border-l border-border/40 p-0 flex flex-col bg-background/95 backdrop-blur-2xl"
                >
                  <SheetHeader className="px-6 pt-8 pb-4 text-left border-b border-border/40 flex flex-row items-center justify-between">
                    <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
                    <ThemeToggle />
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    <div className="flex items-center gap-4 px-2">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage
                          src={actorData.HeadshotURL}
                          className="object-cover"
                        />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg">
                          {actorData.ActorName}
                        </p>
                        <p
                          className="text-xs text-muted-foreground cursor-pointer hover:underline"
                          onClick={handleSwitchToClient}
                        >
                          Switch to Client Mode
                        </p>
                      </div>
                    </div>
                    {NAV_GROUPS.map((group, idx) => {
                      if (group.marketplaceOnly && !isApprovedMarketplace)
                        return null;
                      return (
                        <div key={idx}>
                          <h4 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            {group.label}
                          </h4>
                          <div className="grid gap-1">
                            {group.items.map((item) => (
                              <SheetClose
                                key={item.name}
                                onClick={() => navigate(item.to)}
                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 active:bg-muted transition-all w-full text-left"
                              >
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <item.icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-base truncate">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {item.description || "View section"}
                                    </div>
                                  </div>
                                  <ChevronRight
                                    size={16}
                                    className="text-muted-foreground/50 shrink-0"
                                  />
                              </SheetClose>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-6 border-t border-border/40 bg-muted/20">
                    <SheetClose asChild>
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleLogout}
                        className="w-full font-bold shadow-lg shadow-destructive/20"
                      >
                        Log Out
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </SubscriptionProvider>
    </div>
  );
};

export default ActorDashboardLayout;
