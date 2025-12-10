const clerkJwtIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!clerkJwtIssuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN environment variable is required in convex/auth.config.ts",
  );
}

export default {
  providers: [
    {
      // domain: process.env.CONVEX_SITE_URL,
      domain: clerkJwtIssuerDomain,
      applicationID: "convex",
    },
  ],
};
