import { useAuth } from "../lib/auth";
import { useNav } from "../lib/nav";
import { useAsync, fetchServices, fetchProducts, fetchSettings } from "../lib/data";
import { supabase } from "../lib/supabase";
import { Button, fmtCFA, useToast, Card } from "../components/ui";
import {
  ServiceIcon,
  BagIcon,
  ReceiptIcon,
  BotIcon,
  BellIcon,
  SparkIcon,
  ChevronRightIcon,
  ShieldIcon,
  TrendingIcon,
  CoinsIcon,
} from "../lib/icons";
import type { Service, Product } from "../lib/types";

export default function Home() {
  const { profile } = useAuth();
  const { go } = useNav();
  const toast = useToast();
  const services = useAsync<Service[]>(fetchServices, []);
  const products = useAsync<Product[]>(fetchProducts, []);
  const settings = useAsync(fetchSettings, []);

  const counts = useAsync(async () => {
    const uid = profile?.id;
    if (!uid) return { svc: 0, prd: 0 };
    const [s, p] = await Promise.all([
      supabase.from("service_orders").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("product_orders").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);
    return { svc: s.count || 0, prd: p.count || 0 };
  }, [profile?.id]);

  const isAdmin = profile?.role === "admin";

  const actions = [
    { icon: <SparkIcon className="h-5 w-5" />, label: "Services", to: { name: "services" } },
    { icon: <BagIcon className="h-5 w-5" />, label: "Boutique", to: { name: "store" } },
    { icon: <ReceiptIcon className="h-5 w-5" />, label: "Commandes", to: { name: "orders" } },
    { icon: <BotIcon className="h-5 w-5" />, label: "ADF IA", to: { name: "ai" } },
  ] as const;

  return (
    <div className="space-y-5 px-4 pb-28 pt-3 bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">Bonjour 👋</p>
          <h1 className="text-lg font-extrabold text-base">
            {profile?.full_name?.split(" ")[0] || "Bienvenue"}
            {isAdmin && <span className="ml-2 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-700">Admin</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast({ type: "info", msg: "Aucune nouvelle notification." })}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200"
          >
            <BellIcon className="h-5 w-5 text-muted" />
          </button>
          <button
            onClick={() => go({ name: "settings" })}
            className="h-10 rounded-xl gradient-brand px-3.5 text-xs font-bold text-white"
          >
            Profil
          </button>
        </div>
      </header>

      {/* Announcement */}
      {settings.data?.store_announcement && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-accent-50 border border-accent-100 px-4 py-3 animate-fade">
          <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
          <p className="text-[13px] leading-snug text-accent-700">{settings.data.store_announcement}</p>
        </div>
      )}

      {/* AI hero card */}
      <button
        onClick={() => go({ name: "ai" })}
        className="relative w-full overflow-hidden rounded-3xl animate-slide-up"
      >
        <div className="relative flex items-center gap-4 bg-gradient-to-br from-base to-base-soft p-5 text-white">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-brand">
            <BotIcon className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-white">ADF IA</h3>
            <p className="mt-0.5 text-[13px] text-white/70">Votre assistant intelligent — disponible 24/7.</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-white/60" />
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center justify-between">
            <ReceiptIcon className="h-5 w-5 text-accent-500" />
            <TrendingIcon className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-base">{counts.data?.svc ?? "–"}</p>
          <p className="text-[11px] text-muted font-medium">Commandes services</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <BagIcon className="h-5 w-5 text-accent-500" />
            <CoinsIcon className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-base">{counts.data?.prd ?? "–"}</p>
          <p className="text-[11px] text-muted font-medium">Achats boutique</p>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => go(a.to as any)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-slate-100 p-3 text-center transition hover:border-accent-200 hover:bg-accent-50/30 active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500">
              {a.icon}
            </span>
            <span className="text-[10px] font-semibold leading-tight text-base-soft">{a.label}</span>
          </button>
        ))}
      </div>

      {isAdmin && (
        <Button full variant="secondary" onClick={() => go({ name: "admin" })}>
          <ShieldIcon className="h-4 w-4" /> Panneau d'administration
        </Button>
      )}

      {/* Services */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-extrabold text-base">Nos services</h2>
          <button onClick={() => go({ name: "services" })} className="flex items-center text-xs font-semibold text-accent-600">
            Tout voir <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
          {(services.data || []).slice(0, 6).map((s) => (
            <button
              key={s.id}
              onClick={() => go({ name: "services", params: { select: s.id } })}
              className="w-36 shrink-0 rounded-2xl bg-white border border-slate-100 p-3 text-left shadow-sm hover:border-accent-200 transition active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                <ServiceIcon name={s.icon} className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[13px] font-semibold leading-tight text-base-soft">{s.name}</p>
              <p className="mt-1 text-[11px] text-accent-600 font-semibold">dès {fmtCFA(s.base_price)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-extrabold text-base">Boutique</h2>
          <button onClick={() => go({ name: "store" })} className="flex items-center text-xs font-semibold text-accent-600">
            Tout voir <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
          {(products.data || []).slice(0, 6).map((p) => (
            <button
              key={p.id}
              onClick={() => go({ name: "store", params: { select: p.id } })}
              className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white border border-slate-100 text-left shadow-sm hover:border-accent-200 transition active:scale-95"
            >
              <div className="aspect-square w-full bg-slate-100">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted/40">
                    <BagIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-[13px] font-semibold text-base-soft">{p.name}</p>
                <p className="mt-0.5 text-[11px] font-bold text-accent-600">{fmtCFA(p.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer className="pt-4 pb-2 text-center">
        <p className="text-[11px] text-muted/50">© {new Date().getFullYear()} ADF — Arafat Digital Futurist</p>
        <p className="text-[11px] text-muted/40">Conçue par le PDG, M. Arafat Garga</p>
      </footer>
    </div>
  );
}
