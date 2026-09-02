import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import {
  Menu,
  Home,
  Users,
  Package,
  Phone,
  Youtube,
  GalleryHorizontalEnd,
  BracesIcon,
  AudioLinesIcon,
  MegaphoneIcon,
  LogIn,
  UserCircle,
  UserCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";

// --- Local Components ---
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

// --- shadcn/ui Component Imports ---
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ----------------------------------------------------------------------
// 🚨 MOCK AUTH HOOK: Replace this with your actual Supabase Auth context
// Example: import { useAuth } from '@/context/AuthContext';
// ----------------------------------------------------------------------
const useAuth = () => {
  // Toggle these to test different states:
  return {
    user: null, // Set to { name: "Alex" } to test logged-in state
    role: null as "actor" | "client" | null, // 'actor' or 'client'
    isLoading: false,
    signOut: async () => console.log("Signed out"),
  };
};

// --- Data Arrays ---
const allMenuItems = [
  { icon: Home, label: "Home", to: "/", type: "link" },
  { icon: AudioLinesIcon, label: "Voice Over", to: "/voiceover", type: "link" },
 
  
  {
    icon: GalleryHorizontalEnd,
    label: "Gallery Room",
    to: "/portfolio",
    type: "link",
  },
  { icon: Phone, label: "Contact Us", to: "/contact", type: "link" },
];

const serviceDropdownItems = [
  { label: "Voice Over", to: "/voiceover" },
];

const desktopNavLinks = [
  { label: "Gallery", to: "/portfolio", type: "link" as const },
  { label: "Contact", to: "/contact", type: "link" as const },
];

// --- Helper Component for Dropdown Links ---
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-muted/50 hover:text-accent-foreground focus:bg-muted/50 focus:text-accent-foreground group",
            className
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{title}</div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground mt-2">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Bring in Auth State
  const { user, role, isLoading, signOut } = useAuth();

  // AAA+ Performance Scroll Listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll(); // Set initial state
    // Passive flag ensures scrolling remains buttery smooth
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      aria-label="Main Navigation"
      className={cn(
        "dark fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-in-out border-b",
        isScrolled
          ? "bg-zinc-950/80 backdrop-blur-xl border-white/10 shadow-sm py-2"
          : "bg-zinc-950 border-white/5 py-3"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center" aria-label="Go to homepage">
            <img
              src="https://pub-c6d2173b02a643659ef133753f7ee574.r2.dev/identity/ucp%20logo%20t%20b%20(7).png"
              alt="UCP Maroc Logo"
              className="h-6 md:h-7 lg:h-8 w-auto transition-transform duration-500 hover:scale-105"
            />
          </Link>

          {/* Desktop Menu Center */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link 
                    to="/" 
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white font-medium transition-colors")}
                  >
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white font-medium transition-colors data-[state=open]:bg-white/10 data-[state=open]:text-white">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="border-border/50 shadow-2xl rounded-2xl">
                    <ul className="grid w-[300px] p-3 gap-1">
                      {serviceDropdownItems.map((item) => (
                        <ListItem
                          key={item.label}
                          href={item.to}
                          title={item.label}
                        >
                          Explore our professional {item.label.toLowerCase()} solutions.
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {desktopNavLinks.map((item) => {
                  const LinkComponent = item.type === "hash" ? HashLink : Link;
                  return (
                    <NavigationMenuItem key={item.label}>
                      <LinkComponent
                        to={item.to}
                        className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white font-medium transition-colors")}
                      >
                        {item.label}
                      </LinkComponent>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Desktop Auth & Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher />

              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground ml-2" />
              ) : user ? (
                // --- LOGGED IN STATE (DESKTOP) ---
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-300 p-0 overflow-hidden"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={(user as any)?.avatar_url}
                          alt="Profile"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {(user as any)?.name?.charAt(0) || (
                            <UserCircle className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-2xl border-border/50 shadow-2xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {(user as any)?.name || "My Account"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {role || "User"} Portal
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={
                          role === "actor" ? "/dashboard" : "/client-dashboard"
                        }
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    {role === "client" && (
                      <DropdownMenuItem asChild>
                        <Link to="/my-shortlist" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>My Shortlist</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // --- LOGGED OUT STATE (DESKTOP) ---
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white font-medium transition-colors px-2.5">
                      <LogIn size={14} className="mr-1.5" />
                      My Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 rounded-2xl border-border/50 shadow-2xl p-2" align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/client-dashboard"
                        className="flex items-center gap-3 w-full cursor-pointer rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <UserCircle size={16} className="text-primary" />
                        <span className="font-medium">Client Portal</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 w-full cursor-pointer rounded-xl p-2.5 hover:bg-muted/50 transition-colors mt-1"
                      >
                        <UserCheck
                          size={16}
                          className="text-muted-foreground"
                        />
                        <span className="font-medium">Talent Portal</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <LanguageSwitcher />

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open mobile menu"
                    className="rounded-full bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-300 h-10 w-10"
                  >
                    <Menu size={18} />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-screen sm:w-screen sm:max-w-[100vw] border-none p-0 flex flex-col bg-background/95 backdrop-blur-3xl shadow-2xl text-foreground [&>button]:hidden"
                >
                  <SheetHeader className="px-8 pt-8 pb-4 text-left flex flex-row items-center justify-between space-y-0">
                    <SheetTitle className="text-xs font-bold tracking-widest uppercase text-muted-foreground m-0">
                      Navigation
                    </SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-transparent transition-all m-0">
                        <ArrowRight size={28} />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </SheetClose>
                  </SheetHeader>

                  <ScrollArea className="flex-1">
                    <div className="p-8">
                      <ul className="space-y-8">
                        {allMenuItems.map((item) => {
                          const IconComponent = item.icon;
                          const LinkComponent =
                            item.type === "hash" ? HashLink : Link;
                          return (
                            <li key={item.label}>
                                <LinkComponent
                                  to={item.to}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center gap-6 group"
                                >
                                  <IconComponent
                                    size={24}
                                    className="text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                                  />
                                  <span className="text-3xl font-semibold text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                                    {item.label}
                                  </span>
                                </LinkComponent>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </ScrollArea>

                  {/* Mobile Footer Auth Section */}
                  <div className="p-8 mt-auto pb-12">
                    {isLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin text-primary" />
                      </div>
                    ) : user ? (
                      // --- LOGGED IN MOBILE ---
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                          <Avatar className="h-12 w-12 border border-border/50">
                            <AvatarImage src={(user as any)?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {(user as any)?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-foreground leading-none">
                              {(user as any)?.name}
                            </span>
                            <span className="text-sm text-muted-foreground capitalize mt-1.5">
                              {role} Portal
                            </span>
                          </div>
                        </div>

                        <Button
                          asChild
                          className="w-full h-14 text-base font-bold rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                        >
                          <Link
                            to={
                              role === "actor"
                                ? "/dashboard"
                                : "/client-dashboard"
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <LayoutDashboard size={20} className="mr-2" />
                            Go to Dashboard
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-14 text-base font-bold rounded-full text-muted-foreground border-border hover:text-foreground hover:bg-foreground/5 transition-colors"
                          onClick={handleSignOut}
                        >
                          <LogOut size={20} className="mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      // --- LOGGED OUT MOBILE ---
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                          Access Portals
                        </h4>
                        <Button
                          asChild
                          className="w-full h-14 text-base font-bold rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                        >
                          <Link
                            to="/client-auth"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <UserCircle size={20} className="mr-2" />
                            Client Login
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full h-14 text-base font-bold rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors bg-transparent"
                        >
                          <Link
                            to="/actor-login"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <UserCheck size={20} className="mr-2" />
                            Talent Login
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
