/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconPencil, IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/erp/AppShell";
import {
  ExportBar,
  Field,
  FormSection,
  Panel,
  RegisterState,
  SearchSelect,
  queryStatus,
  useGuardedClose,
} from "@/components/erp/bits";
import {
  FilterSelect,
  GridPager,
  GridScroll,
  GridToolbar,
  NIL,
  SortHeader,
  useGrid,
} from "@/components/erp/grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { PCS, INR, errMsg, priceForQuantity, toPaiseInput } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/products")({
  head: () => ({
    meta: [
      { title: "Finished products | JobberFlow" },
      {
        name: "description",
        content: "Products your jobbers make, with their bill of material and stock.",
      },
      { property: "og:title", content: "Finished products | JobberFlow" },
      { property: "og:description", content: "Products your jobbers make, with their bill of material and stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductMaster,
});

const CATEGORIES = ["BUCKET", "MUG", "TUB", "CHAIR", "STOOL", "STORAGE", "CRATE", "OTHER"];
const UOMS = ["PCS", "SET", "KG"];
const BLANK = { code: "", name: "", category: "BUCKET", uom: "PCS", description: "", status: true };

type Errors = { code?: string; name?: string; tiers?: string };

/** One row of the price ladder being typed. Rates are held as rupees while typing. */
type TierDraft = { key: string; minQuantity: string; price: string };

let tierSeq = 0;
const blankTier = (): TierDraft => ({ key: `t${++tierSeq}`, minQuantity: "", price: "" });

function ProductMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [category, setCategory] = useState("");
  const [bomFilter, setBomFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [initialForm, setInitialForm] = useState<any>(BLANK);
  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [initialTiers, setInitialTiers] = useState<TierDraft[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const query = useRows("finished_products", ["finished_products"], (b) => b.order("code"));
  const status = queryStatus(query);
  const { data: stock } = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const { data: boms } = useRows("bom_headers", ["bom_headers"], (b) => b.eq("active", true));
  const { data: priceTiers } = useRows("finished_product_price_tiers", [
    "finished_product_price_tiers",
  ]);

  /** A product's price ladder, keyed by product id. */
  const tiersOf = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of (priceTiers ?? []) as any[]) {
      const list = map.get(t.product_id) ?? [];
      list.push(t);
      map.set(t.product_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(a.min_quantity ?? 0) - Number(b.min_quantity ?? 0));
    }
    return map;
  }, [priceTiers]);

  /** The rate that applies at a quantity, in paise, from a product's ladder. */
  const rateAt = (productId: string, quantity: number) => {
    const tier = priceForQuantity(
      (tiersOf.get(productId) ?? []).map((t) => ({
        minQuantity: Number(t.min_quantity ?? 0),
        unitPricePaise: Number(t.unit_price_paise ?? 0),
      })),
      quantity,
    );
    return tier?.unitPricePaise ?? null;
  };

  const balances = useMemo(
    () => new Map(((stock ?? []) as any[]).map((s) => [s.product_id, Number(s.balance ?? 0)])),
    [stock],
  );
  const activeBom = useMemo(
    () => new Map(((boms ?? []) as any[]).map((b) => [b.product_id, b])),
    [boms],
  );
  const balanceOf = (id: string) => balances.get(id) ?? 0;

  const grid = useGrid((query.data ?? []) as any[], {
    search: (r) => [r.code, r.name, r.category].join(" "),
    filter: (r) =>
      (!category || r.category === category) &&
      (!bomFilter || (bomFilter === "yes" ? activeBom.has(r.id) : !activeBom.has(r.id))),
    filtersActive: !!(category || bomFilter),
    sorters: {
      product: (r) => r.code,
      category: (r) => r.category,
      balance: (r) => balanceOf(r.id),
    },
    initialSort: { key: "product", direction: "asc" },
  });

  const dirty =
    JSON.stringify(form) !== JSON.stringify(initialForm) ||
    JSON.stringify(tiers) !== JSON.stringify(initialTiers);
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy, setOpen);
  const set = (k: string, v: unknown) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const openForm = (row?: any) => {
    const next = row ? { ...BLANK, ...row } : BLANK;
    // Editing loads the saved ladder so the form shows what is actually stored;
    // creating starts with one empty base-rate row, because a price of zero is
    // not a useful starting point and an empty ladder is easy to leave behind.
    const loaded = row
      ? (tiersOf.get(row.id) ?? []).map((t) => ({
          key: `t${++tierSeq}`,
          minQuantity: String(t.min_quantity ?? 0),
          price: String(Number(t.unit_price_paise ?? 0) / 100),
        }))
      : [blankTier()];
    setEditId(row?.id ?? null);
    setForm(next);
    setInitialForm(next);
    setTiers(loaded);
    setInitialTiers(loaded);
    setErrors({});
    setOpen(true);
  };

  const save = async () => {
    if (busy) return;
    const next: Errors = {};
    if (!String(form.code ?? "").trim()) next.code = "Enter a product code.";
    if (!String(form.name ?? "").trim()) next.name = "Enter the product name.";

    /*
     * The ladder is validated before anything is written, so a duplicate break
     * is caught while the operator is still looking at the form rather than
     * after the product row has already been created.
     */
    const filled = tiers.filter((t) => t.minQuantity.trim() !== "" || t.price.trim() !== "");
    const seenQty = new Set<string>();
    for (const t of filled) {
      if (t.minQuantity.trim() === "" || t.price.trim() === "") {
        next.tiers = "Every price row needs both a quantity and a price, or remove the row.";
        break;
      }
      const qty = Number(t.minQuantity);
      if (!(qty >= 0)) {
        next.tiers = "A quantity break cannot be negative.";
        break;
      }
      if (!Number.isFinite(Number(t.price)) || Number(t.price) <= 0) {
        next.tiers = "Every price row needs a price above zero, or remove the row.";
        break;
      }
      if (seenQty.has(String(qty))) {
        next.tiers = "Two breaks start at the same quantity. Each one needs its own quantity.";
        break;
      }
      seenQty.add(String(qty));
    }

    setErrors(next);
    if (next.code || next.name || next.tiers) return;

    setBusy(true);
    const payload: any = {
      code: String(form.code).trim().toUpperCase(),
      name: String(form.name).trim(),
      category: form.category,
      uom: form.uom || "PCS",
      description: form.description || null,
      status: !!form.status,
    };
    const res = editId
      ? await db.from("finished_products").update(payload).eq("id", editId).select("id").single()
      : await db.from("finished_products").insert(payload).select("id").single();
    if (res.error) {
      setBusy(false);
      toast.error(`Not saved. ${errMsg(res.error)}`);
      return;
    }
    const productId = res.data?.id ?? editId;

    /*
     * The ladder is replaced wholesale rather than diffed row by row. An edit
     * that removes a break must actually remove it, and a diff would have to
     * reason about which rows survived a reorder to get there. The rows are
     * small and belong to one product, so delete-then-insert is the clearer
     * transaction: if the insert fails the product still exists, just unpriced.
     */
    if (productId) {
      const del = await db.from("finished_product_price_tiers").delete().eq("product_id", productId);
      if (del.error) {
        setBusy(false);
        toast.error(
          `${payload.code} was saved but its prices were not: ${errMsg(del.error)}. Open the product again to set them.`,
        );
        invalidate([["finished_products"]]);
        return;
      }
      if (filled.length) {
        const ins = await db.from("finished_product_price_tiers").insert(
          filled.map((t) => ({
            product_id: productId,
            min_quantity: Number(t.minQuantity),
            unit_price_paise: Number(toPaiseInput(t.price)),
          })),
        );
        if (ins.error) {
          setBusy(false);
          toast.error(
            `${payload.code} was saved but its prices were not: ${errMsg(ins.error)}. Open the product again to set them.`,
          );
          invalidate([["finished_products"]]);
          return;
        }
      }
    }

    setBusy(false);
    toast.success(editId ? `${payload.code} updated.` : `${payload.code} created.`);
    setInitialForm(form);
    setInitialTiers(tiers);
    setOpen(false);
    invalidate([["finished_products"], ["finished_product_price_tiers"]]);
  };

  return (
    <div>
      <PageHeader
        title="Finished products"
        subtitle="Products your jobbers make. A product needs an active bill of material before its production can be received."
        actions={
          <>
            <ExportBar
              filename="finished-products"
              rows={grid.matched.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Category: r.category,
                UOM: r.uom,
                "Active BOM": activeBom.get(r.id)?.bom_number ?? "None",
                Balance: balanceOf(r.id),
                Status: r.status ? "Active" : "Inactive",
              }))}
            />
            {editable && (
              <Button size="sm" onClick={() => openForm()}>
                <IconPlus /> New product
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search products"
          placeholder="Code, name or category"
          noun={["product", "products"]}
          onReset={() => {
            setCategory("");
            setBomFilter("");
          }}
        >
          <FilterSelect
            label="Category"
            value={category}
            onChange={(value) => {
              setCategory(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "All categories" },
              ...CATEGORIES.map((c) => ({
                value: c,
                label: c.charAt(0) + c.slice(1).toLowerCase(),
              })),
            ]}
          />
          <FilterSelect
            label="BOM"
            value={bomFilter}
            onChange={(value) => {
              setBomFilter(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "Any" },
              { value: "yes", label: "Has active BOM" },
              { value: "no", label: "No BOM" },
            ]}
          />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[50rem]">
            <caption className="sr-only">
              Finished products with their bill of material and finished goods balance
            </caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="product">
                  Product
                </SortHeader>
                <SortHeader grid={grid} sortKey="category">
                  Category
                </SortHeader>
                <th scope="col">UOM</th>
                <th scope="col">Bill of material</th>
<th scope="col" className="text-right">Base rate</th>
                <SortHeader grid={grid} sortKey="balance" align="right">
                  In stock
                </SortHeader>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState status={status} cols={8} onRetry={() => void query.refetch()} />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={8}
                  emptyTitle={
                    grid.isFiltered
                      ? "No product matches these filters."
                      : "No finished products yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Search by code, name or category, or clear the filters."
                      : "Add the products your jobbers make for you, then give each one a bill of material."
                  }
                  action={
                    !grid.isFiltered &&
                    editable && (
                      <Button size="sm" onClick={() => openForm()}>
                        <IconPlus /> New product
                      </Button>
                    )
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => {
                  const bom = activeBom.get(r.id);
                  return (
                    <tr key={r.id}>
                      <th scope="row" className="text-left font-normal">
                        <span className="block font-medium">{r.name}</span>
                        <span className="num block text-xs text-muted-foreground">{r.code}</span>
                      </th>
                      <td>
                        {r.category
                          ? r.category.charAt(0) + r.category.slice(1).toLowerCase()
                          : NIL}
                      </td>
                      <td className="text-muted-foreground">{r.uom}</td>
                      <td>
                        {bom ? (
                          <Link
                            to="/masters/bom"
                            search={{ product: r.id }}
                            className="inline-flex items-center gap-2 hover:text-primary"
                          >
                            <Badge variant="success">Active</Badge>
                            <span className="num text-xs">{bom.bom_number}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Badge variant="warning">No BOM</Badge>
                            {editable && (
                              <Link
                                to="/masters/bom"
                                search={{ product: r.id }}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Create
                              </Link>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="num text-right font-semibold">{PCS(balanceOf(r.id))}</td>
<td className="num text-right text-muted-foreground">
  {(() => {
    const breaks = r && tiersOf.get(r.id);
    if (!breaks?.length) return NIL;
    const base = breaks.reduce((a: any, c: any) =>
      Number(c.min_quantity) < Number(a.min_quantity) ? c : a,
    );
    return INR(base.unit_price_paise);
  })()}
</td>
                      <td>
                        <Badge variant={r.status ? "success" : "secondary"}>
                          {r.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link
                              to="/inventory/fg-ledger"
                              search={{ product: r.id }}
                              aria-label={`Movements of ${r.name}`}
                            >
                              Movements
                            </Link>
                          </Button>
                          {editable && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openForm(r)}
                              aria-label={`Edit ${r.name}`}
                              title="Edit"
                            >
                              <IconPencil className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </GridScroll>
        <GridPager grid={grid} />
      </Panel>

      <Dialog open={open} onOpenChange={(value) => void onOpenChange(value)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? `Edit ${initialForm.name}` : "New finished product"}
            </DialogTitle>
            <DialogDescription>
              Stock comes from product inward vouchers and cannot be edited here.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormSection title="Identity">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Product code" required error={errors.code} hint="Saved in capitals.">
                  <Input
                    value={form.code ?? ""}
                    onChange={(e) => set("code", e.target.value)}
                    placeholder="FP001"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Product name" required error={errors.name}>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Category">
                  <SearchSelect
                    options={CATEGORIES.map((c) => ({
                      value: c,
                      label: c.charAt(0) + c.slice(1).toLowerCase(),
                    }))}
                    value={form.category}
                    onChange={(v) => set("category", v)}
                  />
                </Field>
                <Field label="Unit of measure">
                  <SearchSelect
                    options={UOMS.map((u) => ({ value: u, label: u }))}
                    value={form.uom}
                    onChange={(v) => set("uom", v)}
                  />
                </Field>
                <Field label="Description" optional className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description ?? ""}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Switch checked={!!form.status} onCheckedChange={(v) => set("status", v)} />
                  Active, available on new vouchers
                </label>
              </div>
            </FormSection>
            <FormSection
              title="Pricing"
              description="Rates in rupees per unit, held as paise so the total never drifts by a paisa. 0 is the base rate; a higher break applies from that quantity upward, so bulk gets the better price."
            >
              <div className="space-y-2">
                {tiers.map((tier, i) => (
                  <div
                    key={tier.key}
                    className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-md border p-2"
                  >
                    <Field label="From quantity" className="sm:col-span-1">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={tier.minQuantity}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((t, x) =>
                              x === i ? { ...t, minQuantity: e.target.value } : t,
                            ),
                          )
                        }
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Rate (Rs / unit)">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.price}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((t, x) =>
                              x === i ? { ...t, price: e.target.value } : t,
                            ),
                          )
                        }
                        placeholder="0.00"
                      />
                    </Field>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setTiers((prev) => prev.filter((_, x) => x !== i))}
                      disabled={busy}
                      aria-label={`Remove price break ${i + 1}`}
                    >
                      <IconPlus className="size-3.5 rotate-45" />
                    </Button>
                  </div>
                ))}
                {errors.tiers && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.tiers}
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTiers((prev) => [...prev, blankTier()])}
                  disabled={busy}
                >
                  <IconPlus /> Add price break
                </Button>
                {editId && tiers.length > 0 && (
                  <div className="space-y-1 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                    {tiers
                      .slice()
                      .sort((a, b) => Number(a.minQuantity || 0) - Number(b.minQuantity || 0))
                      .map((t) => {
                        const breakQty = Number(t.minQuantity || 0);
                        const above =
                          [...tiers]
                            .filter((x) => Number(x.minQuantity) > breakQty)
                            .sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity))[0];
                        const label = above
                          ? `${PCS(breakQty)} to ${PCS(Number(above.minQuantity) - Number.EPSILON)}`
                          : `From ${PCS(breakQty)}`;
                        return (
                          <div key={t.key} className="flex items-center justify-between">
                            <span>{label}</span>
                            <span className="num font-medium">
                              {INR(toPaiseInput(t.price))}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </FormSection>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                {editId ? "Save changes" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {discardDialog}
    </div>
  );
}
