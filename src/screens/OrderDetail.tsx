import { useCallback, useEffect, useRef, useState } from "react";
import { useNav } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { supabase, uploadFile } from "../lib/supabase";
import {
  Button,
  Input,
  Sheet,
  ServiceStatusBadge,
  fmtCFA,
  timeShort,
  Spinner,
  useToast,
  PAYMENT_LABELS,
  cn,
} from "../components/ui";
import { Header } from "./Services";
import {
  SendIcon,
  PaperclipIcon,
  DownloadIcon,
  WalletIcon,
  PaymentIcon,
  CheckIcon,
  FileIcon,
  BotIcon,
  UploadIcon,
  ReceiptIcon,
  CopyIcon,
} from "../lib/icons";
import type { ServiceOrder, OrderMessage, PaymentMethod, PaymentProof, ServiceStatus } from "../lib/types";

export default function OrderDetail() {
  const { route, back } = useNav();
  const { profile } = useAuth();
  const toast = useToast();
  const id = route.params?.id as string;
  const isAdmin = profile?.role === "admin";
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [msgs, setMsgs] = useState<OrderMessage[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [paySheet, setPaySheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from("service_orders").select("*").eq("id", id).maybeSingle();
    if (o) setOrder(o as ServiceOrder);
    const code = (o as ServiceOrder)?.order_code || "";
    const [{ data: m }, p] = await Promise.all([
      supabase.from("order_messages").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      code ? supabase.from("payment_proofs").select("*").eq("order_code", code).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as PaymentProof[] | null }),
    ]);
    setMsgs((m as OrderMessage[]) || []);
    if (p.data) setProofs(p.data as PaymentProof[]);
  }, [id]);

  const loadMethods = useCallback(async () => {
    const { data } = await supabase.from("payment_methods").select("*").eq("is_active", true).order("sort_order", { ascending: true });
    setMethods((data as PaymentMethod[]) || []);
  }, []);

  useEffect(() => { load(); loadMethods(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [id]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [msgs]);

  const send = async (attach?: File) => {
    if (!attach && !text.trim()) return;
    setBusy(true);
    let url: string | null = null; let kind: OrderMessage["kind"] = "text";
    if (attach) { const up = await uploadFile(profile!.id, attach, "orders"); url = up?.url ?? null; kind = attach.type.startsWith("image/") ? "image" : "file"; }
    const content = text.trim();
    const { data } = await supabase.from("order_messages").insert({ order_id: id, sender_id: profile!.id, sender_role: isAdmin ? "admin" : "user", kind, content: content || "Fichier", file_url: url }).select().single();
    if (data) setMsgs((p) => [...p, data as OrderMessage]);
    setText(""); setBusy(false); if (fileRef.current) fileRef.current.value = "";
  };

  const invoice = msgs.filter((m) => m.kind === "invoice").slice(-1)[0];
  const pendingProof = proofs.find((p) => p.status === "pending");
  const hasFinal = msgs.some((m) => m.kind === "final");

  const updateStatus = async (status: ServiceStatus) => {
    await supabase.from("service_orders").update({ status }).eq("id", id);
    setOrder((o) => (o ? { ...o, status } : o));
    await supabase.from("order_messages").insert({ order_id: id, sender_role: "system", kind: "text", content: STATUS_SYS[status] });
    load();
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <Header back={back} title={order?.order_code || "Commande"} subtitle={order?.title} right={order ? <ServiceStatusBadge status={order.status} /> : null} />
      {!order ? <div className="flex flex-1 items-center justify-center"><Spinner /></div> : (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 no-scrollbar">
            <SystemLine>Échangez par message. {isAdmin ? "Vous gérez cette commande." : "L'équipe ADF vous répond."}</SystemLine>
            {msgs.map((m) => <Bubble key={m.id} m={m} mine={isAdmin ? m.sender_role === "admin" : m.sender_role === "user"} />)}
            {busy && <div className="flex justify-end"><div className="rounded-2xl bg-slate-100 px-3 py-2"><span className="dot inline-block h-1.5 w-1.5 rounded-full bg-muted" /><span className="dot mx-1 inline-block h-1.5 w-1.5 rounded-full bg-muted" /><span className="dot inline-block h-1.5 w-1.5 rounded-full bg-muted" /></div></div>}
          </div>
          {!isAdmin && invoice && order.status !== "completed" && (
            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted">Facture à régler</p><p className="text-lg font-extrabold text-base">{fmtCFA(invoice.metadata?.amount)}</p></div>
                {pendingProof ? <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">Preuve en attente</span> : <Button onClick={() => setPaySheet(true)}><WalletIcon className="h-4 w-4" /> Payer</Button>}
              </div>
            </div>
          )}
          {hasFinal && <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3"><p className="text-xs text-emerald-700">Service livré</p></div>}
          {isAdmin && <AdminBar order={order!} pendingProof={pendingProof} onUpdate={updateStatus} orderId={id} onDone={load} userId={profile!.id} />}
          <div className="safe-bottom border-t border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); }} />
              <button onClick={() => fileRef.current?.click()} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-base-soft"><PaperclipIcon className="h-5 w-5" /></button>
              <Input className="flex-1" placeholder="Message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
              <button onClick={() => send()} disabled={busy} className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white"><SendIcon className="h-5 w-5" /></button>
            </div>
          </div>
        </>
      )}
      {paySheet && order && invoice && <PaySheet onClose={() => setPaySheet(false)} amount={Number(invoice.metadata?.amount || 0)} methods={methods} orderCode={order.order_code} orderId={id} userId={profile!.id} onSent={() => { setPaySheet(false); toast({ type: "success", msg: "Preuve envoyée." }); load(); }} />}
    </div>
  );
}

const STATUS_SYS: Record<string, string> = { reviewing: "Votre commande est en examen.", approved: "Commande approuvée.", invoiced: "Facture émise. Veuillez régler.", sample_sent: "Échantillon envoyé.", completed: "Service terminé et livré.", rejected: "Commande rejetée.", cancelled: "Commande annulée." };

function SystemLine({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center"><span className="rounded-full bg-slate-100 px-3 py-1 text-center text-[11px] text-muted">{children}</span></div>;
}

function Bubble({ m, mine }: { m: OrderMessage; mine: boolean }) {
  if (m.sender_role === "system") return <SystemLine>{m.content}</SystemLine>;
  if (m.kind === "invoice") return <div className={cn("flex", mine ? "justify-end" : "justify-start")}><div className="max-w-[80%] rounded-2xl border border-amber-200 bg-amber-50 p-3"><div className="mb-1 flex items-center gap-1.5 text-amber-700"><ReceiptIcon className="h-4 w-4" /><span className="text-xs font-semibold">Facture</span></div><p className="text-lg font-bold text-base">{fmtCFA(m.metadata?.amount)}</p>{m.content && <p className="mt-1 text-xs text-muted">{m.content}</p>}</div></div>;
  if (m.kind === "sample" || m.kind === "final") return <div className={cn("flex", mine ? "justify-end" : "justify-start")}><div className="max-w-[80%] rounded-2xl border border-accent-200 bg-accent-50 p-3"><div className="mb-2 flex items-center gap-1.5 text-accent-700"><DownloadIcon className="h-4 w-4" /><span className="text-xs font-semibold">{m.kind === "final" ? "Service final livré" : "Échantillon"}</span></div>{m.file_url && <img src={m.file_url} alt="" className="max-h-48 rounded-xl object-cover" />}{m.content && <p className="mt-2 text-xs text-muted">{m.content}</p>}{m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block"><Button size="sm"><DownloadIcon className="h-4 w-4" /> Télécharger</Button></a>}</div></div>;
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className="max-w-[80%]">
        {!mine && <div className="mb-1 flex items-center gap-1 pl-1 text-[10px] text-muted">{m.sender_role === "admin" ? <BotIcon className="h-3 w-3" /> : null}{m.sender_role === "admin" ? "ADF" : "Vous"}</div>}
        <div className={cn("rounded-2xl px-3.5 py-2.5 text-sm", mine ? "gradient-brand text-white" : "bg-slate-100 text-base-soft")}>
          {m.file_url && /\.(png|jpe?g|webp|gif)/i.test(m.file_url) ? <img src={m.file_url} alt="" className="max-h-48 rounded-xl object-cover" /> : m.file_url ? <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-accent-600"><FileIcon className="h-4 w-4" /> Fichier</a> : <span className="whitespace-pre-wrap">{m.content}</span>}
        </div>
        <div className={cn("mt-0.5 text-[10px] text-muted", mine ? "text-right" : "pl-1")}>{timeShort(m.created_at)}</div>
      </div>
    </div>
  );
}

function PaySheet({ onClose, amount, methods, orderCode, orderId, userId, onSent }: { onClose: () => void; amount: number; methods: PaymentMethod[]; orderCode: string; orderId: string; userId: string; onSent: () => void }) {
  const toast = useToast(); const [file, setFile] = useState<File | null>(null); const [note, setNote] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async () => { if (!file) { toast({ type: "error", msg: "Téléversez la preuve." }); return; } setSaving(true); const up = await uploadFile(userId, file, "proofs"); if (!up) { toast({ type: "error", msg: "Échec." }); setSaving(false); return; }
    await supabase.from("payment_proofs").insert({ order_code: orderCode, order_type: "service", user_id: userId, amount, file_url: up.url, note: note.trim(), status: "pending" });
    await supabase.from("order_messages").insert({ order_id: orderId, sender_role: "user", kind: "file", content: "Preuve envoyée.", file_url: up.url });
    await supabase.from("order_messages").insert({ order_id: orderId, sender_role: "system", kind: "text", content: "Preuve téléversée. En attente de validation." });
    setSaving(false); onSent(); };
  return (
    <Sheet open onClose={onClose} title="Régler la facture">
      <div className="space-y-4">
        <div className="rounded-2xl bg-accent-50 border border-accent-100 p-3 text-center"><p className="text-xs text-accent-600">Montant à payer</p><p className="text-2xl font-extrabold text-base">{fmtCFA(amount)}</p></div>
        <div><p className="mb-2 text-xs font-semibold text-muted">Méthodes de paiement</p>
          {methods.length === 0 && <p className="text-sm text-muted">Aucune méthode configurée.</p>}
          <div className="space-y-2">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><PaymentIcon type={m.type} className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-base-soft">{m.name} <span className="text-muted">· {PAYMENT_LABELS[m.type]}</span></p>{m.holder && <p className="text-xs text-muted">{m.holder}</p>}
                  <div className="flex items-center gap-1"><p className="text-sm font-mono text-base">{m.number}</p><button onClick={() => { navigator.clipboard?.writeText(m.number); toast({ type: "success", msg: "Copié." }); }} className="text-accent-500"><CopyIcon className="h-3.5 w-3.5" /></button></div></div>
              </div>
            ))}
          </div>
        </div>
        <div><label className="mb-1.5 block text-xs font-semibold text-muted">Preuve de paiement</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500"><UploadIcon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1 text-sm text-base-soft">{file ? file.name : "Téléverser la preuve"}</span>
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <Input placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button full size="lg" loading={saving} onClick={submit}>J'ai payé — envoyer la preuve</Button>
      </div>
    </Sheet>
  );
}

function AdminBar({ order, pendingProof, onUpdate, orderId, onDone, userId }: { order: ServiceOrder; pendingProof?: PaymentProof; onUpdate: (s: ServiceStatus) => void; orderId: string; onDone: () => void; userId: string }) {
  const toast = useToast(); const [amount, setAmount] = useState(""); const [invoiceOpen, setInvoiceOpen] = useState(false); const sampleRef = useRef<HTMLInputElement>(null); const finalRef = useRef<HTMLInputElement>(null);
  const sendInvoice = async () => { const amt = Number(amount); if (!amt) { toast({ type: "error", msg: "Entrez un montant." }); return; }
    await supabase.from("order_messages").insert({ order_id: orderId, sender_role: "admin", kind: "invoice", content: "Facture pour votre commande.", metadata: { amount: amt } });
    await supabase.from("service_orders").update({ status: "invoiced" }).eq("id", orderId); setInvoiceOpen(false); setAmount(""); toast({ type: "success", msg: "Facture envoyée." }); onDone(); };
  const sendDeliverable = async (file: File, kind: "sample" | "final") => { const up = await uploadFile(userId, file, kind === "final" ? "final" : "samples"); if (!up) { toast({ type: "error", msg: "Échec." }); return; }
    await supabase.from("order_messages").insert({ order_id: orderId, sender_role: "admin", kind, content: kind === "final" ? "Service finalisé." : "Échantillon pour validation.", file_url: up.url });
    if (kind === "final") await supabase.from("service_orders").update({ status: "completed" }).eq("id", orderId); else await supabase.from("service_orders").update({ status: "sample_sent" }).eq("id", orderId);
    toast({ type: "success", msg: kind === "final" ? "Livré." : "Échantillon envoyé." }); onDone(); };
  const approveProof = async () => { if (!pendingProof) return; await supabase.from("payment_proofs").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", pendingProof.id);
    await supabase.from("order_messages").insert({ order_id: orderId, sender_role: "system", kind: "text", content: "Paiement validé." }); toast({ type: "success", msg: "Paiement validé." }); onDone(); };
  const s = order.status;
  return (
    <div className="border-t border-slate-200 bg-white px-3 py-2">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {s === "pending" && <Button size="sm" onClick={() => onUpdate("reviewing")}>Examiner</Button>}
        {(s === "reviewing" || s === "pending") && <><Button size="sm" variant="secondary" onClick={() => onUpdate("approved")}>Approuver</Button><Button size="sm" variant="danger" onClick={() => onUpdate("rejected")}>Rejeter</Button></>}
        <Button size="sm" variant="outline" onClick={() => setInvoiceOpen((v) => !v)}><ReceiptIcon className="h-4 w-4" /> Facturer</Button>
        {pendingProof && <Button size="sm" onClick={approveProof}><CheckIcon className="h-4 w-4" /> Valider</Button>}
        <Button size="sm" variant="secondary" onClick={() => sampleRef.current?.click()}>Échantillon</Button>
        <Button size="sm" onClick={() => finalRef.current?.click()}>Livrer</Button>
        {s !== "completed" && <Button size="sm" variant="ghost" onClick={() => onUpdate("completed")}>Terminer</Button>}
      </div>
      {invoiceOpen && <div className="mt-2 flex items-center gap-2"><Input type="number" placeholder="Montant FCFA" className="h-9" value={amount} onChange={(e) => setAmount(e.target.value)} /><Button size="sm" onClick={sendInvoice}>Envoyer</Button></div>}
      <input ref={sampleRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendDeliverable(f, "sample"); e.currentTarget.value = ""; }} />
      <input ref={finalRef} type="file" accept="image/*,application/pdf,.zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendDeliverable(f, "final"); e.currentTarget.value = ""; }} />
    </div>
  );
}
