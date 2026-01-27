import { z } from 'zod';

export const manualEntrySchema = z
  .object({
    startedAt: z.string().min(1, 'Start time is required'),
    stoppedAt: z.string().min(1, 'Stop time is required'),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startedAt);
      const stop = new Date(data.stoppedAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(stop.getTime())) return false;
      return start < stop;
    },
    {
      message: 'Start time must be before stop time.',
      path: ['stoppedAt'],
    }
  );

export type ManualEntryFormData = z.infer<typeof manualEntrySchema>;
