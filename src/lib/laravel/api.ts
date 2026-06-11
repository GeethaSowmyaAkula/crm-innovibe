/**
 * Laravel API Client — InnoVibe Mobility Production
 * Base: https://api.innovibemobility.com/api
 * Auth: Auto-login with token caching (10 min TTL)
 */

const LARAVEL_API_URL = process.env.LARAVEL_API_URL!;
const LARAVEL_ADMIN_EMAIL = process.env.LARAVEL_ADMIN_EMAIL!;
const LARAVEL_ADMIN_PASSWORD = process.env.LARAVEL_ADMIN_PASSWORD!;

let cachedToken: string | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 9 * 60 * 1000;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() - tokenFetchedAt < TOKEN_TTL_MS) return cachedToken;
  const res = await fetch(`${LARAVEL_API_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: LARAVEL_ADMIN_EMAIL, password: LARAVEL_ADMIN_PASSWORD }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Laravel login failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.auth_token;
  tokenFetchedAt = Date.now();
  return cachedToken!;
}

async function laravelFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getToken();
  const url = new URL(`${LARAVEL_API_URL}/admin/${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  let res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 30 },
  });

  if (res.status === 401) {
    cachedToken = null;
    const fresh = await getToken();
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${fresh}`, Accept: "application/json" },
      next: { revalidate: 30 },
    });
  }

  if (!res.ok) throw new Error(`Laravel API error: ${res.status} ${path}`);
  return res.json();
}

/** Fetch ALL pages automatically */
async function fetchAllPages<T>(
  path: string,
  dataKey: string,
  perPage = 100
): Promise<T[]> {
  const first = await laravelFetch<any>(path, { per_page: String(perPage), page: "1" });
  const items: T[] = first.data?.[dataKey] ?? [];
  const totalPages: number = first.meta?.total_page ?? 1;

  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        laravelFetch<any>(path, { per_page: String(perPage), page: String(i + 2) })
          .then((r) => (r.data?.[dataKey] ?? []) as T[])
          .catch(() => [] as T[])
      )
    );
    rest.forEach((page) => items.push(...page));
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────
// TYPES & FETCHERS
// ─────────────────────────────────────────────────────────────────

export interface LaravelUser {
  id: number; name: string | null; mobile: string | null;
  email: string | null; country_code: string | null;
  gender: string | null; dob: string | null; profession: string | null;
  avatar: string | null; status: string;
  active_plan: { id: number; plan: { id: number; name: string; offer_price: string; regular_price: string }; start_date: string; end_date: string; status: string } | null;
  wallet_balance: number; created_at: string;
}
export const getUsers = () => fetchAllPages<LaravelUser>("users", "users");

export interface LaravelVehicle {
  id: number; user_id: number;
  brand: { id: number; name: string } | null;
  model: { id: number; name: string } | null;
  make_year: number | null; registration_number: string | null;
  purchase_date: number | null; current_odometer: number | null;
  average_range: string | null; insurance_provider: string | null;
  insurance_expire_date: string | null; vehicle_photos: string | null;
  status: string; created_at: number; owner_name?: string;
}
export async function getVehicles(): Promise<LaravelVehicle[]> {
  const users = await getUsers();
  const results = await Promise.all(
    users.map(async (u) => {
      try {
        const res = await laravelFetch<{ data: { vehicles: LaravelVehicle[] } }>(`users/${u.id}/vehicles`);
        return (res.data?.vehicles ?? []).map((v) => ({ ...v, owner_name: u.name ?? u.mobile ?? "Unknown" }));
      } catch { return []; }
    })
  );
  return results.flat();
}

export interface LaravelBooking {
  id: number;
  user?: { id: number; name: string | null; mobile: string } | null;
  service?: { id: number; title: string } | null;
  vehicle?: { id: number; registration_number: string | null; brand?: { name: string }; model?: { name: string } } | null;
  service_center?: { id: number; name: string } | null;
  issue: string; date: string | null; time: string | null;
  status: string; payment_status: string;
  booking_price: number | null; wallet_amount_used: number | null;
  reason: string | null;
  quotation?: { id: number; final_price: string; status: string } | null;
  created_at: string;
}
export const getBookings = () => fetchAllPages<LaravelBooking>("bookings", "bookings", 200);

export interface LaravelServiceCenter {
  id: number; name: string; address: string | null;
  city: string | null; state: string | null; mobile: string | null;
  email: string | null; lat: string | null; long: string | null;
  status: string; logo: string | null;
}
export const getServiceCenters = () => fetchAllPages<LaravelServiceCenter>("service-centers", "service_centers");

export interface LaravelBrand {
  id: number; name: string; logo: string | null; status: string;
}
export const getBrands = () => fetchAllPages<LaravelBrand>("brands", "brands");

export interface LaravelVehicleModel {
  id: number; brand_id: number;
  brand?: { id: number; name: string };
  name: string; release_year: number | null;
  description: string | null; status: string; image: string | null;
}
export const getVehicleModels = () => fetchAllPages<LaravelVehicleModel>("vehicle-model", "vehicle_models");

export interface LaravelService {
  id: number; title: string; slug: string;
  price: string; booking_price: string;
  description: string | null; image: string | null; status: string;
}
export async function getServices(): Promise<LaravelService[]> {
  const res = await laravelFetch<{ data: { services: LaravelService[] } }>("service", { per_page: "200" });
  return res.data?.services ?? [];
}

export interface LaravelServiceItem {
  id: number; service_item_id: number; vendor_id: number | null;
  name: string; gst: string; hsn_code: string | null;
  description: string | null; price: string; status: string;
  brand?: { id: number; name: string } | null;
  model?: { id: number; name: string } | null;
}
export async function getServiceItems(): Promise<LaravelServiceItem[]> {
  const res = await laravelFetch<{ data: { service_items: LaravelServiceItem[] } }>("service-items", { per_page: "200" });
  return res.data?.service_items ?? [];
}

export interface LaravelMembershipPlan {
  id: number; name: string; slug: string; duration: number;
  offer_price: string; regular_price: string; is_active: boolean;
  benefits?: { id: number; benefit: string }[];
}
export async function getMembershipPlans(): Promise<LaravelMembershipPlan[]> {
  const res = await laravelFetch<{ data: { plans: LaravelMembershipPlan[] } }>("plans", { per_page: "100" });
  return res.data?.plans ?? [];
}

export interface LaravelTransaction {
  id: number; txnid: string; payment_id: string | null;
  status: string; amount: number; payment_method: string | null;
  reference: string | null; refunded: boolean;
  refund_details?: { status: string | null; amount: string };
  user?: { id: number; name: string | null; mobile: string };
  created_at: string;
}
export async function getTransactions(): Promise<LaravelTransaction[]> {
  const res = await laravelFetch<{ data: { transactions: LaravelTransaction[] } }>("transactions", { per_page: "500" });
  return res.data?.transactions ?? [];
}

export interface LaravelCategory {
  id: number; name: string; slug: string;
  image: string | null; status: string;
}
export const getCategories = () => fetchAllPages<LaravelCategory>("categories", "categories");

export interface LaravelPost {
  id: number; title: string; slug: string;
  excerpt: string | null; content: string | null;
  image: string | null; status: string; created_at: string;
  category?: { id: number; name: string } | null;
}
export const getPosts = () => fetchAllPages<LaravelPost>("posts", "posts");

export interface LaravelAnnouncement {
  id: number; type: string; to: string;
  title: string | null; description: string;
  status: string; send_at: number | null; scheduled_at: number | null;
  attachment: string | null;
}
export async function getAnnouncements(): Promise<LaravelAnnouncement[]> {
  const res = await laravelFetch<{ data: { announcements: LaravelAnnouncement[] } }>("announcements", { per_page: "200" });
  return res.data?.announcements ?? [];
}

export interface LaravelRecommendation {
  id: number; title: string; description: string;
  benefit: string | null; status: string; created_at: number;
}
export async function getRecommendations(): Promise<LaravelRecommendation[]> {
  const res = await laravelFetch<{ data: { recommendations: LaravelRecommendation[] } }>("recommendations", { per_page: "200" });
  return res.data?.recommendations ?? [];
}

export interface LaravelOtp {
  id: number; receiver: string; otp: string;
  event: string; used_at: string | null;
  expired_at: string; created_at: string;
}
export async function getOtps(): Promise<LaravelOtp[]> {
  const res = await laravelFetch<{ data: { otps: LaravelOtp[] } }>("otps", { per_page: "200" });
  return res.data?.otps ?? [];
}

export interface LaravelIssueReport {
  id: number; user_id: number; title: string;
  description: string; screenshots: string[] | null;
  user?: { id: number; name: string | null; mobile: string };
  created_at: string;
}
export async function getIssueReports(): Promise<LaravelIssueReport[]> {
  const res = await laravelFetch<{ data: { issue_reports: LaravelIssueReport[] } }>("issue-reports", { per_page: "200" });
  return res.data?.issue_reports ?? [];
}
