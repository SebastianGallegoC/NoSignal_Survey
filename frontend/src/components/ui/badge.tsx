import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:px-2.5 sm:py-1 sm:text-[11px]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        pending:
          "border-transparent bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
        destructiveSync:
          "border-transparent bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
        accent: "border-transparent bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-100",
        indigo:
          "border-transparent bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
