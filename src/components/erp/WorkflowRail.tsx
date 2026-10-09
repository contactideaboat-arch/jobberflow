import { Link } from "@tanstack/react-router";
import { FLOW_STAGES, FLOW_TERMINUS } from "@/components/erp/navigation";
import { cn } from "@/lib/utils";

/*
 * Rail steps come from the shared daily flow so the labels and destinations
 * cannot drift from the sidebar. Material return is a flow step here because
 * unused material coming back is the last movement of the day, even though the
 * dashboard treats it as an off-path action rather than a numbered stage.
 */
const RETURN_STEP = { label: "Return", to: "/transactions/material-return" } as const;

const RAIL_STEPS = [
  ...FLOW_STAGES.map((item) => ({ label: item.flow!.short, to: item.to })),
  RETURN_STEP,
  FLOW_TERMINUS,
];

/*
 * Adjustment is not its own stage, a correction belongs to the wrap-up phase
 * alongside returns, which is where the operator lands after a physical count.
 */
const STEP_INDEX = new Map<string, number>([
  ...FLOW_STAGES.map((item, index) => [item.to, index] as const),
  [RETURN_STEP.to, FLOW_STAGES.length],
  [FLOW_TERMINUS.to, FLOW_STAGES.length + 1],
]);

const PHASE_ROUTES = [
  ["/transactions/adjustment", FLOW_STAGES.length],
  ["/reports", FLOW_STAGES.length + 1],
] as const;

function currentStepFor(path: string) {
  const direct = STEP_INDEX.get(path);
  if (direct !== undefined) return direct;
  return PHASE_ROUTES.find(([route]) => route === path)?.[1];
}

export function WorkflowRail({ path }: { path: string }) {
  const currentStep = currentStepFor(path);
  if (currentStep === undefined) return null;

  return (
    <nav
      aria-label="Production workflow"
      className="no-print mb-4 overflow-x-auto border bg-card px-3 py-2"
    >
      <ol className="mx-auto flex min-w-[38rem] max-w-3xl items-center">
        {RAIL_STEPS.map((step, index) => {
          const complete = index < currentStep;
          const current = index === currentStep;
          return (
            <li key={step.to} className="flex flex-1 items-center last:flex-none">
              <Link
                to={step.to}
                aria-current={current ? "step" : undefined}
                // The circle stays 24px; the target grows around it on touch.
                className="group flex items-center gap-2 py-1 focus-visible:outline-none pointer-coarse:min-h-11"
              >
                <span
                  className={cn(
                    "num flex size-6 items-center justify-center border text-[0.6875rem] font-bold transition-colors",
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
              {index < RAIL_STEPS.length - 1 && (
                <span className="mx-3 h-px flex-1 bg-border" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
