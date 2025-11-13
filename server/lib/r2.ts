import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const MEDIA_ROOT_PREFIX = "media";

type UploadParams = {
  key: string;
  body: Buffer;
  contentType: string;
};

const hasR2Config =
  Boolean(process.env.R2_ACCOUNT_ID) &&
  Boolean(process.env.R2_ACCESS_KEY) &&
  Boolean(process.env.R2_SECRET_KEY) &&
  Boolean(process.env.R2_BUCKET);

const endpointFromEnv =
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export const r2Bucket = process.env.R2_BUCKET;

export const r2Client = hasR2Config
  ? new S3Client({
      region: "auto",
      endpoint: endpointFromEnv,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY as string,
        secretAccessKey: process.env.R2_SECRET_KEY as string,
      },
      forcePathStyle: true,
    })
  : null;

export const isR2Enabled = Boolean(r2Client && r2Bucket);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function timestampSlug(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function resolveFolderForMime(mime?: string | null): string {
  if (!mime) return "temp";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  const excelMimes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
  ];
  if (excelMimes.includes(mime)) return "excel";
  return "temp";
}

export function buildR2Key(originalName: string, mimeType?: string | null): string {
  const folder = resolveFolderForMime(mimeType);
  const safeName = sanitizeFilename(originalName);
  const filename = `${timestampSlug()}_${safeName}`;
  return `${MEDIA_ROOT_PREFIX}/${folder}/${filename}`;
}

export async function uploadBufferToR2({ key, body, contentType }: UploadParams): Promise<void> {
  if (!r2Client || !r2Bucket) throw new Error("R2 client not configured");
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export function getR2PublicUrl(key: string): string {
  const base =
    process.env.R2_PUBLIC_URL ||
    (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${r2Bucket}` : "");
  return `${base?.replace(/\/$/, "")}/${key}`;
}
