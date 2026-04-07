import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  const paramsToSign: Record<string, string> = {
    timestamp: timestamp.toString(),
    upload_preset: uploadPreset || "dermal_vision",
  };

  const signature = generateSignature(paramsToSign, apiSecret);

  const uploadFormData = new FormData();
  uploadFormData.append("file", new Blob([buffer]), file.name);
  uploadFormData.append("api_key", apiKey);
  uploadFormData.append("timestamp", timestamp.toString());
  uploadFormData.append("signature", signature);
  if (uploadPreset) {
    uploadFormData.append("upload_preset", uploadPreset);
  }

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || "Upload failed" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.secure_url });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

function generateSignature(params: Record<string, string>, apiSecret: string) {
  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return require("crypto")
    .createHash("sha1")
    .update(sorted + apiSecret)
    .digest("hex");
}
