/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconBoxes, IconCopy, IconEye, IconScrap, IconStar } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { KG, NUM } from "@/lib/erp";
import { cn } from "@/lib/utils";

export function BomCard({
  bom,
  editable,
  busy,
  onView,
  onClone,
  onToggle,
  onDelete,
}: {
  bom: any;
  editable: boolean;
  busy: boolean;
  onView: () => void;
  onClone: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const items = bom.bom_items ?? [];
  const primary = items.find((item: any) => item.is_primary_material);
  const total = items.reduce((sum: number, item: any) => sum + Number(item.standard_quantity), 0);
  return (
    <article
      aria-label={bom.bom_number}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-lg border border-t-2 bg-card",
        bom.active ? "border-t-primary" : "border-t-border-strong",
      )}
    >
      <header className="flex min-h-12 flex-wrap items-center gap-2 border-b px-4 py-3">
        <h2 className="num text-sm font-semibold">{bom.bom_number}</h2>
        <span className="rounded-sm border px-1.5 py-0.5 text-2xs font-medium">{bom.version}</span>
        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 text-2xs font-semibold",
            bom.active ? "text-success" : "text-muted-foreground",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          {bom.active ? "Active" : "Inactive"}
        </span>
      </header>
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <IconBoxes className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xs font-medium text-muted-foreground">Finished product</p>
            <p className="mt-0.5 break-words text-sm font-semibold">
              {bom.finished_products?.code} — {bom.finished_products?.name}
            </p>
          </div>
        </div>
        <div>
          <p className="text-2xs font-medium text-muted-foreground">Primary material</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm">
            <IconStar className="mt-0.5 size-3.5 shrink-0 text-warning-foreground" />
            <span className="min-w-0 break-words">
              {primary
                ? `${primary.raw_materials?.code} — ${primary.raw_materials?.name}`
                : "Not assigned"}
            </span>
          </p>
        </div>
        <dl className="grid grid-cols-3 divide-x rounded-md border bg-subtle">
          <div className="min-w-0 p-2.5">
            <dt className="text-2xs text-muted-foreground">Base qty</dt>
            <dd className="num mt-1 break-words text-sm font-semibold">
              {NUM(bom.base_quantity)}{" "}
              <span className="text-2xs font-normal text-muted-foreground">
                {bom.finished_products?.uom ?? "PCS"}
              </span>
            </dd>
          </div>
          <div className="min-w-0 p-2.5">
            <dt className="text-2xs text-muted-foreground">Materials</dt>
            <dd className="num mt-1 text-sm font-semibold">{NUM(items.length)}</dd>
          </div>
          <div className="min-w-0 p-2.5">
            <dt className="text-2xs text-muted-foreground">Std total</dt>
            <dd className="num mt-1 break-words text-sm font-semibold">
              {KG(total)} <span className="text-2xs font-normal text-muted-foreground">KG</span>
            </dd>
          </div>
        </dl>
      </div>
      <footer className="flex min-h-12 flex-wrap items-center gap-1 border-t px-3 py-2">
        <Button
          size="icon"
          variant="ghost"
          aria-label={`View ${bom.bom_number}`}
          title="View BOM"
          onClick={onView}
        >
          <IconEye />
        </Button>
        {editable && (
          <>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              aria-label={`Clone ${bom.bom_number}`}
              title="Create revision"
              onClick={onClone}
            >
              <IconCopy />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              className="text-destructive hover:bg-destructive-soft hover:text-destructive"
              aria-label={`Delete ${bom.bom_number}`}
              title="Delete BOM"
              onClick={onDelete}
            >
              <IconScrap />
            </Button>
            <label className="ml-auto flex items-center gap-2 text-2xs text-muted-foreground">
              {bom.active ? "Deactivate" : "Activate"}
              <Switch
                checked={bom.active}
                disabled={busy}
                aria-label={`${bom.active ? "Deactivate" : "Activate"} ${bom.bom_number}`}
                onCheckedChange={onToggle}
              />
            </label>
          </>
        )}
      </footer>
    </article>
  );
}
