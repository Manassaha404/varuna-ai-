import { httpBatchLink } from "@repo/trpc/client";

function getBaseUrl() {
  // Server-side: prefer internal URL for container/SSR scenarios
  if (typeof window === "undefined") {
    if (process.env.INTERNAL_API_URL) {
      return process.env.INTERNAL_API_URL;
    }
    return process.env.NEXT_PUBLIC_API_URL?.replace("/trpc", "") || "";
  }

  // Browser: always use the public API URL
  return process.env.NEXT_PUBLIC_API_URL?.replace("/trpc", "") || "";
}

export const createTRPCLink = () =>
  httpBatchLink({
    url: `${getBaseUrl()}/trpc`,
    fetch(url, options) {
      return fetch(url, { ...options, credentials: "include" });
    },
  });
