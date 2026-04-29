// app/composables/useAdmin.ts
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../plugins/firebase.client";

export const useAdmin = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase as string;

  // ─── Récupère le user Firebase avec le bon type ───────────────
  const getCurrentUser = (): Promise<User | null> => {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
      const off = onAuthStateChanged(auth, (user) => {
        off();
        resolve(user);
      });
    });
  };

  // ─── Headers avec token Firebase ─────────────────────────────
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Utilisateur non connecté");

    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      "x-user-id": user.uid,
      "Content-Type": "application/json",
    };
  };

  // ─── Vérification mot de passe admin (SANS Firebase Auth) ─────
  // Cette route utilise @SkipAdminCheck() donc pas besoin de token
  const verifyAdminPassword = async (password: string): Promise<{ valid: boolean }> => {
    return $fetch<{ valid: boolean }>(`${apiBase}/admin/verify-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { password },
    });
  };

  // ─── Dashboard ────────────────────────────────────────────────
  const fetchDashboardStats = async () => {
    const headers = await getAuthHeaders();
    return $fetch(`${apiBase}/admin/dashboard/stats`, { headers });
  };

  const fetchRecentPayments = async () => {
    const headers = await getAuthHeaders();
    return $fetch(`${apiBase}/admin/payments/recent`, { headers });
  };

  const fetchTopUsers = async () => {
    const headers = await getAuthHeaders();
    return $fetch(`${apiBase}/admin/users/top`, { headers });
  };

  // ─── Users ────────────────────────────────────────────────────
  const fetchUsersStats = async () => {
    const headers = await getAuthHeaders();
    return $fetch(`${apiBase}/admin/users/stats`, { headers });
  };

  const fetchUsers = async (
    page = 1,
    limit = 20,
    search = "",
    plan = "all",
  ) => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    if (plan && plan !== "all") params.append("plan", plan);
    return $fetch(`${apiBase}/admin/users?${params.toString()}`, { headers });
  };

  // ─── Payments ─────────────────────────────────────────────────
  const fetchPaymentsStats = async () => {
    const headers = await getAuthHeaders();
    return $fetch(`${apiBase}/admin/payments/stats`, { headers });
  };

  const fetchPayments = async (
    page = 1,
    limit = 20,
    status = "all",
    tab = "all",
  ) => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status && status !== "all") params.append("status", status);
    if (tab && tab !== "all") params.append("tab", tab);
    return $fetch(`${apiBase}/admin/payments?${params.toString()}`, { headers });
  };

  return {
    fetchDashboardStats,
    fetchRecentPayments,
    fetchTopUsers,
    fetchUsersStats,
    fetchUsers,
    fetchPaymentsStats,
    fetchPayments,
    verifyAdminPassword,
  };
};