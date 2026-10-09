export type StockView = "all" | "warehouse" | "jobbers";

export type StockRow = {
  id: string;
  location: Exclude<StockView, "all">;
  jobberId?: string;
  jobberCode?: string;
  jobberName?: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  category?: string;
  uom: string;
  inbound: number;
  outbound: number;
  wastage: number | null;
  returned: number | null;
  adjustment: number | null;
  balance: number;
  minimumStock: number;
};
