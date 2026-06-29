import { useEffect, useState } from "react";
import { useNav } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { supabase, uploadFile } from "../lib/supabase";
import { Button, Sheet, Badge, Spinner, EmptyState, fmtCFA, fmtDate, ProductStatusBadge, ServiceStatusBadge, useToast, cn } from "../components/ui";
import { Header } from "./Services";
import { ReceiptIcon, BagIcon, DownloadIcon, PackageIcon, CheckIcon, ClockIcon } from "../lib/icons";
import type { ServiceOrder, ProductOrder, PaymentProof } from "../lib/types";

export default function Orders() {
  const { back, go } = useNav();
  const { profile } = useAuth();
  const [tab, setTab] = useState<"service" | "product">("service");
  const [svc, setSvc] = useState<ServiceOrder[]>([]);
  const [prd, setPrd] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ProductOrder | null>(null);

  const load = async () => {
    if (!profile?.id) return; setLoading(true);
    const [s, p] = await Promise.all([supabase.from("service_orders").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }), supabase.from("product_orders").select("*").eq("user_id", profile.id).order("created_at", { ascending: false })]);
    setSvc((s.data as ServiceOrder[]) || []); setPrd((p.data as ProductOrder[]) || []); setLoading(false);
  };
  useEffect(() => { load(); }, [profile?.id]);

  return (
    <div className="min-h-full bg-surface">
      <Header back={back} title="Mes commandes" subtitle="Suivi de vos services & achats" />
      <div className="px-4 pb-28 pt-2">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {([{ k: "service", label: "Services", n: svc.length }, { k: "product", label: "Boutique", n: prd.length }] as const).map(({ k, label, n }) => (
            <button key={k} onClick={() => setTab(k as "service" | "product")} className={cn("flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition", tab === k ? "bg-white text-base shadow-sm" : "text-muted")}>{label} <span className={cn("rounded-full px-1.5 text-[10px]", tab === k ? "bg-slate-100 text-base" : "bg-white/60 text-muted")}>{n}</span></button>
          ))}
        </div>
        {loading ? <div className="flex justify-center py-16"><Spinner /></div> : tab === "service" ? (
          svc.length === 0 ? <EmptyState icon={<ReceiptIcon className="h-7 w-7" />} title="Aucune commande" desc="Commandez un service pour le retrouver ici." action={<Button onClick={() => go({ name: "services" })}>Voir les services</Button>} /> : (
            <div className="space-y-3">{svc.map((o) => (
              <button key={o.id} onClick={() => go({ name: "order-detail", params: { id: o.id } })} className="card-glass flex w-full items-center gap-3 rounded-2xl p-3.5 text-left active:scale-[.99]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><ReceiptIcon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-base-soft">{o.title || o.order_code}</p><ServiceStatusBadge status={o.status} /></div><p className="mt-0.5 truncate text-xs text-muted">{o.order_code} · {fmtDate(o.created_at)}</p></div>
              </button>
            ))}</div>
          )
        ) : prd.length === 0 ? <EmptyState icon={<BagIcon className="h-7 w-7" />} title="Aucun achat" desc="Vos achats en boutique apparaîtront ici." action={<Button onClick={() => go({ name: "store" })}>Aller à la boutique</Button>} /> : (
          <div className="space-y-3">{prd.map((o) => (
            <button key={o.id} onClick={() => setActive(o)} className="card-glass flex w-full items-center gap-3 rounded-2xl p-3.5 text-left active:scale-[.99]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><PackageIcon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-base-soft">{o.product_name}</p><ProductStatusBadge status={o.status} /></div><p className="mt-0.5 truncate text-xs text-muted">{o.order_code} · {fmtCFA(o.amount)} · ×{o.quantity}</p></div>
            </button>
          ))}</div>
        )}
      </div>
      {active && <ProductOrderSheet order={active} onClose={() => setActive(null)} onChanged={load} />}
    </div>
  );
}

function ProductOrderSheet({ order, onClose, onChanged }: { order: ProductOrder; onClose: () => void; onChanged: () => void }) {
  const { profile } = useAuth(); const toast = useToast();
  const [proof, setProof] = useState<PaymentProof | null>(null); const [file, setFile] = useState<File | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { supabase.from("payment_proofs").select("*").eq("order_code", order.order_code).eq("order_type", "product").order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => setProof((data as PaymentProof) || null)); }, [order.order_code]);
  const reupload = async () => { if (!file) return; setSaving(true); const up = await uploadFile(profile!.id, file, "proofs"); if (up) { await supabase.from("payment_proofs").insert({ order_code: order.order_code, order_type: "product", user_id: profile!.id, amount: order.amount, file_url: up.url, status: "pending" }); await supabase.from("product_orders").update({ status: "paid" }).eq("id", order.id); toast({ type: "success", msg: "Preuve envoyée." }); onChanged(); onClose(); } else toast({ type: "error", msg: "Échec." }); setSaving(false); };
  return (
    <Sheet open onClose={onClose} title={order.product_name}>
      <div className="space-y-4">
        <div className="flex items-center justify-between"><div><p className="text-xs text-muted">{order.order_code}</p><p className="text-lg font-extrabold text-base">{fmtCFA(order.amount)}</p></div><ProductStatusBadge status={order.status} /></div>
        <div className="grid grid-cols-2 gap-2 text-sm"><Info label="Quantité" value={`×${order.quantity}`} /><Info label="Date" value={fmtDate(order.created_at)} /></div>
        <div className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted">Preuve de paiement</span>{proof ? <Badge tone={proof.status === "approved" ? "emerald" : proof.status === "rejected" ? "rose" : "amber"}>{proof.status === "approved" ? "Validée" : proof.status === "rejected" ? "Rejetée" : "En attente"}</Badge> : <Badge tone="slate">Aucune</Badge>}</div></div>
        {order.status === "delivered" && order.file_url && <a href={order.file_url} target="_blank" rel="noreferrer"><Button full size="lg"><DownloadIcon className="h-5 w-5" /> Télécharger mon produit</Button></a>}
        {order.status === "delivered" && !order.file_url && <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700"><CheckIcon className="h-5 w-5" /> Commande livrée.</div>}
        {proof?.status === "rejected" && <div><p className="mb-2 text-xs text-muted">Preuve rejetée. Téléversez-en une nouvelle.</p><FileLine file={file} onPick={setFile} /><Button full className="mt-2" loading={saving} onClick={reupload}>Renvoyer la preuve</Button></div>}
        {(order.status === "pending" || (order.status === "paid" && proof?.status === "pending")) && <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700"><ClockIcon className="h-4 w-4" /> En attente de validation.</div>}
      </div>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[11px] text-muted">{label}</p><p className="text-sm font-medium text-base-soft">{value}</p></div>;
}

function FileLine({ file, onPick }: { file: File | null; onPick: (f: File | null) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><DownloadIcon className="h-5 w-5 rotate-180" /></span><span className="flex-1 text-sm text-base-soft">{file ? file.name : "Choisir un fichier"}</span><input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onPick(e.target.files?.[0] || null)} /></label>;
}
