export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isTransientFetchError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Load failed')
  );
}

export async function withNetworkRetry<T>(
  operation: () => PromiseLike<T>,
  retries = 1,
  delayMs = 1200
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isTransientFetchError(error)) {
      await sleep(delayMs);
      return withNetworkRetry(operation, retries - 1, delayMs);
    }
    throw error;
  }
}
