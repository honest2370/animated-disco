import { useEffect, useRef, useState } from "react";
import { useNav } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { supabase, uploadFile } from "../lib/supabase";
import {
  Button, Input, Textarea, Select, Field, Sheet, Badge, Spinner,
  EmptyState, fmtCFA, fmtDate, ServiceStatusBadge, ProductStatusBadge,
  PAYMENT_LABELS, useToast, cn,
} from "../components/ui";
import { Header } from "./Services";
import {
  ServiceIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, BotIcon,
  UsersIcon, ReceiptIcon, BagIcon, WalletIcon, SettingsIcon, TrendingIcon,
  ShieldIcon, BanIcon, CheckCircleIcon, DownloadIcon, CoinsIcon,
} from "../lib/icons";
import type {
  Service, ServiceOrder, Product, ProductOrder, PaymentMethod,
  PaymentType, PaymentProof, AiConfig, AppSettings, Profile,
} from "../lib/types";

type TabKey = "dash" | "orders" | "services" | "products" | "pay" | "ai" | "users" | "settings";

const TABS: { k: TabKey; label: string; icon: React.ReactNode }[] = [
  { k: "dash", label: "Tableau", icon: <TrendingIcon className="h-4 w-4" /> },
  { k: "orders", label: "Commandes", icon: <ReceiptIcon className="h-4 w-4" /> },
  { k: "services", label: "Services", icon: <ServiceIcon name="spark" className="h-4 w-4" /> },
  { k: "products", label: "Boutique", icon: <BagIcon className="h-4 w-4" /> },
  { k: "pay", label: "Paiements", icon: <WalletIcon className="h-4 w-4" /> },
  { k: "ai", label: "ADF IA", icon: <BotIcon className="h-4 w-4" /> },
  { k: "users", label: "Utilisateurs", icon: <UsersIcon className="h-4 w-4" /> },
  { k: "settings", label: "Réglages", icon: <SettingsIcon className="h-4 w-4" /> },
];

export default function Admin() {
  const { back } = useNav();
  const [tab, setTab] = useState<TabKey>("dash");
  return (
    <div className="min-h-full bg-surface">
      <Header back={back} title="Administration" subtitle="Pilotage de la plateforme ADF" />
      <div className="sticky top-[64px] z-20 card-glass-strong border-y border-slate-100">
        <div className="flex gap-1 overflow-x-auto px-3 py-2 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                tab === t.k
                  ? "gradient-brand text-white"
                  : "text-muted bg-white border border-slate-200"
              )}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-28 pt-3">
        <TabContent tab={tab} />
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: TabKey }) {
  switch (tab) {
    case "dash": return <DashTab />;
    case "orders": return <OrdersTab />;
    case "services": return <ServicesTab />;
    case "products": return <ProductsTab />;
    case "pay": return <PaymentsTab />;
    case "ai": return <AiTab />;
    case "users": return <UsersTab />;
    case "settings": return <SettingsTab />;
    default: return null;
  }
}

function CenterSpinner() {
  return <div className="flex justify-center py-16"><Spinner /></div>;
}

/* ===================== DASHBOARD ===================== */
function DashTab() {
  const [data, setData] = useState<{
    svc: number; prd: number; users: number; products: number;
    revenue: number; pendingProofs: PaymentProof[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, p, u, pr, pp] = await Promise.all([
        supabase.from("service_orders").select("id", { count: "exact", head: true }),
        supabase.from("product_orders").select("id,amount,status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("payment_proofs").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      ]);
      const prd = (p.data as ProductOrder[]) || [];
      const revenue = prd
        .filter((o) => ["paid", "approved", "delivered"].includes(o.status))
        .reduce((a, b) => a + Number(b.amount || 0), 0);
      setData({
        svc: s.count || 0, prd: p.count || 0, users: u.count || 0,
        products: pr.count || 0, revenue, pendingProofs: (pp.data as PaymentProof[]) || [],
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !data) return <CenterSpinner />;

  const cards = [
    { label: "Commandes services", value: data.svc, icon: <ReceiptIcon className="h-4 w-4" /> },
    { label: "Ventes boutique", value: data.prd, icon: <BagIcon className="h-4 w-4" /> },
    { label: "Utilisateurs", value: data.users, icon: <UsersIcon className="h-4 w-4" /> },
    { label: "Produits", value: data.products, icon: <CoinsIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card-glass rounded-2xl p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-500">{c.icon}</div>
            <p className="text-2xl font-extrabold text-base">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="card-glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-base-soft">Revenus (boutique)</p>
          <Badge tone="emerald">{fmtCFA(data.revenue)}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted">Total des commandes boutique payées/livrées.</p>
      </div>
      <div className="card-glass rounded-2xl p-4">
        <p className="mb-2 text-sm font-semibold text-base-soft">Preuves en attente</p>
        {data.pendingProofs.length === 0 ? (
          <p className="text-sm text-muted">Aucune preuve en attente.</p>
        ) : (
          <div className="space-y-2">
            {data.pendingProofs.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5">
                <div><p className="text-sm text-base-soft">{p.order_code}</p><p className="text-[11px] text-muted">{p.order_type} · {fmtCFA(p.amount)}</p></div>
                <Badge tone="amber">À valider</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== ORDERS ===================== */
function OrdersTab() {
  const { go } = useNav();
  const { profile } = useAuth();
  const toast = useToast();
  const [svc, setSvc] = useState<ServiceOrder[]>([]);
  const [prd, setPrd] = useState<ProductOrder[]>([]);
  const [sub, setSub] = useState<"service" | "product">("service");
  const deliverRef = useRef<HTMLInputElement>(null);
  const [deliverTarget, setDeliverTarget] = useState<string | null>(null);

  const load = async () => {
    const [s, p] = await Promise.all([
      supabase.from("service_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("product_orders").select("*").order("created_at", { ascending: false }),
    ]);
    setSvc((s.data as ServiceOrder[]) || []);
    setPrd((p.data as ProductOrder[]) || []);
  };
  useEffect(() => { load(); }, []);

  const deliver = async (file: File) => {
    if (!deliverTarget || !profile) return;
    const up = await uploadFile(profile.id, file, "products");
    if (!up) return toast({ type: "error", msg: "Échec." });
    await supabase.from("product_orders").update({ file_url: up.url, status: "delivered" }).eq("id", deliverTarget);
    toast({ type: "success", msg: "Produit livré." });
    setDeliverTarget(null); load();
  };
  const setPrdStatus = async (id: string, status: ProductOrder["status"]) => {
    await supabase.from("product_orders").update({ status }).eq("id", id); load();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {(["service", "product"] as const).map((k) => (
          <button key={k} onClick={() => setSub(k)}
            className={cn("rounded-xl py-2 text-sm font-semibold", sub === k ? "bg-white text-base shadow-sm" : "text-muted")}>
            {k === "service" ? "Services" : "Boutique"}
          </button>
        ))}
      </div>

      {sub === "service" ? (
        svc.length === 0 ? (
          <EmptyState icon={<ReceiptIcon className="h-7 w-7" />} title="Aucune commande" />
        ) : svc.map((o) => (
          <button key={o.id} onClick={() => go({ name: "order-detail", params: { id: o.id } })}
            className="card-glass flex w-full items-center gap-3 rounded-2xl p-3.5 text-left active:scale-[.99]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><ReceiptIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-soft">{o.title || o.order_code}</p>
              <p className="text-[11px] text-muted">{o.order_code} · {fmtDate(o.created_at)}</p>
            </div>
            <ServiceStatusBadge status={o.status} />
          </button>
        ))
      ) : prd.length === 0 ? (
        <EmptyState icon={<BagIcon className="h-7 w-7" />} title="Aucune vente" />
      ) : prd.map((o) => (
        <div key={o.id} className="card-glass rounded-2xl p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><BagIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-soft">{o.product_name}</p>
              <p className="text-[11px] text-muted">{o.order_code} · {fmtCFA(o.amount)} · ×{o.quantity}</p>
            </div>
            <ProductStatusBadge status={o.status} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {o.status === "paid" && (
              <>
                <Button size="sm" onClick={() => setPrdStatus(o.id, "approved")}><CheckIcon className="h-4 w-4" /> Valider</Button>
                <Button size="sm" onClick={() => { setDeliverTarget(o.id); deliverRef.current?.click(); }}><DownloadIcon className="h-4 w-4" /> Livrer</Button>
                <Button size="sm" variant="danger" onClick={() => setPrdStatus(o.id, "rejected")}>Rejeter</Button>
              </>
            )}
            {o.status === "approved" && (
              <Button size="sm" onClick={() => { setDeliverTarget(o.id); deliverRef.current?.click(); }}><DownloadIcon className="h-4 w-4" /> Livrer</Button>
            )}
            {o.file_url && o.status === "delivered" && (
              <a href={o.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary">Voir</Button></a>
            )}
          </div>
        </div>
      ))}

      <input ref={deliverRef} type="file" accept="image/*,application/pdf,.zip" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) deliver(f); e.currentTarget.value = ""; }} />
    </div>
  );
}

/* ===================== SERVICES ===================== */
const SERVICE_ICONS = ["logo", "palette", "card", "flyer", "social", "layout", "globe", "video", "spark"];

function ServicesTab() {
  const toast = useToast();
  const [items, setItems] = useState<Service[]>([]);
  const [edit, setEdit] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
    setItems((data as Service[]) || []);
  };
  useEffect(() => { load(); }, []);

  const blank = (): Service => ({
    id: "", name: "", slug: "", description: "", category: "Digital", icon: "spark",
    base_price: 0, delivery_days: 3, is_active: true, sort_order: items.length, created_at: "",
  });

  const save = async (s: Service) => {
    const p = { name: s.name, slug: s.slug, description: s.description, category: s.category, icon: s.icon, base_price: Number(s.base_price), delivery_days: Number(s.delivery_days), is_active: s.is_active, sort_order: Number(s.sort_order) };
    if (s.id) await supabase.from("services").update(p).eq("id", s.id);
    else await supabase.from("services").insert(p);
    toast({ type: "success", msg: "Enregistré." }); setOpen(false); load();
  };
  const del = async (id: string) => { await supabase.from("services").delete().eq("id", id); load(); };

  return (
    <div className="space-y-3">
      <Button full onClick={() => { setEdit(blank()); setOpen(true); }}><PlusIcon className="h-4 w-4" /> Ajouter un service</Button>
      {items.map((s) => (
        <div key={s.id} className="card-glass flex items-center gap-3 rounded-2xl p-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white"><ServiceIcon name={s.icon} className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-base-soft">{s.name}</p><p className="text-[11px] text-muted">{s.category} · {fmtCFA(s.base_price)}</p></div>
          <button onClick={() => { setEdit(s); setOpen(true); }} className="p-2 text-muted"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => del(s.id)} className="p-2 text-rose-400"><TrashIcon className="h-4 w-4" /></button>
        </div>
      ))}
      {open && edit && <ServiceForm initial={edit} onClose={() => setOpen(false)} onSave={save} />}
    </div>
  );
}

function ServiceForm({ initial, onClose, onSave }: { initial: Service; onClose: () => void; onSave: (s: Service) => void }) {
  const [s, setS] = useState<Service>(initial);
  const set = (k: keyof Service, v: any) => setS((p) => ({ ...p, [k]: v }));
  return (
    <Sheet open onClose={onClose} title={initial.id ? "Modifier" : "Nouveau service"}>
      <div className="space-y-3.5">
        <Field label="Nom"><Input value={s.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Description"><Textarea value={s.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie"><Input value={s.category} onChange={(e) => set("category", e.target.value)} /></Field>
          <Field label="Délai (jours)"><Input type="number" value={s.delivery_days} onChange={(e) => set("delivery_days", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix de base"><Input type="number" value={s.base_price} onChange={(e) => set("base_price", e.target.value)} /></Field>
          <Field label="Ordre"><Input type="number" value={s.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></Field>
        </div>
        <Field label="Icône">
          <div className="flex flex-wrap gap-2">
            {SERVICE_ICONS.map((ic) => (
              <button key={ic} onClick={() => set("icon", ic)} className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", s.icon === ic ? "gradient-brand text-white border-transparent" : "border-slate-200 bg-white text-base-soft")}><ServiceIcon name={ic} className="h-5 w-5" /></button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm text-base-soft"><input type="checkbox" checked={s.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-accent-500" /> Actif</label>
        <Button full onClick={() => onSave(s)} disabled={!s.name.trim()}>Enregistrer</Button>
      </div>
    </Sheet>
  );
}

/* ===================== PRODUCTS ===================== */
const PRODUCT_TYPES = ["digital", "physical", "subscription", "license", "template", "other"];

function ProductsTab() {
  const toast = useToast();
  const { profile } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [edit, setEdit] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems((data as Product[]) || []);
  };
  useEffect(() => { load(); }, []);

  const blank = (): Product => ({
    id: "", name: "", description: "", price: 0, compare_price: null, category: "Digital",
    type: "digital", image_url: null, file_url: null, stock: null, is_active: true, data: {}, created_at: "",
  });

  const save = async (p: Product, again: boolean) => {
    const payload = { name: p.name, description: p.description, price: Number(p.price), compare_price: p.compare_price ? Number(p.compare_price) : null, category: p.category, type: p.type, image_url: p.image_url, file_url: p.file_url, stock: p.stock === null ? null : Number(p.stock), is_active: p.is_active, data: p.data };
    if (p.id) await supabase.from("products").update(payload).eq("id", p.id);
    else await supabase.from("products").insert(payload);
    toast({ type: "success", msg: "Enregistré." });
    if (again) setEdit(blank()); else setOpen(false);
    load();
  };
  const del = async (id: string) => { await supabase.from("products").delete().eq("id", id); load(); };

  return (
    <div className="space-y-3">
      <Button full onClick={() => { setEdit(blank()); setOpen(true); }}><PlusIcon className="h-4 w-4" /> Ajouter un produit</Button>
      {items.map((p) => (
        <div key={p.id} className="card-glass flex items-center gap-3 rounded-2xl p-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted/40"><BagIcon className="h-5 w-5" /></div>}
          </div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-base-soft">{p.name}</p><p className="text-[11px] text-muted">{p.type} · {fmtCFA(p.price)}</p></div>
          <button onClick={() => { setEdit(p); setOpen(true); }} className="p-2 text-muted"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => del(p.id)} className="p-2 text-rose-400"><TrashIcon className="h-4 w-4" /></button>
        </div>
      ))}
      {open && edit && <ProductForm initial={edit} userId={profile!.id} onClose={() => setOpen(false)} onSave={save} onNew={() => setEdit(blank())} />}
    </div>
  );
}

function ProductForm({ initial, userId, onClose, onSave }: { initial: Product; userId: string; onClose: () => void; onSave: (p: Product, again: boolean) => void; onNew?: () => void }) {
  const toast = useToast();
  const [p, setP] = useState<Product>(initial);
  const [imgUp, setImgUp] = useState(false);
  const [fileUp, setFileUp] = useState(false);
  const set = (k: keyof Product, v: any) => setP((prev) => ({ ...prev, [k]: v }));
  const needsFile = ["digital", "license", "template", "subscription"].includes(p.type);
  const upImg = async (f: File) => { setImgUp(true); const up = await uploadFile(userId, f, "products"); if (up) { set("image_url", up.url); toast({ type: "success", msg: "Image chargée." }); } setImgUp(false); };
  const upFile = async (f: File) => { setFileUp(true); const up = await uploadFile(userId, f, "products"); if (up) { set("file_url", up.url); toast({ type: "success", msg: "Fichier chargé." }); } setFileUp(false); };

  return (
    <Sheet open onClose={onClose} title={initial.id ? "Modifier" : "Nouveau produit"}>
      <div className="space-y-3.5">
        <Field label="Nom"><Input value={p.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Description"><Textarea value={p.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={p.type} onChange={(e) => set("type", e.target.value)}>{PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label="Catégorie"><Input value={p.category} onChange={(e) => set("category", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix (FCFA)"><Input type="number" value={p.price} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Prix barré"><Input type="number" value={p.compare_price || ""} onChange={(e) => set("compare_price", e.target.value)} /></Field>
        </div>
        {p.type === "physical" && <Field label="Stock"><Input type="number" value={p.stock ?? ""} onChange={(e) => set("stock", e.target.value)} /></Field>}
        <Field label="Image"><Uploader label="Image" accept="image/*" value={p.image_url} busy={imgUp} onPick={upImg} onClear={() => set("image_url", null)} /></Field>
        {needsFile && <Field label="Fichier livrable"><Uploader label="Fichier" accept="*/*" value={p.file_url} busy={fileUp} onPick={upFile} onClear={() => set("file_url", null)} /></Field>}
        <label className="flex items-center gap-2 text-sm text-base-soft"><input type="checkbox" checked={p.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-accent-500" /> Actif</label>
        <div className="flex gap-2">
          <Button full onClick={() => onSave(p, false)} disabled={!p.name.trim()}>Publier</Button>
          {!initial.id && <Button variant="secondary" onClick={() => onSave(p, true)} disabled={!p.name.trim()}>Publier & continuer</Button>}
        </div>
        <p className="text-center text-[11px] text-muted">« Publier & continuer » permet d'ajouter plusieurs produits.</p>
      </div>
    </Sheet>
  );
}

function Uploader({ label, accept, value, busy, onPick, onClear }: { label: string; accept: string; value: string | null; busy: boolean; onPick: (f: File) => void; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {value && accept.startsWith("image") ? <img src={value} className="h-full w-full object-cover" /> : value ? <div className="flex h-full items-center justify-center text-accent-500"><CheckCircleIcon className="h-5 w-5" /></div> : <div className="flex h-full items-center justify-center text-muted/40"><DownloadIcon className="h-5 w-5 rotate-180" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted">{value ? "Chargé ✓" : `Téléverser ${label}`}</p>
        <div className="mt-1 flex gap-2">
          <label className="cursor-pointer rounded-lg bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-600">{busy ? "..." : "Choisir"}
            <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
          </label>
          {value && <button onClick={onClear} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-rose-500">Retirer</button>}
        </div>
      </div>
    </div>
  );
}

/* ===================== PAYMENTS ===================== */
const PAY_TYPES: PaymentType[] = ["mobile_money", "orange_money", "wave", "moov", "bank", "paypal", "card", "crypto", "other"];

function PaymentsTab() {
  const toast = useToast();
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [edit, setEdit] = useState<PaymentMethod | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("payment_methods").select("*").order("sort_order", { ascending: true });
    setItems((data as PaymentMethod[]) || []);
  };
  useEffect(() => { load(); }, []);

  const blank = (): PaymentMethod => ({ id: "", name: "", type: "mobile_money", holder: "", number: "", extra: {}, instructions: "", is_active: true, sort_order: items.length, created_at: "" });
  const save = async (m: PaymentMethod) => {
    const payload = { name: m.name, type: m.type, holder: m.holder, number: m.number, instructions: m.instructions, is_active: m.is_active, sort_order: Number(m.sort_order), extra: m.extra };
    if (m.id) await supabase.from("payment_methods").update(payload).eq("id", m.id);
    else await supabase.from("payment_methods").insert(payload);
    toast({ type: "success", msg: "Enregistré." }); setOpen(false); load();
  };
  const del = async (id: string) => { await supabase.from("payment_methods").delete().eq("id", id); load(); };

  return (
    <div className="space-y-3">
      <Button full onClick={() => { setEdit(blank()); setOpen(true); }}><PlusIcon className="h-4 w-4" /> Ajouter une méthode</Button>
      {items.map((m) => (
        <div key={m.id} className="card-glass flex items-center gap-3 rounded-2xl p-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-base-soft">{m.name} <span className="text-muted">· {PAYMENT_LABELS[m.type]}</span></p>
            <p className="truncate font-mono text-[11px] text-muted">{m.number}</p>
          </div>
          <button onClick={() => { setEdit(m); setOpen(true); }} className="p-2 text-muted"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => del(m.id)} className="p-2 text-rose-400"><TrashIcon className="h-4 w-4" /></button>
        </div>
      ))}
      {open && edit && <PaymentForm initial={edit} onClose={() => setOpen(false)} onSave={save} />}
    </div>
  );
}

function PaymentForm({ initial, onClose, onSave }: { initial: PaymentMethod; onClose: () => void; onSave: (m: PaymentMethod) => void }) {
  const [m, setM] = useState<PaymentMethod>(initial);
  const set = (k: keyof PaymentMethod, v: any) => setM((p) => ({ ...p, [k]: v }));
  return (
    <Sheet open onClose={onClose} title={initial.id ? "Modifier" : "Nouvelle méthode"}>
      <div className="space-y-3.5">
        <Field label="Nom affiché"><Input value={m.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. MTN MoMo" /></Field>
        <Field label="Type"><Select value={m.type} onChange={(e) => set("type", e.target.value)}>{PAY_TYPES.map((t) => <option key={t} value={t}>{PAYMENT_LABELS[t]}</option>)}</Select></Field>
        <Field label="Titulaire"><Input value={m.holder} onChange={(e) => set("holder", e.target.value)} /></Field>
        <Field label="Numéro / compte"><Input value={m.number} onChange={(e) => set("number", e.target.value)} /></Field>
        <Field label="Instructions"><Textarea value={m.instructions} onChange={(e) => set("instructions", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm text-base-soft"><input type="checkbox" checked={m.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-accent-500" /> Active</label>
        <Button full onClick={() => onSave(m)} disabled={!m.name.trim()}>Enregistrer</Button>
      </div>
    </Sheet>
  );
}

/* ===================== AI ===================== */
const PROVIDERS = ["gemini", "openai", "grok", "claude", "custom"];

function AiTab() {
  const toast = useToast();
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [edit, setEdit] = useState<AiConfig | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [c, s] = await Promise.all([
      supabase.from("ai_configs").select("*").order("created_at", { ascending: false }),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setConfigs((c.data as AiConfig[]) || []);
    setSettings((s.data as AppSettings) || null);
  };
  useEffect(() => { load(); }, []);

  const blank = (): AiConfig => ({ id: "", provider: "gemini", label: "", api_key: "", base_url: "", model: "", is_active: false, created_at: "" });
  const saveConfig = async (cfg: AiConfig) => {
    const payload = { provider: cfg.provider, label: cfg.label, api_key: cfg.api_key, base_url: cfg.base_url, model: cfg.model, is_active: cfg.is_active };
    if (cfg.id) await supabase.from("ai_configs").update(payload).eq("id", cfg.id);
    else await supabase.from("ai_configs").insert(payload);
    if (cfg.is_active) { const others = (configs || []).filter((x) => x.id !== cfg.id); if (others.length) await supabase.from("ai_configs").update({ is_active: false }).in("id", others.map((o) => o.id)); }
    toast({ type: "success", msg: "Enregistré." }); setOpen(false); load();
  };
  const activate = async (id: string) => { await supabase.from("ai_configs").update({ is_active: false }).neq("id", id); await supabase.from("ai_configs").update({ is_active: true }).eq("id", id); load(); };
  const del = async (id: string) => { await supabase.from("ai_configs").delete().eq("id", id); load(); };
  const saveSettings = async () => { if (!settings) return; await supabase.from("app_settings").update({ ai_system_prompt: settings.ai_system_prompt, ai_temperature: Number(settings.ai_temperature), ai_enabled: settings.ai_enabled, default_ai_limit: Number(settings.default_ai_limit), store_announcement: settings.store_announcement, maintenance: settings.maintenance }).eq("id", 1); toast({ type: "success", msg: "Instructions enregistrées." }); };

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-base-soft"><BotIcon className="h-4 w-4 text-accent-500" /> Instructions / prompt</p>
          <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={settings?.ai_enabled ?? false} onChange={(e) => setSettings((s) => s && ({ ...s, ai_enabled: e.target.checked }))} className="h-4 w-4 accent-accent-500" /> IA activée</label>
        </div>
        <Textarea className="min-h-[120px]" placeholder="Définissez comment ADF IA doit répondre..." value={settings?.ai_system_prompt || ""} onChange={(e) => setSettings((s) => s && ({ ...s, ai_system_prompt: e.target.value }))} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Température"><Input type="number" step="0.1" value={settings?.ai_temperature ?? 0.7} onChange={(e) => setSettings((s) => s && ({ ...s, ai_temperature: Number(e.target.value) }))} /></Field>
          <Field label="Limite / utilisateur"><Input type="number" value={settings?.default_ai_limit ?? 50} onChange={(e) => setSettings((s) => s && ({ ...s, default_ai_limit: Number(e.target.value) }))} /></Field>
        </div>
        <Button full className="mt-3" onClick={saveSettings}>Enregistrer les instructions</Button>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-base-soft">Fournisseurs d'API</p><Button size="sm" onClick={() => { setEdit(blank()); setOpen(true); }}><PlusIcon className="h-4 w-4" /> Ajouter</Button></div>
        <div className="space-y-2">
          {configs.map((c) => (
            <div key={c.id} className="card-glass flex items-center gap-3 rounded-2xl p-3.5">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", c.is_active ? "gradient-brand text-white" : "bg-slate-100 text-muted")}><BotIcon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-base-soft">{c.label || c.provider} <span className="text-muted">· {c.provider}</span></p><p className="truncate text-[11px] text-muted">{c.model || "modèle par défaut"}</p></div>
              {c.is_active ? <Badge tone="emerald">Active</Badge> : <Button size="sm" variant="secondary" onClick={() => activate(c.id)}>Activer</Button>}
              <button onClick={() => { setEdit(c); setOpen(true); }} className="p-2 text-muted"><PencilIcon className="h-4 w-4" /></button>
              <button onClick={() => del(c.id)} className="p-2 text-rose-400"><TrashIcon className="h-4 w-4" /></button>
            </div>
          ))}
          {configs.length === 0 && <p className="text-sm text-muted">Aucun fournisseur. Ajoutez Gemini, Grok, Claude…</p>}
        </div>
      </div>
      {open && edit && <AiConfigForm initial={edit} onClose={() => setOpen(false)} onSave={saveConfig} />}
    </div>
  );
}

function AiConfigForm({ initial, onClose, onSave }: { initial: AiConfig; onClose: () => void; onSave: (c: AiConfig) => void }) {
  const [c, setC] = useState<AiConfig>(initial);
  const set = (k: keyof AiConfig, v: any) => setC((p) => ({ ...p, [k]: v }));
  return (
    <Sheet open onClose={onClose} title={initial.id ? "Modifier" : "Nouveau fournisseur"}>
      <div className="space-y-3.5">
        <Field label="Fournisseur"><Select value={c.provider} onChange={(e) => set("provider", e.target.value)}>{PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field>
        <Field label="Libellé"><Input value={c.label} onChange={(e) => set("label", e.target.value)} placeholder="Ex. Gemini Flash" /></Field>
        <Field label="Modèle" hint="llama-3.3-70b-versatile, gemini-2.0-flash, gpt-4o-mini…"><Input value={c.model} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="Clé API"><Input type="password" value={c.api_key} onChange={(e) => set("api_key", e.target.value)} /></Field>
        <Field label="URL de base (optionnel)"><Input value={c.base_url} onChange={(e) => set("base_url", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm text-base-soft"><input type="checkbox" checked={c.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-accent-500" /> Définir comme actif</label>
        <Button full onClick={() => onSave(c)} disabled={!c.api_key.trim()}>Enregistrer</Button>
      </div>
    </Sheet>
  );
}

/* ===================== USERS ===================== */
function UsersTab() {
  const [items, setItems] = useState<Profile[]>([]);
  const load = async () => { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); setItems((data as Profile[]) || []); };
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: Partial<Profile>) => { await supabase.from("profiles").update(patch).eq("id", id); load(); };

  return (
    <div className="space-y-3">
      {items.map((u) => (
        <div key={u.id} className="card-glass rounded-2xl p-3.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-soft">{u.full_name || "Sans nom"} {u.role === "admin" && <Badge tone="accent">Admin</Badge>}</p>
              <p className="truncate text-[11px] text-muted">{u.email}</p>
            </div>
            {u.banned && <Badge tone="rose">Banni</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input type="number" className="h-9 w-28" value={u.ai_message_limit} onChange={(e) => update(u.id, { ai_message_limit: Number(e.target.value) })} />
            <span className="text-[11px] text-muted">limite IA ({u.ai_message_count} utilisés)</span>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => update(u.id, { ai_message_count: 0 })}>Reset</Button>
              <Button size="sm" variant="secondary" onClick={() => update(u.id, { role: u.role === "admin" ? "user" : "admin" })}><ShieldIcon className="h-4 w-4" /></Button>
              <Button size="sm" variant={u.banned ? "secondary" : "danger"} onClick={() => update(u.id, { banned: !u.banned })}><BanIcon className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <EmptyState icon={<UsersIcon className="h-7 w-7" />} title="Aucun utilisateur" />}
    </div>
  );
}

/* ===================== SETTINGS ===================== */
function SettingsTab() {
  const toast = useToast();
  const [s, setS] = useState<AppSettings | null>(null);
  useEffect(() => { supabase.from("app_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS((data as AppSettings) || null)); }, []);
  const set = (k: keyof AppSettings, v: any) => setS((p) => (p ? { ...p, [k]: v } : p));
  const save = async () => { if (!s) return; await supabase.from("app_settings").update({ store_announcement: s.store_announcement, maintenance: s.maintenance, default_ai_limit: Number(s.default_ai_limit) }).eq("id", 1); toast({ type: "success", msg: "Réglages enregistrés." }); };
  if (!s) return <CenterSpinner />;
  return (
    <div className="card-glass space-y-3.5 rounded-3xl p-4">
      <Field label="Annonce boutique (accueil)"><Textarea value={s.store_announcement || ""} onChange={(e) => set("store_announcement", e.target.value)} /></Field>
      <Field label="Limite IA par défaut"><Input type="number" value={s.default_ai_limit} onChange={(e) => set("default_ai_limit", Number(e.target.value))} /></Field>
      <label className="flex items-center gap-2 text-sm text-base-soft"><input type="checkbox" checked={s.maintenance} onChange={(e) => set("maintenance", e.target.checked)} className="h-4 w-4 accent-accent-500" /> Mode maintenance</label>
      <Button full onClick={save}>Enregistrer</Button>
    </div>
  );
}
