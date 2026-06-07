// src/lib/ucp-sdk/ui.d.ts

declare module '@/components/ui/button' {
  import * as React from 'react';

  /**
   * Properties for the Button component.
   */
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** The visually prominent variant of the button. */
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    /** The size of the button. */
    size?: 'default' | 'sm' | 'lg' | 'icon';
    /** Whether to show a loading state on the button. */
    isLoading?: boolean;
    /** The left icon for the button. */
    icon?: React.ReactNode;
    /** Supports rendering the button as a child component via @radix-ui/react-slot. */
    asChild?: boolean;
  }

  /**
   * A standard, customizable button component.
   */
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/card' {
  import * as React from 'react';

  export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
  export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

// Add more UI component type definitions here as needed (e.g., input, label, badge)