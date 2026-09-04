"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, PackagePlus, Loader2 } from "lucide-react";
import { Button, Card, Modal, Input, Select, Badge } from "@/components/ui";
import { adjustStock, upsertProduct, createCategory } from "@/app/actions";
import { cn, formatRupiah } from "@/lib/utils";
import type { Product, Category, Role } from "@/lib/types";

export function Inventory({
  products,
  categories,
  role,
}: {
  products: Product[];
  categories: Category[];
  role: Role;
}) {
  const canManageProducts = role === "owner";
  const canAdjustStock = role === "owner" || role === "cashier";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Inventori</h1>
          <p className="text-sm text-text-muted">Kelola menu & stok bahan.</p>
        </div>
        {canManageProducts && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Menu Baru
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 border-b border-border px-5 py-3 text-xs font-medium text-text-faint md:grid">
          <span>Menu</span>
          <span>Kategori</span>
          <span>Harga</span>
          <span>Stok</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {products.map((p) => {
            const stock = p.inventory?.stock_qty ?? 0;
            const threshold = p.inventory?.low_stock_threshold ?? 5;
            const low = stock <= threshold;
            return (
              <div
                key={p.id}
                className="grid grid-cols-2 gap-2 px-5 py-3.5 text-sm md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center md:gap-3"
              >
                <div className="col-span-2 md:col-span-1">
                  <p className="font-medium">{p.name}</p>
                  {!p.is_active && (
                    <span className="text-[11px] text-text-faint">Nonaktif</span>
                  )}
                </div>
                <span className="text-text-muted">{p.category?.name ?? "-"}</span>
                <span className="tabular text-text-muted">{formatRupiah(p.price)}</span>
                <button
                  disabled={!canAdjustStock}
                  onClick={() => canAdjustStock && setStockTarget(p)}
                  className="flex w-fit items-center gap-1.5 disabled:cursor-default"
                >
                  <span className={cn("tabular text-sm", low && "font-semibold text-warning")}>
                    {stock} {p.inventory?.unit}
                  </span>
                  {low && <Badge className="border-warning/30 bg-warning/10 text-warning">Menipis</Badge>}
                </button>
                {canManageProducts && (
                  <button
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    className="w-fit rounded-lg p-1.5 text-text-faint hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {formOpen && (
        <ProductFormModal
          product={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
        />
      )}
      {stockTarget && <StockAdjustModal product={stockTarget} onClose={() => setStockTarget(null)} />}
    </div>
  );
}

function ProductFormModal({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [stockQty, setStockQty] = useState(String(product?.inventory?.stock_qty ?? 20));
  const [unit, setUnit] = useState(product?.inventory?.unit ?? "pcs");
  const [threshold, setThreshold] = useState(String(product?.inventory?.low_stock_threshold ?? 5));
  const [newCategory, setNewCategory] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!name.trim() || !price) {
      toast.error("Nama & harga wajib diisi");
      return;
    }
    startTransition(async () => {
      const res = await upsertProduct({
        id: product?.id,
        name: name.trim(),
        price: Number(price),
        categoryId: categoryId || null,
        stockQty: Number(stockQty),
        unit,
        lowStockThreshold: Number(threshold),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(product ? "Menu diperbarui" : "Menu ditambahkan");
      onClose();
    });
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    const res = await createCategory(newCategory.trim());
    if (res.error) toast.error(res.error);
    else {
      toast.success("Kategori ditambahkan");
      setNewCategory("");
    }
  }

  return (
    <Modal open onClose={onClose} title={product ? "Edit Menu" : "Menu Baru"}>
      <div className="space-y-3.5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Nama Menu</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kopi Susu Gula Aren" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Harga (Rp)</label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Kategori</label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Stok</label>
            <Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Satuan</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Batas Menipis</label>
            <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3.5">
          <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Kategori baru..." />
          <Button type="button" variant="secondary" size="sm" onClick={handleAddCategory}>
            Tambah
          </Button>
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
        </Button>
      </div>
    </Modal>
  );
}

function StockAdjustModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [qty, setQty] = useState(String(product.inventory?.stock_qty ?? 0));
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await adjustStock(product.id, Number(qty));
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Stok diperbarui");
      onClose();
    });
  }

  return (
    <Modal open onClose={onClose} title={`Sesuaikan Stok — ${product.name}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <PackagePlus size={20} className="text-violet-light" />
          <Input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="text-center text-lg"
          />
          <span className="text-sm text-text-muted">{product.inventory?.unit}</span>
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader2 size={16} className="animate-spin" /> : "Simpan Stok"}
        </Button>
      </div>
    </Modal>
  );
}
