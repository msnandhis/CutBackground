import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getToolStorageRoot, isR2Configured } from "../env";
import { getR2BucketName, getR2Client, uploadObject } from "../r2";

function encodeLocalRef(contentType: string, key: string) {
    return `local:${contentType}:${key}`;
}

function encodeR2Ref(contentType: string, key: string) {
    return `r2:${contentType}:${key}`;
}

function decodeRef(ref: string) {
    const [backend, contentType, ...rest] = ref.split(":");
    return {
        backend,
        contentType,
        key: rest.join(":"),
    };
}

async function ensureParentDir(filepath: string) {
    await mkdir(path.dirname(filepath), { recursive: true });
}

export async function storeToolAsset(params: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
}) {
    if (isR2Configured()) {
        await uploadObject({
            key: params.key,
            body: params.body,
            contentType: params.contentType,
        });

        return encodeR2Ref(params.contentType, params.key);
    }

    const filepath = path.join(getToolStorageRoot(), params.key);
    await ensureParentDir(filepath);
    await writeFile(filepath, params.body);

    return encodeLocalRef(params.contentType, params.key);
}

export async function readToolAsset(ref: string) {
    const parsed = decodeRef(ref);

    if (parsed.backend === "r2") {
        const response = await getR2Client().send(
            new GetObjectCommand({
                Bucket: getR2BucketName(),
                Key: parsed.key,
            })
        );

        const bytes = Buffer.from(await response.Body!.transformToByteArray());
        return {
            body: bytes,
            contentType: parsed.contentType,
        };
    }

    if (parsed.backend === "local") {
        const filepath = path.join(getToolStorageRoot(), parsed.key);
        const bytes = await readFile(filepath);
        return {
            body: bytes,
            contentType: parsed.contentType,
        };
    }

    throw new Error("Unsupported tool asset backend.");
}

export function isLocalToolAsset(ref: string) {
    return ref.startsWith("local:");
}
