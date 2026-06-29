import { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Input, Field, useToast } from "../components/ui";
import {
  MailIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  SparkIcon,
} from "../lib/icons";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      if (error) setErr(error);
      else toast({ type: "success", msg: "Connexion réussie !" });
    } else {
      if (!name.trim()) { setErr("Veuillez entrer votre nom complet."); setLoading(false); return; }
      const { error, needsConfirm } = await signUp(email.trim(), password, name.trim(), phone.trim());
      if (needsConfirm) setErr("Compte créé. Veuillez confirmer votre e-mail.");
      else if (error) setErr(error);
      else toast({ type: "success", msg: "Compte créé. Bienvenue chez ADF !" });
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-surface">
      {/* Header */}
      <div className="relative px-6 pt-16 pb-10 safe-top">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-accent-100/70 blur-3xl" />
          <div className="absolute -right-12 top-20 h-48 w-48 rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center text-center animate-slide-up">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl gradient-brand shadow-lg shadow-accent-500/25">
            <SparkIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base">
            ADF
          </h1>
          <p className="text-sm text-muted">
            Arafat Digital Futurist
          </p>
          <p className="mt-2 max-w-xs text-[13px] text-muted/80 leading-relaxed">
            Services créatifs, boutique digitale et assistant IA — tout dans une seule application.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="mx-5 mb-8 card-glass rounded-3xl p-5 animate-slide-up">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(""); }}
              className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-white text-base shadow-sm"
                  : "text-muted"
              }`}
            >
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {mode === "register" && (
            <>
              <Field label="Nom complet">
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                  <Input className="pl-10" placeholder="Ex. Arafat Garga" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </Field>
              <Field label="Téléphone">
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                  <Input className="pl-10" placeholder="+229 ..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </Field>
            </>
          )}
          <Field label="Adresse e-mail">
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input type="email" required className="pl-10" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </Field>
          <Field label="Mot de passe">
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input type={show ? "text" : "password"} required minLength={6} className="pl-10 pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted/60">
                {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {err && (
            <p className="rounded-2xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600 border border-rose-200">
              {err}
            </p>
          )}

          <Button type="submit" full size="lg" loading={loading}>
            {mode === "login" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-accent-50/50 px-3 py-2.5 border border-accent-100">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
          <span className="text-[11px] text-accent-700/80 leading-snug">
            Le tout premier compte créé devient automatiquement <strong>administrateur</strong> de la plateforme.
          </span>
        </div>
      </div>

      <div className="mt-auto pb-8 text-center">
        <p className="text-[11px] text-muted/50">
          Conçue par le PDG d'ADF — M. Arafat Garga
        </p>
      </div>
    </div>
  );
}
