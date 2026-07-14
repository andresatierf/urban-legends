import { createStart } from "@tanstack/react-start";

// SPA / static-hosting build: there is no Node server handling requests, so we
// no longer register Clerk's server-side `requestMiddleware`. Auth is resolved
// entirely on the client via Clerk's React SDK (see `_protected` / `_auth`
// layouts), and Convex enforces auth on the backend. `startInstance` is still
// exported because the generated route tree references its options type.
export const startInstance = createStart(() => ({}));
