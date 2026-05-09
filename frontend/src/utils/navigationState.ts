const RETURN_PATHS = ["/start", "/main", "/archive", "/form", "/login"] as const;

export type ReturnPath = (typeof RETURN_PATHS)[number];

export interface ReturnLocationState {
  from?: ReturnPath;
}

export const getReturnPath = (
  state: unknown,
  fallback: ReturnPath = "/start",
): ReturnPath => {
  const from = (state as ReturnLocationState | null)?.from;
  return RETURN_PATHS.includes(from as ReturnPath) ? (from as ReturnPath) : fallback;
};

export const createReturnState = (from: ReturnPath): ReturnLocationState => ({
  from,
});
