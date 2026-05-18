import { cookies } from "next/headers";

/** Get stored access token and client ID for QF API calls */
export async function getQFHeaders(): Promise<Record<string, string> | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("qf_access_token")?.value;
  const clientId = process.env.QF_CLIENT_ID;

  if (!accessToken || !clientId) return null;

  return {
    "Authorization": `Bearer ${accessToken}`,
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

// ── Specific API Helpers ──

const QF_BASE_API = process.env.QF_API_BASE 
  ? process.env.QF_API_BASE.replace('/auth/v1', '') 
  : "https://apis.quran.foundation";

/** Proxy a request with dynamic base */
async function qfRequest(path: string, options: RequestInit = {}) {
  const headers = await getQFHeaders();
  if (!headers) throw new Error("Not authenticated with QF");

  // Add x-timezone for streak/activity calculations
  const tzHeaders = {
    ...headers,
    "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  const res = await fetch(`${QF_BASE_API}${path}`, {
    ...options,
    headers: tzHeaders,
    cache: "no-store",
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QF API ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Sync activity to QF */
export async function syncActivityDay(seconds: number, date: string) {
  return qfRequest(`/v1/activity-days`, {
    method: "POST",
    body: JSON.stringify({
      date,
      seconds,
      type: "QURAN",
    }),
  });
}

/** Get official QF streak */
export async function getCurrentStreak() {
  return qfRequest(`/v1/streaks/current-streak-days?type=QURAN`);
}

/** Get joined rooms for competitions */
export async function getJoinedRooms() {
  // Quran Reflect Rooms API
  return qfRequest(`/quran-reflect/v1/rooms/joined-rooms`);
}

/** Create a new competition room */
export async function createRoom(name: string, description: string = "", isPublic: boolean = false) {
  const url = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);
  return qfRequest(`/quran-reflect/v1/rooms/groups`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      url,
      isPublic,
    }),
  });
}

/** Get members of a room (Leaderboard) */
export async function getRoomMembers(roomId: string | number) {
  return qfRequest(`/quran-reflect/v1/rooms/${roomId}/members`);
}

/** Search for public groups */
export async function searchRooms(query: string, page = 1, limit = 10, roomType = 'GROUP') {
  const q = encodeURIComponent(query);
  return qfRequest(`/quran-reflect/v1/rooms/groups/search?q=${q}&page=${page}&limit=${limit}&roomType=${roomType}`);
}

/** Join a specific group */
export async function joinRoom(roomId: string | number) {
  return qfRequest(`/quran-reflect/v1/rooms/groups/${roomId}/join`, {
    method: "POST"
  });
}
