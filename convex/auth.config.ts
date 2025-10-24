export default {
  providers: [
    {
      // original
      // domain: process.env.CONVEX_SITE_URL,
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
