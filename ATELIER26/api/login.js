import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Cette fonction tourne sur le serveur de Vercel, jamais dans le navigateur.
// Le mot de passe ADMIN_PASSWORD n'est donc jamais visible dans le code du site.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const ip = getClientIp(req);
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  const now = Date.now();

  const { data: existing } = await supabase
    .from("nolabel26_login_attempts")
    .select("*")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  let record = existing;
  if (!record) {
    record = { ip_hash: ipHash, count: 0, first_attempt: new Date(now).toISOString() };
  } else if (now - new Date(record.first_attempt).getTime() > LOCK_WINDOW_MS) {
    // La fenêtre de blocage est expirée : on repart sur un compteur propre
    record = { ip_hash: ipHash, count: 0, first_attempt: new Date(now).toISOString() };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryInMin = Math.max(
      1,
      Math.ceil((LOCK_WINDOW_MS - (now - new Date(record.first_attempt).getTime())) / 60000)
    );
    res.status(429).json({ ok: false, error: `Trop de tentatives. Réessaie dans ${retryInMin} min.` });
    return;
  }

  const body = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminPassword || !secret) {
    res.status(500).json({ ok: false, error: "Le serveur n'est pas configuré (variables manquantes)." });
    return;
  }

  if (body.password !== adminPassword) {
    record.count += 1;
    await supabase.from("nolabel26_login_attempts").upsert(record);
    const remaining = MAX_ATTEMPTS - record.count;
    const msg =
      remaining > 0
        ? `Mot de passe incorrect. ${remaining} tentative(s) restante(s).`
        : `Trop de tentatives. Réessaie dans ${Math.ceil(LOCK_WINDOW_MS / 60000)} min.`;
    res.status(401).json({ ok: false, error: msg });
    return;
  }

  // Bon mot de passe : on efface le compteur d'échecs pour cette IP
  await supabase.from("nolabel26_login_attempts").delete().eq("ip_hash", ipHash);

  // Jeton valable 4 heures, signé côté serveur — impossible à fabriquer sans le secret
  const expiry = now + 1000 * 60 * 60 * 4;
  const payload = `${expiry}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}.${signature}`).toString("base64");

  res.status(200).json({ ok: true, token });
}
