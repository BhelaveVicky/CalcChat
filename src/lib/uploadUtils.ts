import { ref, uploadBytesResumable, getDownloadURL, uploadString } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a file (File or Blob) to Firebase Storage and returns the download URL.
 * 
 * @param file The file or blob to upload
 * @param path The path in Firebase Storage (e.g., 'chats/userId/timestamp_filename')
 * @param onProgress Optional callback for upload progress (0 to 100)
 */
export async function uploadMediaToStorage(
  file: File | Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Firebase storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          console.error('Error getting download URL:', err);
          reject(err);
        }
      }
    );
  });
}

/**
 * Uploads a base64 data URL to Firebase Storage and returns the download URL.
 * Useful for canvas captures or recorded audio blobs that are already converted.
 */
export async function uploadBase64ToStorage(
  dataUrl: string,
  path: string,
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, 'data_url');
  return await getDownloadURL(storageRef);
}
