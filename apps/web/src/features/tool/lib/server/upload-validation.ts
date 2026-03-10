import { createHash } from "node:crypto";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpegStartOfImage = Buffer.from([0xff, 0xd8, 0xff]);
const riffSignature = Buffer.from([0x52, 0x49, 0x46, 0x46]);
const webpSignature = Buffer.from([0x57, 0x45, 0x42, 0x50]);

export interface ValidatedUpload {
    buffer: Buffer;
    detectedMimeType: "image/png" | "image/jpeg" | "image/webp";
    sha256: string;
}

function bufferStartsWith(buffer: Buffer, signature: Buffer, offset = 0) {
    return buffer.subarray(offset, offset + signature.length).equals(signature);
}

export function detectImageMimeType(buffer: Buffer) {
    if (bufferStartsWith(buffer, pngSignature)) {
        return "image/png" as const;
    }

    if (bufferStartsWith(buffer, jpegStartOfImage)) {
        return "image/jpeg" as const;
    }

    if (bufferStartsWith(buffer, riffSignature) && bufferStartsWith(buffer, webpSignature, 8)) {
        return "image/webp" as const;
    }

    return null;
}

export async function validateImageUpload(file: File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMimeType = detectImageMimeType(buffer);

    if (!detectedMimeType) {
        throw new Error("Uploaded files must be valid PNG, JPEG, or WebP images.");
    }

    return {
        buffer,
        detectedMimeType,
        sha256: createHash("sha256").update(buffer).digest("hex"),
    } satisfies ValidatedUpload;
}
