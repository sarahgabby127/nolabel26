import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyToken(token, secret) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [expiryStr, signature] = decoded.split(".");
    if (!expiryStr || !signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(expiryStr).digest("hex");
    if (signature !== expected) return false;
    if (Date.now() > Number(expiryStr)) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // Lecture du catalogue : publique, tout le monde peut voir les produits
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("nolabel26_catalog")
      .select("products")
      .eq("id", "main")
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data?.products || []);
    return;
  }

  // Écriture (ajout / modification / suppression) : jeton valide obligatoire
  if (req.method === "PUT") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace("Bearer ", "");
    const secret = process.env.SESSION_SECRET;

    if (!secret || !verifyToken(token, secret)) {
      res.status(401).json({ ok: false, error: "Non autorisé." });
      return;
    }

    const products = req.body;
    const { error } = await supabase
      .from("nolabel26_catalog")
      .upsert({ id: "main", products, updated_at: new Date().toISOString() });

    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).send("Method Not Allowed");
}
