import { useEffect, useState } from "react";
import { dashboardService, type DashboardResponse } from "@/services/dashboardService";

export const useDashboard = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return { data, loading, refetch: fetchDashboard };
};