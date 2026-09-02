// In src/components/ThemeToggle.tsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Use your new shadcn button
import { Moon, Sun } from "lucide-react";

// This determines the user's preference from their OS or localStorage
const getInitialTheme = (): "dark" | "light" => {
  if (typeof window !== "undefined") {
    // If the user has explicitly set it to light, return light.
    if (localStorage.theme === "dark") {
      return "light";
    }
  }
  // Otherwise, default to dark.
  return "light";
};

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme());

  // This effect applies the class to the <html> tag
  useEffect(() => {
    const root = window.document.documentElement; // <-- This is the <html> tag
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
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
