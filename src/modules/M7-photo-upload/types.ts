export interface PhotoUploadResult {
  photoId: string;
  url: string;
  sessionId: string;
}

export interface PhotoUploadInput {
  file: File;
  sessionId: string;
}
