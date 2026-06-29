import { supabase } from "./supabase";
import type { Service, Product } from "./types";

export interface AiMsg {
  role: "user" | "assistant";
  content: string;
}

export interface AiConfigResp {
  provider: string;
  api_key: string;
  base_url: string;
  model: string;
  system_prompt: string;
  temperature: number;
  ai_enabled: boolean;
}

export interface AiContext {
  services: Service[];
  products: Product[];
}

export async function fetchAiConfig(): Promise<AiConfigResp | null> {
  const { data, error } = await supabase.rpc("get_active_ai_config");
  if (error || !data || (data as any[]).length === 0) return null;
  return (data as any[])[0] as AiConfigResp;
}

/** Appel au provider IA configuré. Priorité : Groq → Gemini → OpenAI/Claude → custom. */
async function callProvider(
  history: AiMsg[],
  cfg: AiConfigResp
): Promise<string> {
  const sys = cfg.system_prompt || "Tu es ADF IA, assistant de l'agence digitale ADF.";
  const temp = Number(cfg.temperature ?? 0.7);
  const recent = history.slice(-16);

  const provider = cfg.provider?.toLowerCase() || "";

  // —— Groq (OpenAI-compatible endpoint) ——
  if (provider === "groq") {
    const base = cfg.base_url || "https://api.groq.com/openai";
    const model = cfg.model || "llama-3.3-70b-versatile";
    const url = `${base.replace(/\/$/, "")}/v1/chat/completions`;
    const body = {
      model,
      temperature: temp,
      messages: [
        { role: "system", content: sys },
        ...recent.map((m) => ({ role: m.role, content: m.content })),
      ],
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.api_key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Groq vide");
    return text.trim();
  }

  // —— Gemini ——
  if (provider === "gemini") {
    const model = cfg.model || "gemini-2.0-flash";
    const base = cfg.base_url || "https://generativelanguage.googleapis.com";
    const url = `${base.replace(/\/$/, "")}/v1beta/models/${model}:generateContent?key=${cfg.api_key}`;
    const body = {
      systemInstruction: { parts: [{ text: sys }] },
      contents: recent.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: temp },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = await res.json();
    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join("") ?? "";
    if (!text) throw new Error("Gemini vide");
    return text.trim();
  }

  // —— Claude ——
  if (provider === "claude") {
    const model = cfg.model || "claude-3-5-sonnet-latest";
    const base = cfg.base_url || "https://api.anthropic.com";
    const url = `${base.replace(/\/$/, "")}/v1/messages`;
    const body = {
      model,
      max_tokens: 1024,
      temperature: temp,
      system: sys,
      messages: recent
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.api_key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Claude ${res.status}`);
    const json = await res.json();
    const text = json?.content?.map((c: any) => c.text).join("") ?? "";
    if (!text) throw new Error("Claude vide");
    return text.trim();
  }

  // —— OpenAI / custom (fallback compatible) ——
  {
    const base = cfg.base_url || "https://api.openai.com";
    const model = cfg.model || "gpt-4o-mini";
    const url = `${base.replace(/\/$/, "")}/v1/chat/completions`;
    const body = {
      model,
      temperature: temp,
      messages: [
        { role: "system", content: sys },
        ...recent.map((m) => ({ role: m.role, content: m.content })),
      ],
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.api_key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${provider} ${res.status}`);
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error(`${provider} vide`);
    return text.trim();
  }
}

/** Génère une réponse en ligne (via provider API) ou en mode local. */
export async function generateReply(
  history: AiMsg[],
  config: AiConfigResp | null,
  ctx: AiContext
): Promise<{ text: string; source: "online" | "local" }> {
  if (config && config.ai_enabled && config.api_key && config.provider) {
    try {
      const text = await callProvider(history, config);
      return { text, source: "online" };
    } catch {
      // fallback to local
    }
  }
  return { text: localReply(history, ctx), source: "local" };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Assistant local intelligent — couvre services, boutique, commandes, paiement, raccourcis. */
export function localReply(history: AiMsg[], ctx: AiContext): string {
  const last = (history[history.length - 1]?.content || "").toLowerCase();
  const has = (...k: string[]) => k.some((w) => last.includes(w));

  const svcList = ctx.services.map((s) => `• ${s.name} — dès ${s.base_price?.toLocaleString("fr-FR")} FCFA`).join("\n");
  const prdList = ctx.products.slice(0, 8).map((p) => `• ${p.name} — ${p.price?.toLocaleString("fr-FR")} FCFA`).join("\n");

  if (has("bonjour", "salut", "bonsoir", "hello", "coucou", "cc")) {
    return pick([
      "Bonjour 👋 Je suis ADF IA, l'assistant d'ADF — Arafat Digital Futurist. Je peux vous présenter nos services, vous aider à commander ou explorer la boutique. Que souhaitez-vous faire ?",
      "Salut ! Bienvenue chez ADF. Dites-moi ce dont vous avez besoin : un logo, un site web, un produit dans la boutique…",
    ]);
  }
  if (has("service", "prestation", "proposez", "offrez", "faite", "creer")) {
    return `Voici nos services créatifs :\n${svcList}\n\nPour commander, ouvrez l'onglet « Services », choisissez une prestation et décrivez votre besoin. L'équipe examine puis vous envoie une facture.`;
  }
  if (has("logo", "identité", "branding", "marque")) {
    return "Nous créons des logos professionnels uniques (PNG, SVG, PDF) dès 15 000 FCFA. Allez dans « Services » → « Création de logo » pour commander. Besoin d'une identité complète ? Nous faisons aussi les chartes graphiques.";
  }
  if (has("carte", "visite", "flyer", "affiche")) {
    return "Cartes de visite (dès 8 000 FCFA) et flyers/affiches (dès 10 000 FCFA) sont disponibles. Rendez-vous dans « Services ».";
  }
  if (has("site", "web", "landing", "page", "ui", "ux", "design")) {
    return "Nous concevons des sites web, landing pages et maquettes UI/UX professionnelles. Pour un site vitrine comptez ~90 000 FCFA, UI/UX ~60 000 FCFA. Commandez dans « Services ».";
  }
  if (has("video", "montage", "motion")) {
    return "Montage vidéo et motion design disponibles dès 50 000 FCFA — onglet « Services ».";
  }
  if (has("command", "commander", "passer", "demander")) {
    return "Pour commander : 1) Onglet « Services » 2) Choisissez une prestation 3) Décrivez votre besoin et budget 4) Envoyez. L'admin fixe une facture, vous payez, puis recevez votre livrable dans « Mes commandes ».";
  }
  if (has("boutique", "produit", "acheter", "magasin", "shop", "store")) {
    return ctx.products.length
      ? `Notre boutique digitale :\n${prdList}\n\nPaiement manuel (Mobile Money, Orange Money…). Payez, téléversez la preuve, l'admin valide et vous recevez le produit.`
      : "La boutique sera alimentée par l'administrateur. Revenez bientôt !";
  }
  if (has("paye", "paiement", "payer", "mobile money", "orange", "mtn", "wave", "moov")) {
    return "Paiement manuel et sécurisé : payez au numéro indiqué dans la facture (Mobile Money, Orange Money, Wave, PayPal…), téléversez la capture d'écran dans la messagerie de votre commande. L'admin approuve et livre.";
  }
  if (has("facture", "prix", "tarif", "coûte", "combien", "cher", "budget")) {
    return "Chaque projet est devisé selon votre besoin. Après votre demande, l'admin fixe un montant visible dans « Mes commandes ». Les prix de la boutique sont affichés directement.";
  }
  if (has("suivi", "statut", "commande", "avancement")) {
    return "Le suivi se fait dans « Mes commandes ». Vous y voyez l'état de chaque commande et pouvez échanger avec l'équipe ADF.";
  }
  if (has("merci", "thanks", "gracias")) {
    return pick(["Avec plaisir 🙏 Besoin d'autre chose ?", "Je vous en prie ! Bonne journée chez ADF."]);
  }
  if (has("qui", "adf", "arafat", "pdg", "garga")) {
    return "ADF — Arafat Digital Futurist est une agence digitale dirigée par son PDG, M. Arafat Garga. Nous accompagnons marques et entrepreneurs : branding, design, contenu et solutions web.";
  }
  if (has("ia", "intelligence", "robot", "tu es")) {
    return "Je suis ADF IA, assistant intégré à la plateforme. Je fonctionne en ligne (via Groq, Gemini, Claude…) quand l'admin a configuré une clé API, et en mode local intelligent sinon. Je peux vous aider 24h/24.";
  }
  if (has("contact", "support", "aide", "help")) {
    return "Pour contacter l'équipe, passez par une commande de service et échangez dans la messagerie. Ou écrivez à l'admin via la plateforme.";
  }
  return pick([
    "Je peux vous aider à explorer nos services, passer commande ou acheter dans la boutique. Dites-moi ce que vous cherchez.",
    "Bonne question ! Allez dans « Services » pour commander, ou « Boutique » pour acheter. Je peux détailler n'importe quelle prestation.",
    "Je suis là pour vous guider. Décrivez votre projet (logo, carte, site…) et je vous oriente vers la bonne commande.",
  ]);
}

export const AI_SUGGESTIONS = [
  "Quels services proposez-vous ?",
  "Comment passer une commande ?",
  "Comment fonctionne le paiement ?",
  "Présentez la boutique",
  "Création d'un logo professionnel",
  "Qui est derrière ADF ?",
];
