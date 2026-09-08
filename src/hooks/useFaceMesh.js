import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Calculates Euclidean distance between two 2D points
 */
function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates Eye Aspect Ratio (EAR) for blink detection
 * Left Eye landmarks: 33, 160, 158, 133, 153, 144
 * Right Eye landmarks: 362, 385, 387, 263, 373, 380
 */
function calculateEAR(landmarks, eyeIndices) {
  const [p1, p2, p3, p4, p5, p6] = eyeIndices.map(idx => landmarks[idx]);
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0.3;
  const vertical1 = getDistance(p2, p6);
  const vertical2 = getDistance(p3, p5);
  const horizontal = getDistance(p1, p4);
  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// Clean aesthetic contour landmark indices matching SIPP
const CONTOUR_LANDMARKS = [
  // 1. Face Oval / Jawline
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
  // 2. Left Eyebrow
  70, 63, 105, 66, 107, 55, 65, 52, 53, 46,
  // 3. Right Eyebrow
  336, 296, 334, 293, 300, 276, 283, 282, 295, 285,
  // 4. Left Eye Outline
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  // 5. Right Eye Outline
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
  // 6. Nose Bridge & Contour
  1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 19, 94,
  // 7. Lips Outer & Inner
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 185, 40, 39, 37, 0, 267, 269, 270, 409, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 191, 80, 81, 82, 13, 312, 311, 310, 415,
  // 8. Cheek & Forehead Highlights
  151, 9, 8, 123, 352, 205, 425
];

export function useFaceMesh({ videoRef, canvasRef, isActive, onLivenessSuccess }) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInGuide, setFaceInGuide] = useState(false);
  const [promptText, setPromptText] = useState('Kedipkan Mata');
  const [promptSubtitle, setPromptSubtitle] = useState('(Tahan 1 Detik)');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isVerified, setIsVerified] = useState(false);

  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const blinkTrackerRef = useRef({
    openedOnce: false,
    closedOnce: false,
    closedTimestamp: null,
    blinkCount: 0
  });
  const verifiedRef = useRef(false);

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    let isMounted = true;
    verifiedRef.current = false;
    setIsVerified(false);
    setProgress(0);
    blinkTrackerRef.current = {
      openedOnce: false,
      closedOnce: false,
      closedTimestamp: null,
      blinkCount: 0
    };

    if (!isActive) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const initFaceMesh = async () => {
      try {
        setIsModelLoading(true);

        // Dynamically load FaceMesh from window or import
        let FaceMeshClass = window.FaceMesh;
        if (!FaceMeshClass) {
          try {
            const mod = await import('@mediapipe/face_mesh');
            FaceMeshClass = mod.FaceMesh || window.FaceMesh;
          } catch (e) {
            console.warn('Importing @mediapipe/face_mesh failed, falling back to CDN script', e);
          }
        }

        if (!FaceMeshClass) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve(window.FaceMesh);
            script.onerror = reject;
            document.head.appendChild(script);
          });
          FaceMeshClass = window.FaceMesh;
        }

        if (!FaceMeshClass) {
          throw new Error('FaceMesh library could not be loaded');
        }

        const faceMesh = new FaceMeshClass({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
          if (!isMounted || verifiedRef.current) return;
          processFaceResults(results);
        });

        await faceMesh.initialize();
        faceMeshRef.current = faceMesh;

        if (isMounted) {
          setIsModelLoading(false);
          setPromptText('Kedipkan Mata');
          setPromptSubtitle('(Tahan 1 Detik)');
        }
      } catch (err) {
        console.warn('FaceMesh AI initialization warning (fallback active):', err);
        if (isMounted) {
          setIsModelLoading(false);
          setPromptText('Kedipkan Mata');
          setPromptSubtitle('(Tahan 1 Detik)');
        }
      }
    };

    initFaceMesh();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (e) {
          console.warn('FaceMesh close error:', e);
        }
        faceMeshRef.current = null;
      }
    };
  }, [isActive]);

  // Main Detection Loop
  const runDetection = useCallback(async () => {
    if (!isActive || verifiedRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState >= 2 && faceMeshRef.current) {
      try {
        await faceMeshRef.current.send({ image: video });
      } catch (err) {
        // Ignore single frame dropped
      }
    }

    if (!verifiedRef.current && isActive) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
    }
  }, [isActive, videoRef]);

  useEffect(() => {
    if (!isModelLoading && isActive) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isModelLoading, isActive, runDetection]);

  // Process Landmarks, Draw Green Dots on contours only, and Instant Blink Verification
  const processFaceResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      setFaceInGuide(false);
      setProgress(0);
      setPromptText('Posisikan Wajah');
      setPromptSubtitle('Arahkan wajah ke dalam lingkaran');
      blinkTrackerRef.current = { openedOnce: false, closedOnce: false, closedTimestamp: null, blinkCount: 0 };
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    setFaceDetected(true);

    // Check if face is roughly centered inside the oval guide
    const noseTip = landmarks[1];
    const isCentered = noseTip && noseTip.x > 0.25 && noseTip.x < 0.75 && noseTip.y > 0.20 && noseTip.y < 0.80;
    setFaceInGuide(isCentered);

    // Draw ONLY clean facial contour green dots (exact match with SIPP screenshot!)
    ctx.save();
    ctx.fillStyle = '#4ADE80';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 3;

    for (let i = 0; i < CONTOUR_LANDMARKS.length; i++) {
      const idx = CONTOUR_LANDMARKS[i];
      const pt = landmarks[idx];
      if (pt) {
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();

    if (!isCentered) {
      setPromptText('Posisikan Wajah di Tengah');
      setPromptSubtitle('Arahkan wajah ke dalam lingkaran panduan');
      setProgress(20);
      return;
    }

    // Liveness: Fast Instant Eye Blink Verification
    const leftEAR = calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    const BLINK_CLOSE_THRESHOLD = 0.20; // Closed eyes threshold
    const BLINK_OPEN_THRESHOLD = 0.23;  // Open eyes threshold

    setPromptText('Kedipkan Mata');
    setPromptSubtitle('(Tahan 1 Detik)');

    const tracker = blinkTrackerRef.current;

    if (avgEAR >= BLINK_OPEN_THRESHOLD) {
      tracker.openedOnce = true;
      if (tracker.closedOnce && !verifiedRef.current) {
        // Natural blink completed (Open -> Closed -> Open)
        tracker.blinkCount += 1;
        setProgress(100);
        handleVerificationSuccess();
        return;
      }
    } else if (avgEAR < BLINK_CLOSE_THRESHOLD && tracker.openedOnce) {
      tracker.closedOnce = true;
      if (!tracker.closedTimestamp) {
        tracker.closedTimestamp = Date.now();
      }
      
      const closedDuration = Date.now() - tracker.closedTimestamp;
      const pct = Math.min(100, Math.round((closedDuration / 250) * 100));
      setProgress(pct);

      // If closed for just 200ms+ (1 quick deliberate blink), verify instantly!
      if (closedDuration >= 200 && !verifiedRef.current) {
        setProgress(100);
        handleVerificationSuccess();
      }
    }
  };

  const handleVerificationSuccess = () => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    setIsVerified(true);
    setProgress(100);
    setPromptText('Verifikasi Berhasil');
    setPromptSubtitle('Memproses presensi...');

    // Haptic vibration feedback on mobile
    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch (e) {}
    }

    if (onLivenessSuccess) {
      setTimeout(() => {
        onLivenessSuccess();
      }, 300);
    }
  };

  return {
    isModelLoading,
    faceDetected,
    faceInGuide,
    promptText,
    promptSubtitle,
    progress,
    isVerified,
    triggerManualSuccess: handleVerificationSuccess
  };
}
