// In src/components/ThemeToggle.tsx

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button"; // Use your new shadcn button
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/supabaseClient";

type ThemePreference = "dark" | "light";
let pendingThemePreference: ThemePreference | null = null;

const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    let active = true;

    const syncUserTheme = async (user: { user_metadata?: Record<string, unknown> }) => {
      if (!active || !user) return;

      const savedTheme = user.user_metadata?.theme_preference;
      if (pendingThemePreference) {
        setTheme(pendingThemePreference);
        if (savedTheme === pendingThemePreference) {
          pendingThemePreference = null;
        }
        return;
      }

      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        return;
      }

      const browserTheme = themeRef.current === "dark" ? "dark" : "light";
      await supabase.auth.updateUser({
        data: { theme_preference: browserTheme },
      });
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) void syncUserTheme(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void syncUserTheme(session.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setTheme]);

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    pendingThemePreference = nextTheme;
    setTheme(nextTheme);

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        void supabase.auth.updateUser({
          data: { theme_preference: nextTheme },
        }).then(() => {
          if (pendingThemePreference === nextTheme) {
            pendingThemePreference = null;
          }
        });
      } else {
        pendingThemePreference = null;
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-300 h-10 w-10 lg:h-9 lg:w-9"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
