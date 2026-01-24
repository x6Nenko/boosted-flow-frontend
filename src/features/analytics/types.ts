export type AnalyticsQuery = {
  activityId?: string;
  from?: string;
  to?: string;
};

export type AnalyticsData = {
  totalTimeMs: number;
  averageSessionMs: number;
  sessionCount: number;
  averageRating: number | null;
  ratedSessionCount: number;
  timeByActivity: Record<string, number>;
  peakHours: Record<number, number>;
  totalDistractions: number;
  averageDistractions: number;
};
