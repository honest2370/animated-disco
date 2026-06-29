import { useEffect, useState, type ReactNode } from "react";
import { useNav } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { useAsync, fetchServices } from "../lib/data";
import { supabase, uploadFile } from "../lib/supabase";
import {
  Button,
  Input,
  Textarea,
  Field,
  Sheet,
  Badge,
  fmtCFA,
  EmptyState,
  Spinner,
  useToast,
  cn,
} from "../components/ui";
import {
  ServiceIcon,
  PlusIcon,
  BagIcon,
  ChevronLeftIcon,
  ClockIcon,
  CheckCircleIcon,
} from "../lib/icons";
import type { Service } from "../lib/types";

const STYLES = ["Moderne", "Minimaliste", "Luxe", "Coloré", "Corporate", "Créatif"];

export default function Services() {
  const { profile } = useAuth();
  const toast = useToast();
  const { go, back, route } = useNav();
  const { data, loading } = useAsync<Service[]>(fetchServices, []);
  const [active, setActive] = useState<Service | null>(null);
  const [cat, setCat] = useState("Tous");

  useEffect(() => {
    const sel = route.params?.select;
    if (sel && data) { const s = data.find((x) => x.id === sel); if (s) setActive(s); }
  }, [route.params?.select, data]);

  const cats = ["Tous", ...Array.from(new Set((data || []).map((s) => s.category)))];
  const list = (data || []).filter((s) => cat === "Tous" || s.category === cat);

  return (
    <div className="min-h-full bg-surface">
      <Header back={back} title="Services" subtitle="Commandez une prestation sur mesure" />

      <div className="px-4 pb-28 pt-2">
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                cat === c
                  ? "gradient-brand text-white border-transparent"
                  : "border-slate-200 text-muted bg-white"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner /></div>}
        {!loading && list.length === 0 && <EmptyState icon={<BagIcon className="h-7 w-7" />} title="Aucun service" desc="Les services apparaîtront ici une fois publiés." />}

        <div className="space-y-3">
          {list.map((s) => (
            <div key={s.id} className="card-glass flex gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white">
                <ServiceIcon name={s.icon} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base-soft">{s.name}</h3>
                  <Badge tone="accent">{s.category}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted">{s.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="font-bold text-base">{fmtCFA(s.base_price)}</span>
                    <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" /> ~{s.delivery_days}j</span>
                  </div>
                  <Button size="sm" onClick={() => setActive(s)}><PlusIcon className="h-4 w-4" /> Commander</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {active && (
        <OrderSheet service={active} onClose={() => setActive(null)} onCreated={(id) => { setActive(null); toast({ type: "success", msg: "Commande envoyée !" }); go({ name: "order-detail", params: { id } }); }} userId={profile?.id || ""} />
      )}
    </div>
  );
}

function OrderSheet({ service, onClose, onCreated, userId }: { service: Service; onClose: () => void; onCreated: (id: string) => void; userId: string }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState(String(service.base_price));
  const [deadline, setDeadline] = useState("");
  const [colors, setColors] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const toggleStyle = (s: string) => setStyles((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const submit = async () => {
    if (!brief.trim()) { toast({ type: "error", msg: "Décrivez votre projet." }); return; }
    setSaving(true);
    let refUrl: string | null = null;
    if (refFile) { const up = await uploadFile(userId, refFile, "references"); refUrl = up?.url ?? null; }
    const details: Record<string, any> = { style: styles, colors: colors.trim(), deadline: deadline.trim(), reference: refUrl };
    const { data, error } = await supabase.from("service_orders").insert({ user_id: userId, service_id: service.id, title: title.trim() || service.name, brief: brief.trim(), details, budget: Number(budget) || service.base_price, status: "pending" }).select("id").single();
    setSaving(false);
    if (error || !data) { toast({ type: "error", msg: "Impossible d'envoyer." }); return; }
    await supabase.from("order_messages").insert({ order_id: data.id, sender_role: "system", kind: "text", content: `Commande reçue. Notre équipe examine votre demande.` });
    onCreated(data.id);
  };

  return (
    <Sheet open onClose={onClose} title={`Commander — ${service.name}`}>
      <div className="space-y-3.5">
        <div className="flex items-center gap-3 rounded-2xl bg-accent-50 border border-accent-100 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white"><ServiceIcon name={service.icon} className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold text-base-soft">{service.name}</p><p className="text-xs text-accent-600">Tarif indicatif : {fmtCFA(service.base_price)}</p></div>
        </div>
        <Field label="Titre du projet"><Input placeholder="Ex. Logo pour ma marque" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Décrivez votre besoin *"><Textarea placeholder="Objectif, public cible, idées…" value={brief} onChange={(e) => setBrief(e.target.value)} /></Field>
        <Field label="Style recherché">
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button key={s} onClick={() => toggleStyle(s)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", styles.includes(s) ? "gradient-brand text-white border-transparent" : "border-slate-200 text-muted bg-white")}>{s}</button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget (FCFA)"><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
          <Field label="Délai souhaité"><Input placeholder="Ex. 5 jours" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
        </div>
        <Field label="Couleurs / références"><Input placeholder="Ex. bleu marine & blanc" value={colors} onChange={(e) => setColors(e.target.value)} /></Field>
        <FilePicker label="Image de référence (optionnel)" file={refFile} onPick={setRefFile} />
        <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[11px] text-muted"><CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><span>L'admin examine votre demande, fixe une facture et échange avec vous dans la messagerie.</span></div>
        <Button full size="lg" loading={saving} onClick={submit}>Envoyer la commande</Button>
      </div>
    </Sheet>
  );
}

export function FilePicker({ label, file, onPick, accept = "image/*" }: { label: string; file: File | null; onPick: (f: File | null) => void; accept?: string }) {
  return (
    <Field label={label}>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-accent-300">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><PlusIcon className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm text-base-soft">{file ? file.name : "Téléverser"}</span><span className="block text-[11px] text-muted">{file ? `${(file.size / 1024).toFixed(0)} Ko` : "Cliquez pour choisir"}</span></span>
        <input type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      </label>
    </Field>
  );
}

export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 card-glass-strong border-b border-slate-100 px-4 pb-3 pt-3 safe-top">
      <div className="flex items-center gap-2">
        <button onClick={back} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition">
          <ChevronLeftIcon className="h-5 w-5 text-base-soft" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-base">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}
