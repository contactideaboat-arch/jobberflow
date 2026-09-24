import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const FLOW_STEPS = [
  { label: "Receive", to: "/transactions/rm-inward" },
  { label: "Issue", to: "/transactions/transfer" },
  { label: "Produce", to: "/transactions/product-inward" },
  { label: "Reconcile", to: "/reconciliation" },
] as const;

const FLOW_PATHS = new Map<string, number>([
  ["/transactions/rm-inward", 0],
  ["/transactions/transfer", 1],
  ["/transactions/product-inward", 2],
  ["/transactions/material-return", 3],
  ["/transactions/adjustment", 3],
  ["/reports", 3],
  ["/reconciliation", 3],
]);

export function WorkflowRail({ path }: { path: string }) {
  const currentStep = FLOW_PATHS.get(path);
  if (currentStep === undefined) return null;

  return (
    <nav
      aria-label="Production workflow"
      className="no-print mb-4 overflow-x-auto border bg-card px-3 py-2"
    >
      <ol className="mx-auto flex min-w-[34rem] max-w-3xl items-center">
        {FLOW_STEPS.map((step, index) => {
          const complete = index < currentStep;
          const current = index === currentStep;
          return (
            <li key={step.label} className="flex flex-1 items-center last:flex-none">
              <Link
                to={step.to}
                aria-current={current ? "step" : undefined}
                className="group flex items-center gap-2 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "num flex size-6 items-center justify-center border text-[10px] font-bold transition-colors",
                    current && "border-primary bg-primary text-primary-foreground",
                    complete && "border-success/35 bg-success/10 text-success",
                    !current && !complete && "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground",
                    current && "text-foreground",
                    complete && "text-success",
                  )}
                >
                  {step.label}
                </span>
              </Link>
              {index < FLOW_STEPS.length - 1 && (
                <span className="mx-3 h-px flex-1 bg-border" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
