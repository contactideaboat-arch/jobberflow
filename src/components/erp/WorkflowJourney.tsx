import { Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, ClipboardCheck, Factory, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    title: "Receive",
    description: "Bring material into warehouse stock",
    to: "/transactions/rm-inward",
    icon: Boxes,
  },
  {
    number: "02",
    title: "Issue",
    description: "Send material to a jobber",
    to: "/transactions/transfer",
    icon: Factory,
  },
  {
    number: "03",
    title: "Receive output",
    description: "Post production, BOM use, and wastage",
    to: "/transactions/product-inward",
    icon: PackageCheck,
  },
  {
    number: "04",
    title: "Reconcile",
    description: "Review balances, returns, and variances",
    to: "/reconciliation",
    icon: ClipboardCheck,
  },
] as const;

export function WorkflowJourney() {
  return (
    <section
      aria-labelledby="workflow-journey-title"
      className="journey-panel mb-6 overflow-hidden"
    >
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
            Production path
          </p>
          <h2 id="workflow-journey-title" className="mt-1 text-lg font-bold text-foreground">
            Follow the material from entry to accountability
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Each stage updates the next. Open the current voucher or move forward without losing your
          place in the flow.
        </p>
      </div>

      <ol className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.number} className="group relative bg-card">
              <Link
                to={step.to}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <div className="flex min-h-32 items-start gap-3 p-4 transition-colors duration-200 group-hover:bg-muted/60 lg:p-5">
                  <span className="journey-icon flex size-10 shrink-0 items-center justify-center border bg-background text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="num text-[10px] font-bold tracking-widest text-muted-foreground">
                        STEP {step.number}
                      </span>
                      <ArrowRight
                        className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-2 block text-sm font-bold text-foreground">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight
                    className={cn(
                      "absolute -right-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-card p-1 text-muted-foreground xl:block",
                    )}
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
