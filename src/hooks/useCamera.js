import { useState, useRef, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async (preferredFacing = 'user') => {
    setCameraError(null);
    setIsReady(false);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera langsung di browser hanya bisa berjalan di protokol HTTPS yang aman atau localhost. Buka URL HTTPS (Vercel) atau gunakan tombol Ambil Foto HP.');
      }

      // Constraints with fallbacks (prefer front camera, flexible resolution)
      let mediaStream = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (errFirst) {
        // Fallback to basic video constraint without facingMode if rejected
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setFacingMode(preferredFacing);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        try {
          await video.play();
        } catch (e) {
          console.log('Video play error (will retry on loadedmetadata):', e);
        }
      }
      setIsReady(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Izin kamera belum diaktifkan. Silakan izinkan akses kamera di browser Anda.' 
          : `Kamera tidak dapat diakses (${err.message}). Anda tetap dapat menggunakan tombol Ambil Foto HP.`
      );
    }
  }, []);

  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  /**
   * Captures image from video stream onto canvas
   */
  const captureSnapshot = useCallback(() => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d');
    
    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // High quality JPEG
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [facingMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping track on unmount:', e);
          }
        });
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isReady,
    cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
    captureSnapshot
  };
}
