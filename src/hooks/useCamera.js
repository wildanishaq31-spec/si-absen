import { useState, useRef, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async (preferredFacing = 'user') => {
    setCameraError(null);
    setIsReady(false);

    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Constraints with fallbacks
      let mediaStream = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: preferredFacing,
            width: { ideal: 640 },
            height: { ideal: 640 }
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

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.log('Video play error:', e);
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
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsReady(false);
  }, [stream]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
