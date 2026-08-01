export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
}

const SESSION_KEY = "cizhi.supabase.session.v1";

function config() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return { url, key, configured: Boolean(url && key) };
}

function saveSession(session: SupabaseSession | null) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else {
    const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, expires_at: expiresAt }));
  }
  window.dispatchEvent(new CustomEvent("cizhi-auth-change"));
}

function readSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

async function parseError(response: Response): Promise<Error> {
  let message = `Request failed (${response.status})`;
  try {
    const data = await response.json();
    message = data.msg || data.message || data.error_description || data.error || message;
  } catch {
    // Keep default message.
  }
  return new Error(message);
}

async function authRequest(path: string, init: RequestInit = {}) {
  const { url, key, configured } = config();
  if (!configured) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: key!,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) throw await parseError(response);
  return response.status === 204 ? null : response.json();
}

async function refreshSession(session: SupabaseSession): Promise<SupabaseSession | null> {
  try {
    const data = await authRequest("/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    saveSession(data as SupabaseSession);
    return data as SupabaseSession;
  } catch {
    saveSession(null);
    return null;
  }
}

export const supabaseClient = {
  isConfigured(): boolean {
    return config().configured;
  },

  getStoredSession(): SupabaseSession | null {
    return readSession();
  },

  async getValidSession(): Promise<SupabaseSession | null> {
    const session = readSession();
    if (!session) return null;
    const expiresAt = session.expires_at ?? 0;
    if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session;
    return refreshSession(session);
  },

  async signUp(email: string, password: string): Promise<{ session: SupabaseSession | null; user: SupabaseUser | null }> {
    const data = await authRequest("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const session = (data?.access_token ? data : data?.session) as SupabaseSession | null;
    if (session) saveSession(session);
    return { session, user: (data?.user || session?.user || null) as SupabaseUser | null };
  },

  async signIn(email: string, password: string): Promise<SupabaseSession> {
    const data = (await authRequest("/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })) as SupabaseSession;
    saveSession(data);
    return data;
  },

  async signOut(): Promise<void> {
    const session = readSession();
    if (session) {
      try {
        await authRequest("/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {
        // Clear locally even when the network is unavailable.
      }
    }
    saveSession(null);
  },

  async resetPassword(email: string): Promise<void> {
    await authRequest("/recover", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async rest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { url, key, configured } = config();
    if (!configured) throw new Error("Supabase is not configured.");
    const session = await this.getValidSession();
    if (!session) throw new Error("You must sign in first.");
    const response = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: key!,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  },
};
