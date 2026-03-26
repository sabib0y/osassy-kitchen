import { useQuery } from '@tanstack/react-query';

export type ReportType = 'revenue' | 'orders' | 'subscriptions';
export type ReportPeriod = 'week' | 'month' | 'year';

export interface ReportSummary {
  total: number;
  average: number;
  change: number;
  changePercent: number;
}

export interface TrendDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

export interface BreakdownItem {
  label: string;
  value: number;
  percentage: number;
}

export interface ReportData {
  type: ReportType;
  period: ReportPeriod;
  dateRange: {
    start: string;
    end: string;
  };
  summary: ReportSummary;
  trend: TrendDataPoint[];
  breakdown: BreakdownItem[];
}

export function useReports(type: ReportType, period: ReportPeriod) {
  return useQuery({
    queryKey: ['reports', type, period],
    queryFn: async (): Promise<ReportData> => {
      const params = new URLSearchParams({ type, period });
      const response = await fetch(`/api/admin/reports?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
