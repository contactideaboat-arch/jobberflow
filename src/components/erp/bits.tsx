import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { downloadCsv, downloadExcel, printElement } from "@/lib/erp";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string | undefined;
  tone?: "default" | "accent" | "success" | "warning" | "info";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning-foreground",
    info: "text-info",
  };
  return (
    <Card className="shadow-panel">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className={cn("num mt-2 text-2xl font-bold", tones[tone])}>
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
        </div>
        {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Card className={cn("shadow-panel", className)}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          {actions}
        </CardHeader>
      )}
      <CardContent className={cn("p-0", title ? "pt-0" : "")}>{children}</CardContent>
    </Card>
  );
}

export type Option = { value: string; label: string; hint?: string };

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  className,
}: {
  options: Option[];
  value?: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("h-9 w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
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
                  <Check className={cn("size-3.5", value === o.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{o.label}</span>
                  {o.hint && <span className="num ml-auto text-xs text-muted-foreground">{o.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function NumInput({
  value,
  onChange,
  step = "0.001",
  className,
  disabled,
}: {
  value: number | string;
  onChange: (n: number) => void;
  step?: string;
  className?: string | undefined;
  disabled?: boolean;
}) {
  return (
    <Input
      type="number"
      min="0"
      step={step}
      disabled={disabled}
      className={cn("num h-9 text-right", className)}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  );
}

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
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => downloadCsv(filename, rows)}>
        <FileDown className="size-3.5" /> CSV
      </Button>
      <Button size="sm" variant="outline" onClick={() => downloadExcel(filename, rows)}>
        <FileSpreadsheet className="size-3.5" /> Excel
      </Button>
      {printId && (
        <Button size="sm" variant="outline" onClick={() => printElement(printId, title ?? filename)}>
          <Printer className="size-3.5" /> Print / PDF
        </Button>
      )}
    </div>
  );
}

export function EmptyRow({ cols, text = "No records found." }: { cols: number; text?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-8 text-center text-sm text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}
