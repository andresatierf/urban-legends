/**
 * Storage provider interface for abstracted file storage.
 * Implementations: S3, Cloudflare R2, Vercel Blob, etc.
 */
export interface StorageProvider {
	/**
	 * Generate a presigned URL for direct client upload
	 * @param key - Unique storage key (path in bucket)
	 * @param contentType - MIME type of file
	 * @param expiresIn - Expiration time in seconds (default: 900 = 15 minutes)
	 * @returns Presigned upload URL and storage key
	 */
	generatePresignedUrl(
		key: string,
		contentType: string,
		expiresIn?: number,
	): Promise<{
		uploadUrl: string;
		storageKey: string;
		expiresAt: string; // ISO timestamp
	}>;

	/**
	 * Generate a public/authenticated URL for viewing a file
	 * @param key - Storage key
	 * @param expiresIn - Optional expiration for signed URLs (default: 3600 = 1 hour)
	 * @returns URL to access the file
	 */
	getPublicUrl(key: string, expiresIn?: number): Promise<string>;

	/**
	 * Delete a file from storage
	 * @param key - Storage key
	 */
	deleteFile(key: string): Promise<void>;

	/**
	 * Generate a unique storage key for a file
	 * @param submissionId - Submission ID (for namespacing)
	 * @param filename - Original filename
	 * @returns Unique storage key
	 */
	generateUniqueKey(submissionId: string, filename: string): string;

	/**
	 * Validate configuration (called on initialization)
	 * @throws Error if configuration is invalid
	 */
	validateConfig(): Promise<void>;
}

/**
 * Configuration for storage providers
 */
export interface StorageConfig {
	provider: "s3" | "r2" | "vercel-blob";

	// S3 / R2 specific
	region?: string;
	bucket?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	endpoint?: string; // For R2 or custom S3 endpoints

	// Vercel Blob specific
	vercelBlobToken?: string;
}
