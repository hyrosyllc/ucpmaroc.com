import React from "react";

interface PlatformLoaderProps {
  message?: string;
}

const PlatformLoader: React.FC<PlatformLoaderProps> = ({
  message = "Loading...",
}) => (
  <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  </div>
);

export default PlatformLoader;
