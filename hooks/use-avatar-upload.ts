"use client";

import { useState } from "react";
import { compressImageToDataUri } from "@/lib/image/compress";
import { api, ApiRequestError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // sanity cap on the original file before we even try to process it

export interface UseAvatarUpload {
  preview: string | null;
  uploading: boolean;
  error: string | null;
  /** Compresses the file and previews it immediately; does not upload yet. */
  selectFile: (file: File) => Promise<void>;
  /** Uploads the currently-previewed image to an already-active account. */
  upload: () => Promise<void>;
  /** The compressed data URI, for onboarding flows that submit it together with the rest of the profile form. */
  pendingDataUri: string | null;
  reset: () => void;
}

/**
 * Two ways this gets used:
 *   - Already-authenticated (Profile page): selectFile() previews, then
 *     upload() posts it immediately via /api/users/avatar and updates the
 *     session store.
 *   - Onboarding (profile-setup, before the account exists yet):
 *     selectFile() previews and compresses; the resulting `pendingDataUri`
 *     is included directly in the /api/users/complete submission instead
 *     of being uploaded here — see app/(auth)/profile-setup/page.tsx.
 */
export function useAvatarUpload(): UseAvatarUpload {
  const updateAvatarUrl = useSessionStore((s) => s.updateAvatarUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingDataUri, setPendingDataUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That photo is too large. Try a smaller one.");
      return;
    }
    try {
      const dataUri = await compressImageToDataUri(file);
      setPreview(dataUri);
      setPendingDataUri(dataUri);
    } catch {
      setError("Couldn't read that image. Please try a different photo.");
    }
  }

  async function upload() {
    if (!pendingDataUri) return;
    setUploading(true);
    setError(null);
    try {
      const { user } = await api.uploadAvatar(pendingDataUri);
      if (user?.avatarUrl) updateAvatarUrl(user.avatarUrl);
      setPendingDataUri(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't upload that photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setPreview(null);
    setPendingDataUri(null);
    setError(null);
  }

  return { preview, uploading, error, selectFile, upload, pendingDataUri, reset };
}
