import { S3StorageProvider } from "./s3-provider";
import type { StorageConfig, StorageProvider } from "./types";

/**
 * Factory function to create storage provider based on configuration
 * This is the single point where you swap providers
 */
export async function createStorageProvider(
  config?: StorageConfig,
): Promise<StorageProvider> {
  // Default to environment variables if no config provided
  const providerType =
    config?.provider || (process.env.STORAGE_PROVIDER as "s3" | "r2");

  switch (providerType) {
    case "s3": {
      const s3Config = {
        region: config?.region || process.env.AWS_REGION || "us-east-1",
        bucket: config?.bucket || process.env.AWS_S3_BUCKET || "",
        accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey:
          config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
        endpoint: config?.endpoint || process.env.AWS_S3_ENDPOINT,
      };

      // Validate required fields
      if (
        !s3Config.bucket ||
        !s3Config.accessKeyId ||
        !s3Config.secretAccessKey
      ) {
        throw new Error(
          "Missing required S3 configuration. Ensure AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.",
        );
      }

      const provider = new S3StorageProvider(s3Config);
      await provider.validateConfig();
      return provider;
    }

    case "r2": {
      // Cloudflare R2 is S3-compatible, use S3StorageProvider with custom endpoint
      const accountId = process.env.R2_ACCOUNT_ID;
      if (!accountId && !config?.endpoint && !process.env.R2_ENDPOINT) {
        throw new Error(
          "Missing required R2 configuration. Ensure R2_ACCOUNT_ID is set (or provide R2_ENDPOINT).",
        );
      }

      const r2Config = {
        region: "auto", // R2 uses "auto" region
        bucket: config?.bucket || process.env.R2_BUCKET || "",
        accessKeyId: config?.accessKeyId || process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey:
          config?.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || "",
        endpoint:
          config?.endpoint ||
          process.env.R2_ENDPOINT ||
          `https://${accountId}.r2.cloudflarestorage.com`,
      };

      if (
        !r2Config.bucket ||
        !r2Config.accessKeyId ||
        !r2Config.secretAccessKey
      ) {
        throw new Error(
          "Missing required R2 configuration. Ensure R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set.",
        );
      }

      const provider = new S3StorageProvider(r2Config);
      await provider.validateConfig();
      return provider;
    }

    default:
      throw new Error(`Unsupported storage provider: ${providerType}`);
  }
}
