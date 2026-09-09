import { QueryClient } from "@tanstack/react-query";

/** Creates an isolated query cache for a browser session or one prerender. */
export function createStorefrontQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        retry: 1,
        staleTime: 30_000,
      },
    },
  });
}
