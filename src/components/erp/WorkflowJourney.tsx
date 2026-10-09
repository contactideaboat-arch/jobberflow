import { Link } from "@tanstack/react-router";
import { IconArrowRight } from "@/components/icons";
import { FLOW_EXTRAS, FLOW_STAGES, type NavItem } from "@/components/erp/navigation";
import { cn } from "@/lib/utils";

/**
 * The dashboard production path.
 *
 * Stages and the non-sequential vouchers both come from the sidebar's daily
 * flow group, so every voucher in the sidebar is reachable here and a new
 * voucher shows up in both places without a second edit.
 */
function StageTile({ item, index, last }: { item: NavItem; index: number; last: boolean }) {
  const Icon = item.icon;
  const flow = item.flow;

  return (
    <li className="group relative bg-card">
      <Link
        to={item.to}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex min-h-32 items-start gap-3 p-4 transition-colors duration-200 group-hover:bg-muted/60 lg:p-5">
          <span className="journey-icon flex size-10 shrink-0 items-center justify-center border bg-background text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
              <span className="num text-[10px] font-bold tracking-widest text-muted-foreground">
                STEP {index + 1}
              </span>
              <IconArrowRight
                className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </span>
            <span className="mt-2 block text-sm font-bold text-foreground">{flow?.title}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {flow?.description}
            </span>
          </span>
        </div>
        {!last && (
          <IconArrowRight
            className="absolute -right-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-card p-1 text-muted-foreground xl:block"
            aria-hidden="true"
          />
        )}
      </Link>
    </li>
  );
}

export function WorkflowJourney() {
  return (
    <section
      aria-labelledby="workflow-journey-title"
      className="journey-panel mb-6 overflow-hidden"
    >
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
            Daily flow
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

      <ol className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
        {FLOW_STAGES.map((item, index) => (
          <StageTile
            key={item.to}
            item={item}
            index={index}
            last={index === FLOW_STAGES.length - 1}
          />
        ))}
      </ol>

      {FLOW_EXTRAS.length > 0 && (
        <div className="border-t bg-muted/40 px-4 py-3 lg:px-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
            Also in the daily flow
          </p>
          <ul className="flex flex-wrap gap-2">
            {FLOW_EXTRAS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "group flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-[13px] font-medium",
                      "transition-[border-color,background-color,transform] duration-200",
                      "hover:-translate-y-px hover:border-primary/40",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <Icon
                      className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    />
                    {item.label}
                    <IconArrowRight
                      className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
