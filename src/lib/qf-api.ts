import { cookies } from "next/headers";

/** Get stored access token and client ID for QF API calls */
export async function getQFHeaders(): Promise<Record<string, string> | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("qf_access_token")?.value;
  const clientId = process.env.QF_CLIENT_ID;

  if (!accessToken || !clientId) return null;

  return {
    "x-auth-token": accessToken,
    "x-client-id": clientId,
    "Content-Type": "application/json",
  };
}

const QF_API = process.env.QF_API_BASE || "https://apis.quran.foundation/auth/v1";

/** Proxy a GET request to QF User APIs */
export async function qfGet(path: string) {
  const headers = await getQFHeaders();
  if (!headers) throw new Error("Not authenticated with QF");

  const res = await fetch(`${QF_API}${path}`, { headers, cache: "no-store" });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QF API ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Proxy a POST request to QF User APIs */
export async function qfPost(path: string, body: unknown) {
  const headers = await getQFHeaders();
  if (!headers) throw new Error("Not authenticated with QF");

  const res = await fetch(`${QF_API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QF API POST ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Proxy a PATCH request to QF User APIs */
export async function qfPatch(path: string, body: unknown) {
  const headers = await getQFHeaders();
  if (!headers) throw new Error("Not authenticated with QF");

  const res = await fetch(`${QF_API}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QF API PATCH ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}
