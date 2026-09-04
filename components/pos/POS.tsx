"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Minus, Trash2, ShoppingCart, Loader2, Coffee, Banknote, QrCode } from "lucide-react";
import { Button, Card, Input, Select, Modal } from "@/components/ui";
import { cn, formatRupiah } from "@/lib/utils";
import { checkoutOrder } from "@/app/actions";
import type { Category, Product, CartLine, PaymentMethod } from "@/lib/types";

const TABLE_OPTIONS = [
  "Take Away",
  ...Array.from({ length: 10 }, (_, i) => `Meja ${i + 1}`),
];

export function POS({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(TABLE_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (activeCat === "all" ? products : products.filter((p) => p.category_id === activeCat)),
    [products, activeCat]
  );

  const total = cart.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0);

  function addToCart(product: Product) {
    const stock = product.inventory?.stock_qty ?? 0;
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty + 1 > stock) {
        toast.error(`Stok ${product.name} tidak cukup`);
        return prev;
      }
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function handleConfirmCheckout() {
    startTransition(async () => {
      const res = await checkoutOrder(tableNumber, paymentMethod, cart);
      if ("error" in res) {
        toast.error(res.error ?? "Gagal memproses order");
        return;
      }
      toast.success("Order berhasil dibuat!");
      setCart([]);
      setCheckoutOpen(false);
      router.push(`/receipt/${res.orderId}`);
    });
  }

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Product side */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 md:px-8">
        <h1 className="mb-4 text-xl font-semibold md:text-2xl">Kasir</h1>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <CatTab active={activeCat === "all"} onClick={() => setActiveCat("all")} label="Semua" />
          {categories.map((c) => (
            <CatTab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} label={c.name} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pb-28 sm:grid-cols-3 md:pb-6 lg:grid-cols-4">
          {filtered.map((product) => {
            const stock = product.inventory?.stock_qty ?? 0;
            const outOfStock = stock <= 0;
            const lowStock = stock > 0 && stock <= (product.inventory?.low_stock_threshold ?? 5);
            return (
              <button
                key={product.id}
                disabled={outOfStock}
                onClick={() => addToCart(product)}
                className={cn(
                  "group relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left transition-all active:scale-[0.97]",
                  outOfStock ? "opacity-40" : "hover:border-violet/50 hover:bg-surface-2"
                )}
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet/20 to-magenta/10 text-violet-light">
                  <Coffee size={20} />
                </div>
                <p className="text-sm font-medium leading-snug">{product.name}</p>
                <p className="tabular mt-1 text-sm text-text-muted">{formatRupiah(product.price)}</p>
                {outOfStock && (
                  <span className="mt-2 rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-medium text-danger">
                    Stok habis
                  </span>
                )}
                {lowStock && (
                  <span className="mt-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                    Sisa {stock}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart side — desktop panel */}
      <div className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface/60 md:flex">
        <CartContents
          cart={cart}
          total={total}
          onChangeQty={changeQty}
          onRemove={removeLine}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </div>

      {/* Cart side — mobile floating bar */}
      {itemCount > 0 && (
        <button
          onClick={() => setCheckoutOpen(true)}
          className="fixed inset-x-4 bottom-20 z-30 flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet to-magenta px-5 py-3.5 shadow-2xl md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart size={16} /> {itemCount} item
          </span>
          <span className="tabular text-sm font-semibold">{formatRupiah(total)}</span>
        </button>
      )}

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Konfirmasi Pembayaran" maxWidth="max-w-lg">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="max-h-64 space-y-2 overflow-y-auto md:max-h-80">
            {cart.map((line) => (
              <div key={line.product.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">
                  {line.quantity}x {line.product.name}
                </span>
                <span className="tabular shrink-0 text-text-muted">
                  {formatRupiah(line.product.price * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Meja / Take Away</label>
              <Select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)}>
                {TABLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    paymentMethod === "cash" ? "border-violet bg-violet/15 text-white" : "border-border text-text-muted"
                  )}
                >
                  <Banknote size={16} /> Cash
                </button>
                <button
                  onClick={() => setPaymentMethod("qris")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    paymentMethod === "qris" ? "border-violet bg-violet/15 text-white" : "border-border text-text-muted"
                  )}
                >
                  <QrCode size={16} /> QRIS
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-text-muted">Total</span>
              <span className="tabular text-lg font-semibold">{formatRupiah(total)}</span>
            </div>

            <Button className="w-full" onClick={handleConfirmCheckout} disabled={isPending || cart.length === 0}>
              {isPending ? <Loader2 size={16} className="animate-spin" /> : "Konfirmasi & Cetak Struk"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CatTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
        active ? "border-violet bg-violet/15 text-white" : "border-border text-text-muted hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function CartContents({
  cart,
  total,
  onChangeQty,
  onRemove,
  onCheckout,
}: {
  cart: CartLine[];
  total: number;
  onChangeQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <ShoppingCart size={18} className="text-violet-light" />
        <p className="font-semibold">Keranjang</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {cart.length === 0 ? (
          <p className="mt-10 text-center text-sm text-text-faint">Belum ada item dipilih</p>
        ) : (
          cart.map((line) => (
            <Card key={line.product.id} className="p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{line.product.name}</p>
                <button onClick={() => onRemove(line.product.id)} className="shrink-0 text-text-faint hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onChangeQty(line.product.id, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 hover:bg-white/10"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="tabular w-4 text-center text-sm">{line.quantity}</span>
                  <button
                    onClick={() => onChangeQty(line.product.id, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 hover:bg-white/10"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="tabular text-sm text-text-muted">
                  {formatRupiah(line.product.price * line.quantity)}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-text-muted">Total</span>
          <span className="tabular text-lg font-semibold">{formatRupiah(total)}</span>
        </div>
        <Button className="w-full" disabled={cart.length === 0} onClick={onCheckout}>
          Bayar
        </Button>
      </div>
    </>
  );
}
