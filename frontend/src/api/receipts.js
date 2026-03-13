import { apiUpload } from "./client";

export function scanReceipt(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);
  return apiUpload("/receipts/scan", formData);
}
