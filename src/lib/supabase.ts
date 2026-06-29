import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error(
    "[ADF] Variables d'environnement Supabase manquantes. Créez un fichier .env avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(url ?? "", anon ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Bucket de stockage public (fichiers produits, échantillons, preuves de paiement). */
export const BUCKET = "adf";

export function publicUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload un fichier dans le bucket, sous le dossier de l'utilisateur. */
export async function uploadFile(
  userId: string,
  file: File,
  folder = "misc"
): Promise<{ path: string; url: string } | null> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${userId}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[ADF] upload error", error);
    return null;
  }
  return { path, url: publicUrl(path) };
}
