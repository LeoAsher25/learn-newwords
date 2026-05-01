import { getDueSetSummaries, getSets } from "@/lib/firestore";
import { DueSetSummary, SetItem } from "@/types";

export interface DashboardData {
  sets: SetItem[];
  dueSummaries: DueSetSummary[];
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [sets, dueSummaries] = await Promise.all([
    getSets(userId),
    getDueSetSummaries(userId),
  ]);

  return { sets, dueSummaries };
}
