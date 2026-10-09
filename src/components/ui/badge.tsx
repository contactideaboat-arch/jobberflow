import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Badges state a condition in a word. Soft tint, matching ink, a fine rule.
 * Each pair reads at 4.5:1 or better. Badges are labels, not buttons, so
 * they have no hover state.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-px text-xs font-medium leading-4 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary-soft text-primary-soft-foreground",
        secondary: "border-border bg-subtle text-subtle-foreground",
        success: "border-success/25 bg-success-soft text-success",
        warning: "border-warning/60 bg-warning-soft text-warning-foreground",
        destructive: "border-destructive/25 bg-destructive-soft text-destructive",
        info: "border-info/25 bg-info-soft text-info",
        outline: "border-border-strong bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
