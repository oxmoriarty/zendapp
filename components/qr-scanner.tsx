"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ScanLine, CameraOff } from "lucide-react";
import jsQR from "jsqr";

interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  /** Called once per successful decode with the raw scanned text; the caller owns interpreting/validating it. */
  onDecode: (text: string) => void;
}

/**
 * Full-screen camera scanner. Uses jsQR (a small, dependency-free, widely
 * used pure-JS QR decoder) rather than a heavier all-in-one scanning
 * library — the camera plumbing here is straightforward enough that
 * owning it directly keeps this on the app's own design system instead of
 * inheriting a third-party library's UI.
 *
 * Requires HTTPS or localhost (same constraint as WebAuthn) — browsers
 * refuse camera access otherwise.
 */
export function QrScanner({ open, onClose, onDecode }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser doesn't support camera access. Try searching by username instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("Camera access was denied. Enable it in your browser settings, or search by username instead.");
        } else {
          setError("Couldn't access your camera. Try searching by username instead.");
        }
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height);
          if (result?.data) {
            onDecode(result.data);
            return; // stop the loop — caller decides what happens next (usually closes the scanner)
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black"
        >
          <div className="flex items-center justify-between p-5">
            <p className="font-display text-sm font-medium text-white/80">Scan a Zendapp QR code</p>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md"
              aria-label="Close scanner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {error ? (
              <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
                <CameraOff className="h-8 w-8 text-white/50" />
                <p className="text-sm text-white/70">{error}</p>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-64 w-64">
                    <div className="absolute inset-0 rounded-3xl border-2 border-white/60" />
                    <motion.div
                      animate={{ y: [0, 240, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-x-2 top-0 flex items-center"
                    >
                      <ScanLine className="h-5 w-5 text-primary-300" />
                      <div className="h-px flex-1 bg-primary-300/80" />
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </div>

          <p className="p-6 text-center text-xs text-white/50">
            Point your camera at a friend&apos;s Zendapp QR code from their Receive screen.
          </p>
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
