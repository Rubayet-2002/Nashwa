
export async function uploadImageToCloudinary(
  fileOrBlob: File | Blob,
  folder: string = "nashwa_uploads"
): Promise<string> {
  

  const sigRes = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify({ folder }),
  });

  if (!sigRes.ok) {
    const errorData = await sigRes.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to retrieve Cloudinary signature");
  }

  const { signature, timestamp, api_key, cloud_name } = await sigRes.json();

  if (!signature || !timestamp || !api_key || !cloud_name) {
    throw new Error("Missing required Cloudinary parameters from signature route");
  }

  

  const formData = new FormData();
  formData.append("file", fileOrBlob);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", api_key);
  formData.append("folder", folder);

  

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadData = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok || !uploadData.secure_url) {
    const errorMsg =
      uploadData?.error?.message ||
      uploadData?.message ||
      `Cloudinary API upload returned status ${uploadRes.status}`;
    throw new Error(errorMsg);
  }

  return uploadData.secure_url;
}


export async function uploadDocumentToCloudinary(
  fileOrBlob: File | Blob,
  folder: string = "nashwa_uploads"
): Promise<string> {
  const sigRes = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify({ folder }),
  });

  if (!sigRes.ok) {
    const errorData = await sigRes.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to retrieve Cloudinary signature");
  }

  const { signature, timestamp, api_key, cloud_name } = await sigRes.json();

  if (!signature || !timestamp || !api_key || !cloud_name) {
    throw new Error("Missing required Cloudinary parameters from signature route");
  }

  const formData = new FormData();
  formData.append("file", fileOrBlob);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", api_key);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadData = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok || !uploadData.secure_url) {
    const errorMsg =
      uploadData?.error?.message ||
      uploadData?.message ||
      `Cloudinary API upload returned status ${uploadRes.status}`;
    throw new Error(errorMsg);
  }

  return uploadData.secure_url;
}
