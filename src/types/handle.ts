export type Timer = ReturnType<typeof setTimeout>;

export type HandleAvailabilityResponse = {
  available: boolean;
  error?: string;
}; 