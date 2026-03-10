import { describe, expect, it } from "vitest";
import { detectImageMimeType, validateImageUpload } from "./upload-validation";

const tinyPngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pN8WnQAAAAASUVORK5CYII=",
    "base64"
);

describe("upload validation", () => {
    it("detects supported image signatures", () => {
        expect(detectImageMimeType(tinyPngBytes)).toBe("image/png");
        expect(
            detectImageMimeType(
                Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00])
            )
        ).toBe("image/jpeg");
        expect(
            detectImageMimeType(
                Buffer.from([
                    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
                ])
            )
        ).toBe("image/webp");
    });

    it("rejects files that do not match image signatures", async () => {
        await expect(
            validateImageUpload(
                new File(["not-an-image"], "payload.png", { type: "image/png" })
            )
        ).rejects.toThrow("valid PNG, JPEG, or WebP images");
    });

    it("returns a normalized mime type and content hash", async () => {
        const result = await validateImageUpload(
            new File([tinyPngBytes], "avatar.png", { type: "image/png" })
        );

        expect(result.detectedMimeType).toBe("image/png");
        expect(result.sha256).toHaveLength(64);
        expect(result.buffer.byteLength).toBeGreaterThan(0);
    });
});
