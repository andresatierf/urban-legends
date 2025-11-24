import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "./types";

/**
 * AWS S3 implementation of the StorageProvider interface
 */
export class S3StorageProvider implements StorageProvider {
	private client: S3Client;
	private bucket: string;
	private region: string;

	constructor(config: {
		region: string;
		bucket: string;
		accessKeyId: string;
		secretAccessKey: string;
		endpoint?: string; // Optional custom endpoint (for S3-compatible services)
	}) {
		this.bucket = config.bucket;
		this.region = config.region;

		this.client = new S3Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			...(config.endpoint && { endpoint: config.endpoint }),
		});
	}

	async validateConfig(): Promise<void> {
		// Attempt a simple operation to verify credentials
		try {
			// This will throw if credentials are invalid
			const command = new GetObjectCommand({
				Bucket: this.bucket,
				Key: "__health_check__", // This doesn't need to exist
			});

			// We expect this to fail (file doesn't exist), but it validates auth
			await getSignedUrl(this.client, command, { expiresIn: 60 });
		} catch (error) {
			// If error is NOT "NoSuchKey", it means auth/config is wrong
			if (error instanceof Error && !error.message.includes("NoSuchKey")) {
				throw new Error(
					`S3 configuration validation failed: ${error.message}`,
				);
			}
		}
	}

	generateUniqueKey(submissionId: string, filename: string): string {
		// Structure: submissions/{submissionId}/{timestamp}-{random}-{filename}
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 8);

		// Sanitize filename (remove special characters, preserve extension)
		const sanitized = filename
			.replace(/[^a-zA-Z0-9._-]/g, "-")
			.substring(0, 100); // Limit filename length

		return `submissions/${submissionId}/${timestamp}-${random}-${sanitized}`;
	}

	async generatePresignedUrl(
		key: string,
		contentType: string,
		expiresIn = 900, // 15 minutes default
	): Promise<{
		uploadUrl: string;
		storageKey: string;
		expiresAt: string;
	}> {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ContentType: contentType,
		});

		const uploadUrl = await getSignedUrl(this.client, command, {
			expiresIn,
		});

		const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

		return {
			uploadUrl,
			storageKey: key,
			expiresAt,
		};
	}

	async getPublicUrl(key: string, expiresIn = 3600): Promise<string> {
		// Generate signed URL for GET request (1 hour default)
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		return await getSignedUrl(this.client, command, { expiresIn });
	}

	async deleteFile(key: string): Promise<void> {
		const command = new DeleteObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		await this.client.send(command);
	}
}
