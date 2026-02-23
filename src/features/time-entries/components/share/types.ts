export type ShareCardData = {
  activityName: string;
  date: string;
  timeRange: string;
  duration: string;
  rating: number | null;
  distractionCount: number;
};

export type ShareCardProps = {
  data: ShareCardData;
};
