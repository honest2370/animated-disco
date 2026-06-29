import { useEffect, useState } from "react";
import { useNav } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { useAsync, fetchProducts, fetchPaymentMethods } from "../lib/data";
import { supabase, uploadFile } from "../lib/supabase";
import { Button, Badge, Sheet, Input, fmtCFA, Spinner, EmptyState, useToast, cn } from "../components/ui";
import { Header, FilePicker } from "./Services";
import { BagIcon, SearchIcon, PaymentIcon, CopyIcon, CheckIcon, PackageIcon } from "../lib/icons";
import type { Product, PaymentMethod } from "../lib/types";

const TYPE_LABELS: Record<string, string> = { digital: "Numérique", physical: "Physique", subscription: "Abonnement", license: "Licence", template: "Modèle", other: "Autre" };

export default function Store() {
  const { back, route } = useNav();
  const { data, loading } = useAsync<Product[]>(fetchProducts, []);
  const [q, setQ] = useState(""); const [cat, setCat] = useState("Tous"); const [active, setActive] = useState<Product | null>(null);
  useEffect(() => { const sel = route.params?.select; if (sel && data) { const p = data.find((x) => x.id === sel); if (p) setActive(p); } }, [route.params?.select, data]);
  const cats = ["Tous", ...Array.from(new Set((data || []).map((p) => p.category)))];
  const list = (data || []).filter((p) => (cat === "Tous" || p.category === cat) && (q === "" || p.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-full bg-surface">
      <Header back={back} title="Boutique" subtitle="Produits digitaux & plus" />
      <div className="px-4 pb-28 pt-2">
        <div className="relative mb-3"><SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" /><Input className="pl-10" placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition", cat === c ? "gradient-brand text-white border-transparent" : "border-slate-200 text-muted bg-white")}>{c}</button>
          ))}
        </div>
        {loading && <div className="flex justify-center py-16"><Spinner /></div>}
        {!loading && list.length === 0 && <EmptyState icon={<BagIcon className="h-7 w-7" />} title="Boutique vide" desc="Les produits apparaîtront ici une fois ajoutés." />}
        <div className="grid grid-cols-2 gap-3">
          {list.map((p) => (
            <button key={p.id} onClick={() => setActive(p)} className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm text-left transition hover:border-accent-200 active:scale-95">
              <div className="relative aspect-square w-full bg-slate-100">{p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted/40"><PackageIcon className="h-8 w-8" /></div>}{p.compare_price && <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">Promo</span>}</div>
              <div className="p-2.5"><p className="truncate text-[13px] font-semibold text-base-soft">{p.name}</p><div className="mt-0.5 flex items-center gap-1.5"><span className="text-xs font-bold text-accent-600">{fmtCFA(p.price)}</span>{p.compare_price && <span className="text-[10px] text-muted line-through">{fmtCFA(p.compare_price)}</span>}</div></div>
            </button>
          ))}
        </div>
      </div>
      {active && <ProductSheet product={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ProductSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const [checkout, setCheckout] = useState(false);
  return (
    <Sheet open onClose={onClose} title={product.name}>
      {!checkout ? (
        <div>
          <div className="relative -mx-1 mb-3 aspect-video w-[calc(100%+8px)] overflow-hidden rounded-2xl bg-slate-100">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted/40"><PackageIcon className="h-10 w-10" /></div>}</div>
          <div className="mb-2 flex items-center gap-2"><Badge tone="accent">{TYPE_LABELS[product.type] || product.type}</Badge><Badge tone="slate">{product.category}</Badge>{product.stock !== null && product.stock <= 5 && <Badge tone="amber">Plus que {product.stock}</Badge>}</div>
          <div className="mb-3 flex items-end gap-2"><span className="text-2xl font-extrabold text-base">{fmtCFA(product.price)}</span>{product.compare_price && <span className="pb-1 text-sm text-muted line-through">{fmtCFA(product.compare_price)}</span>}</div>
          <p className="mb-4 text-sm leading-relaxed text-muted">{product.description || "Aucune description."}</p>
          <Button full size="lg" onClick={() => setCheckout(true)}><BagIcon className="h-5 w-5" /> Acheter maintenant</Button>
        </div>
      ) : <Checkout product={product} onClose={onClose} />}
    </Sheet>
  );
}

function Checkout({ product, onClose }: { product: Product; onClose: () => void }) {
  const { profile } = useAuth(); const { go } = useNav(); const toast = useToast();
  const methods = useAsync<PaymentMethod[]>(fetchPaymentMethods, []);
  const [qty, setQty] = useState(1); const [proof, setProof] = useState<File | null>(null); const [saving, setSaving] = useState(false);
  const total = product.price * qty;

  const submit = async () => {
    if (!proof) { toast({ type: "error", msg: "Téléversez la preuve." }); return; }
    setSaving(true);
    const { data: order, error } = await supabase.from("product_orders").insert({ user_id: profile!.id, product_id: product.id, product_name: product.name, quantity: qty, amount: total, status: "paid" }).select("id, order_code").single();
    if (error || !order) { toast({ type: "error", msg: "Échec." }); setSaving(false); return; }
    const up = await uploadFile(profile!.id, proof, "proofs");
    if (up) await supabase.from("payment_proofs").insert({ order_code: order.order_code, order_type: "product", user_id: profile!.id, amount: total, file_url: up.url, status: "pending" });
    setSaving(false); toast({ type: "success", msg: "Commande envoyée !" }); onClose(); go({ name: "orders" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
        <span className="text-sm text-base-soft">{product.name}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-8 w-8 rounded-lg bg-slate-100 text-base-soft">–</button>
          <span className="w-6 text-center text-sm font-bold text-base">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="h-8 w-8 rounded-lg bg-slate-100 text-base-soft">+</button>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-accent-50 border border-accent-100 p-3"><span className="text-sm text-accent-700">Total</span><span className="text-xl font-extrabold text-base">{fmtCFA(total)}</span></div>
      <div><p className="mb-2 text-xs font-semibold text-muted">Payez via</p>
        <div className="space-y-2">{(methods.data || []).map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><PaymentIcon type={m.type} className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-base-soft">{m.name}</p>{m.holder && <p className="text-xs text-muted">{m.holder}</p>}
              <div className="flex items-center gap-1"><p className="font-mono text-sm text-base">{m.number}</p><button onClick={() => { navigator.clipboard?.writeText(m.number); toast({ type: "success", msg: "Copié." }); }} className="text-accent-500"><CopyIcon className="h-3.5 w-3.5" /></button></div></div>
          </div>
        ))}{methods.data?.length === 0 && <p className="text-sm text-muted">Aucune méthode pour l'instant.</p>}</div>
      </div>
      <FilePicker label="Preuve de paiement" file={proof} onPick={setProof} />
      <Button full size="lg" loading={saving} onClick={submit}><CheckIcon className="h-5 w-5" /> Confirmer la commande</Button>
      <p className="text-center text-[11px] text-muted">Après validation par l'administrateur, vous recevrez votre produit.</p>
    </div>
  );
}

export { TYPE_LABELS };
