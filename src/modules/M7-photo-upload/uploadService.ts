import { PhotoUploadInput, PhotoUploadResult } from "./types";

// Stub — S3/R2 integration in Week 4
export async function uploadPhoto(input: PhotoUploadInput): Promise<PhotoUploadResult> {
  void input;
  throw new Error("Photo upload not yet implemented");
}
