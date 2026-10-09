import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  IconAlert,
  IconCheck,
  IconChevrons,
  IconDownload,
  IconFileSpreadsheet,
  IconPrint,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { downloadCsv, downloadExcel, printElement } from "@/lib/erp";
import { Kpi, KpiBand, KpiLink, type KpiColumnCount, type KpiPath } from "@/components/erp/Kpi";

/**
 * A row of KPI figures.
 *
 * Kept from the old `KpiCard` call shape so existing screens keep working,
 * but it now draws the hairline band rather than a grid of cards. `to` is
 * optional per figure: pass it when there is a screen behind the number and
 * the figure becomes the link into it.
 */
export function KpiCards({
  items,
  label = "Key figures",
  columns = 5,
  className,
}: {
  items: {
    label: string;
    value: string;
    unit?: string;
    hint?: string;
    tone?: "default" | "loss";
    to?: KpiPath;
  }[];
  label?: string;
  columns?: KpiColumnCount;
  className?: string;
}) {
  return (
    <KpiBand columns={columns} label={label} className={className}>
      {items.map((item) =>
        item.to ? (
          <KpiLink
            key={item.label}
            to={item.to}
            label={item.label}
            value={item.value}
            unit={item.unit}
            tone={item.tone}
            note={item.hint}
          />
        ) : (
          <Kpi
            key={item.label}
            label={item.label}
            value={item.value}
            unit={item.unit}
            tone={item.tone}
            note={item.hint}
          />
        ),
      )}
    </KpiBand>
  );
}

/**
 * Sentence-case a legacy Title Case label ("Jobber Code" → "Jobber code")
 * while keeping acronyms and codes ("GST Number" → "GST number").
 */
export function sentenceCase(label: string) {
  return label
    .split(" ")
    .map((word, index) =>
      index === 0 || /^[A-Z0-9./%&()-]{2,}$/.test(word) ? word : word.toLowerCase(),
    )
    .join(" ");
}

/**
 * A titled surface for a table or a group of fields. Flat: a 1px rule and a
 * white ground. The title names what is inside; actions sit on its right.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      {title && (
        <header className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-4 py-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{sentenceCase(title)}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * The line that states what a table is actually showing.
 *
 * A report that does not say its own scope cannot be trusted: the same screen
 * reads completely differently for "March only, one jobber" and "everything,
 * all jobbers", and an operator checking a number against the books needs to
 * know which one they are looking at before they act on it. Exports are built
 * from the same rows, so the line describes the file as well as the screen.
 *
 * It is a live region because filters change what the report means, not just
 * what it contains.
 */
export function ScopeNote({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b bg-subtle px-4 py-2">
      <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Showing</span> {children}
      </p>
      {action}
    </div>
  );
}

export type Option = { value: string; label: string; hint?: string };

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  busy,
  className,
  id,
  invalid,
  ...aria
}: {
  options: Option[];
  value?: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  /** Marks this control as the one currently writing, for screen readers. */
  busy?: boolean | undefined;
  className?: string | undefined;
  id?: string | undefined;
  invalid?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  "aria-label"?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-busy={busy || undefined}
          disabled={disabled}
          {...aria}
          className={cn(
            "h-control w-full justify-between border-input font-normal hover:border-muted-foreground hover:bg-card aria-invalid:border-destructive",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <IconChevrons className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-64 p-0"
        align="start"
        // Names the popup for screen readers. The visible placeholder is not a
        // substitute: a combobox listbox that announces only "Search…" tells
        // the user nothing about what is being chosen.
        aria-label={`${aria["aria-label"] ?? placeholder} options`}
      >
        <Command>
          <CommandInput placeholder="Search…" aria-label="Filter options" />
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ""}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <IconCheck
                    className={cn("size-3.5", value === o.value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{o.label}</span>
                  {o.hint && (
                    <span className="num ml-auto text-xs text-muted-foreground">{o.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A labelled form field.
 *
 * Wires the label to its control (`htmlFor` / `id`), links the hint and the
 * error through `aria-describedby`, and marks the control `aria-invalid` when
 * there is an error, so every field is announced correctly without each call
 * site remembering to. A trailing " *" in a legacy label is read as
 * `required`. Kinds:
 *   required    "Required" marker after the label
 *   optional    "Optional" marker
 *   calculated  "Calculated" marker; pair with <ReadOnlyValue>
 */
export function Field({
  label,
  children,
  hint,
  error,
  required,
  optional,
  calculated,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode | undefined;
  error?: string | null | undefined;
  required?: boolean;
  optional?: boolean;
  calculated?: boolean;
  className?: string | undefined;
}) {
  const id = useId();
  const legacyRequired = label.endsWith(" *");
  const text = sentenceCase(legacyRequired ? label.slice(0, -2) : label);
  const isRequired = required || legacyRequired;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  // A caller may bring its own id. Whichever id the control actually receives
  // is the one the label must point at, otherwise `htmlFor` names an element
  // that does not exist and the label is announced as nothing.
  const controlId = isValidElement(children) ? ((children.props as { id?: string }).id ?? id) : id;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: controlId,
        "aria-describedby": describedBy,
        ...(error ? { "aria-invalid": true } : {}),
        ...(isRequired ? { "aria-required": true } : {}),
      })
    : children;
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label htmlFor={controlId} className="flex items-baseline gap-1.5 text-[0.8125rem]">
        {text}
        {isRequired && <span className="text-xs font-normal text-muted-foreground">Required</span>}
        {optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
        {calculated && (
          <span className="text-xs font-normal text-muted-foreground">Calculated</span>
        )}
      </Label>
      {control}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-xs font-medium text-destructive">
          <IconAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * A value the user cannot edit: calculated by the system or copied from
 * another record. Drawn on the subtle ground with no input border, so it can
 * never be mistaken for a field.
 */
export function ReadOnlyValue({
  children,
  id,
  align = "left",
  className,
  ...aria
}: {
  children: ReactNode;
  id?: string;
  align?: "left" | "right";
  className?: string;
  "aria-describedby"?: string;
}) {
  return (
    <output
      id={id}
      {...aria}
      className={cn(
        "flex h-control w-full items-center rounded-md bg-subtle px-3 text-sm text-foreground",
        align === "right" && "num justify-end",
        className,
      )}
    >
      {children}
    </output>
  );
}

/** A titled group of fields inside a form. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0 space-y-3", className)}>
      <legend className="mb-1 text-sm font-semibold text-foreground">
        {title}
        {description && (
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            {description}
          </span>
        )}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Decimal input for quantities. Numeric keypad on phones, right-aligned
 * tabular figures, and the wheel never changes the value by accident.
 */
export function NumInput({
  value,
  onChange,
  step = "0.001",
  className,
  disabled,
  id,
  invalid,
  ...aria
}: {
  value: number | string;
  onChange: (n: number) => void;
  step?: string;
  className?: string | undefined;
  disabled?: boolean;
  id?: string | undefined;
  invalid?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  "aria-required"?: boolean | undefined;
}) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      min="0"
      step={step}
      disabled={disabled}
      aria-invalid={invalid || aria["aria-invalid"] || undefined}
      {...aria}
      className={cn("num text-right", className)}
      value={value}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  );
}

/**
 * Export the rows the screen is showing. Disabled, with a reason, when there
 * is nothing to export, so it is never a dead control.
 */
export function ExportBar({
  rows,
  filename,
  printId,
  title,
}: {
  rows: Record<string, unknown>[];
  filename: string;
  printId?: string;
  title?: string;
}) {
  const empty = rows.length === 0;
  const reason = empty ? "Nothing to export for the current filters" : undefined;
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={empty}
        title={reason}
        onClick={() => downloadCsv(filename, rows)}
      >
        <IconDownload className="size-3.5" /> CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={empty}
        title={reason}
        onClick={() => downloadExcel(filename, rows)}
      >
        <IconFileSpreadsheet className="size-3.5" /> Excel
      </Button>
      {printId && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => printElement(printId, title ?? filename)}
        >
          <IconPrint className="size-3.5" /> Print or PDF
        </Button>
      )}
    </div>
  );
}

/**
 * Ask before a consequential action. Returns an element to render and an
 * `ask` function that resolves true only when the user confirms.
 *
 *   const [confirmDialog, ask] = useConfirm();
 *   if (await ask({ title, body, confirm: "Post voucher" })) post();
 */
export function useConfirm() {
  const [request, setRequest] = useState<{
    title: string;
    body: ReactNode;
    confirm: string;
    cancel?: string;
    tone?: "default" | "destructive";
    resolve: (ok: boolean) => void;
  } | null>(null);

  const ask = (options: {
    title: string;
    body: ReactNode;
    confirm: string;
    cancel?: string;
    tone?: "default" | "destructive";
  }) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve }));

  const close = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };

  const element = (
    <AlertDialog open={!!request} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">{request?.body}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {request?.cancel ?? "Go back"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              request?.tone === "destructive" && buttonVariants({ variant: "destructive" }),
            )}
            onClick={() => close(true)}
          >
            {request?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return [element, ask] as const;
}

/**
 * Close a form dialog, asking first when it holds unsaved input.
 * Use as the dialog's `onOpenChange`.
 */
export function useGuardedClose(dirty: boolean, setOpen: (open: boolean) => void) {
  const [confirmDialog, ask] = useConfirm();
  const onOpenChange = async (open: boolean) => {
    if (open || !dirty) return setOpen(open);
    const discard = await ask({
      title: "Discard this entry?",
      body: "What you have entered has not been saved. Closing now loses it.",
      confirm: "Discard entry",
      cancel: "Keep editing",
      tone: "destructive",
    });
    if (discard) setOpen(false);
  };
  return [confirmDialog, onOpenChange] as const;
}
/**
 * Row-level loading, empty and failed states for a ledger table.
 *
 * This exists because of a real defect, not for tidiness. Registers used to
 * render "No records found." whenever `rows` was undefined, which is both the
 * loading case and the error case. So a first paint flashed an empty table, and
 * a failed query or an RLS denial showed "No records found." permanently. An
 * operator whose access had silently lapsed would read that as "there is no
 * data", which is the most damaging thing this application can say.
 *
 * `RegisterState` is the only way a table should express these three states, so
 * the distinction cannot be forgotten at a call site.
 */

export function LoadingRows({ cols, rows = 5 }: { cols: number; rows?: number | undefined }) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr key={index} aria-hidden="true">
          <td colSpan={cols} className="px-3 py-2">
            <span className="skeleton-line block w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function EmptyState({
  cols,
  title = "No records found.",
  body,
  action,
}: {
  cols: number;
  title?: string | undefined;
  /** One sentence saying why it is empty, or what to do next. */
  body?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {body && (
          <p className="mx-auto mt-1.5 max-w-[46ch] text-xs leading-relaxed text-muted-foreground">
            {body}
          </p>
        )}
        {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
      </td>
    </tr>
  );
}

export function ErrorState({
  cols,
  title = "This list could not be loaded.",
  body = "The request did not come back. Check the connection and try again.",
  onRetry,
}: {
  cols: number;
  title?: string | undefined;
  body?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center">
        <div role="alert" className="flex flex-col items-center">
          {/* A failed load is a system state, not a loss of material, so it
              wears amber. Red is reserved for figures that do not add up. */}
          <span className="inline-flex items-center gap-1.5 rounded-xs bg-warning/15 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-warning-foreground">
            <IconAlert className="size-3.5" aria-hidden="true" />
            Not loaded
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-xs leading-relaxed text-muted-foreground">
            {body}
          </p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="mt-4">
              Try again
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/** The three states of a data-backed table, in one decision. */
export function RegisterState({
  status,
  cols,
  rows,
  emptyTitle,
  emptyBody,
  action,
  onRetry,
}: {
  status: "loading" | "error" | "ready";
  cols: number;
  /** Skeleton row count. */
  rows?: number | undefined;
  emptyTitle?: string | undefined;
  emptyBody?: string | undefined;
  action?: ReactNode | undefined;
  onRetry?: (() => void) | undefined;
}) {
  if (status === "loading") return <LoadingRows cols={cols} rows={rows} />;
  if (status === "error") return <ErrorState cols={cols} onRetry={onRetry} />;
  return <EmptyState cols={cols} title={emptyTitle} body={emptyBody} action={action} />;
}

/** Derive the three-state status from a TanStack Query result. */
export function queryStatus(query: {
  isLoading: boolean;
  isError: boolean;
  data: unknown;
}): "loading" | "error" | "ready" {
  if (query.isError) return "error";
  if (query.isLoading) return "loading";
  // A success with no payload is still loading until the first non-undefined
  // value lands. `useRows` returns undefined while in flight.
  if (query.data === undefined && query.isLoading) return "loading";
  return "ready";
}
