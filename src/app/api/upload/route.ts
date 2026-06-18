import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ─── Runtime config ──────────────────────────────────────────────────────────
// Allow up to 20 MB per file upload (Next.js App Router)
export const maxDuration = 60;

// ─── Google Auth ─────────────────────────────────────────────────────────────
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || raw === "PASTE_SERVICE_ACCOUNT_JSON_HERE") {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured in .env.local");
  }
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Ensure a subfolder exists inside the root folder; return its Drive ID. */
async function ensureSubfolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
): Promise<string> {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (res.data.files?.length) return res.data.files[0].id!;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  return created.data.id!;
}

// ─── POST /api/upload ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    const subfolder = (formData.get("subfolder") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Strategy 1: Google Drive ──────────────────────────────────────────
    try {
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!rootFolderId) {
        throw new Error("Drive folder not configured.");
      }

      const auth = getAuth();
      const drive = google.drive({ version: "v3", auth });

      // Resolve target folder (create subfolder lazily if name provided)
      const targetFolderId = subfolder
        ? await ensureSubfolder(drive, rootFolderId, subfolder)
        : rootFolderId;

      const bodyStream = Readable.from(buffer);

      // Upload to Drive (supportsAllDrives for shared drive compatibility)
      const uploaded = await drive.files.create({
        requestBody: {
          name: safeName,
          parents: [targetFolderId],
        },
        media: {
          mimeType: file.type || "application/octet-stream",
          body: bodyStream,
        },
        fields: "id, name, webViewLink",
        supportsAllDrives: true,
      });

      const fileId = uploaded.data.id!;

      // Grant public "reader" access so the URL can be opened by anyone
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });

      // Use direct thumbnail URL for images, shareable view for others
      const isImage = (file.type || "").startsWith("image/");
      const url = isImage
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
        : `https://drive.google.com/file/d/${fileId}/view`;

      console.log("[upload] Google Drive upload successful:", url);
      return NextResponse.json({ url, id: fileId, name: uploaded.data.name });
    } catch (driveErr: unknown) {
      const driveMsg = driveErr instanceof Error ? driveErr.message : "Drive upload failed.";
      console.warn("[upload] Drive upload failed:", driveMsg);
    }

    // ── Strategy 2: Supabase Storage ─────────────────────────────────────
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials not configured.");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const storagePath = subfolder ? `${subfolder}/${safeName}` : safeName;

      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (error) throw error;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(storagePath);

      const url = urlData.publicUrl;
      console.log("[upload] Supabase Storage upload successful:", url);
      return NextResponse.json({ url, id: `supabase-${data.id || Date.now()}`, name: safeName });
    } catch (supaErr: unknown) {
      const supaMsg = supaErr instanceof Error ? supaErr.message : "Supabase upload failed.";
      console.warn("[upload] Supabase Storage upload failed:", supaMsg);
    }

    // ── Strategy 3: Local filesystem fallback ────────────────────────────
    console.warn("[upload] Falling back to local filesystem storage.");
    const publicDir = path.join(process.cwd(), "public");
    const uploadsDir = path.join(publicDir, "uploads");

    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${safeName}`;
    console.log("[upload] Local fallback upload successful:", url);
    return NextResponse.json({ url, id: `local-${Date.now()}`, name: safeName });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    console.error("[upload] Fatal upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
