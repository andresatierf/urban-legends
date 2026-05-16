import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { AppBackground } from "@/components/app-background";
import { ThemeScript } from "@/components/theme-script";
import { ThemeProvider } from "@/hooks/use-theme";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";

import appCss from "@/styles/globals.css?url";

const convexUrl = import.meta.env.NEXT_PUBLIC_CONVEX_URL as string | undefined;
if (!convexUrl) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL environment variable is required. Please add it to your .env.local file.",
  );
}

const convex = new ConvexReactClient(convexUrl, { verbose: true });

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BoolLegends" },
      {
        name: "description",
        content: "Bool X UrbanSports tournament tracker.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans")}>
      <head>
        <HeadContent />
        <ThemeScript />
      </head>
      <body className="antialiased">
        <ClerkProvider
          publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
          signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL as string}
          signInFallbackRedirectUrl={
            import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL as string
          }
          signUpFallbackRedirectUrl={
            import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL as string
          }
          appearance={clerkAppearance}
        >
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ThemeProvider>
              <AppBackground />
              <Outlet />
            </ThemeProvider>
          </ConvexProviderWithClerk>
        </ClerkProvider>
        <Scripts />
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
      </body>
    </html>
  );
}
