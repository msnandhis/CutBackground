import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertRuntimeRequirements, getR2Config } from "../env";

let r2Client: S3Client | null = null;

export function getR2Client() {
    if (r2Client) {
        return r2Client;
    }

    assertRuntimeRequirements("r2");
    const config = getR2Config()!;

    r2Client = new S3Client({
        region: "auto",
        endpoint: config.endpoint,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    return r2Client;
}

export function getR2BucketName() {
    return getR2Config()?.bucketName ?? "tool-uploads";
}

/**
 * Upload an object to R2 from the server runtime.
 */
export async function uploadObject(params: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType: string;
}) {
    assertRuntimeRequirements("r2");

    const command = new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
    });

    return getR2Client().send(command);
}

/**
 * Generate a presigned URL for direct client-side uploads to R2.
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 600
): Promise<string> {
    assertRuntimeRequirements("r2");

    const command = new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(getR2Client(), command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading processed results from R2.
 */
export async function getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600
): Promise<string> {
    assertRuntimeRequirements("r2");

    const command = new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
    });

    return getSignedUrl(getR2Client(), command, { expiresIn });
}

export { r2Client };
