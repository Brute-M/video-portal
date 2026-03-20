import api from "./api";
import { ENDPOINTS } from "./endpoints";

export async function getSlugAmount(slug: string): Promise<number> {
  const safeSlug = String(slug || "").trim().toLowerCase();
  const response = await api.get(`${ENDPOINTS.INFLUENCER_LINKS}/amount/${encodeURIComponent(safeSlug)}`);
  const amount = response?.data?.data?.amount;
  return Number(amount);
}

