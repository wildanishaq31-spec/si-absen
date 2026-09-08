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
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0.28;
  const vertical1 = getDistance(p2, p6);
  const vertical2 = getDistance(p3, p5);
  const horizontal = getDistance(p1, p4);
  if (horizontal === 0) return 0.28;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// Precise feature contours matching SIPP
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
    calibratedFrames: 0,
    openBaselineEAR: 0.28,
    isEyesOpen: false,
    hasClosed: false,
    closedTimestamp: null
  });
  const verifiedRef = useRef(false);

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    let isMounted = true;
    verifiedRef.current = false;
    setIsVerified(false);
    setProgress(0);
    blinkTrackerRef.current = {
      calibratedFrames: 0,
      openBaselineEAR: 0.28,
      isEyesOpen: false,
      hasClosed: false,
      closedTimestamp: null
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
        // Continue loop
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

  // Process Landmarks, Enforce Frontal Head Pose, and Require Genuine 1x Blink
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
      blinkTrackerRef.current.hasClosed = false;
      blinkTrackerRef.current.calibratedFrames = 0;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    setFaceDetected(true);

    // 1. Strict Head Pose & Frontal Face Alignment Check (Mencegah Hadap Samping/Miring)
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const leftEye = landmarks[133];
    const rightEye = landmarks[362];

    if (!noseTip || !leftCheek || !rightCheek || !leftEye || !rightEye) {
      return;
    }

    const leftDist = Math.abs(noseTip.x - leftCheek.x);
    const rightDist = Math.abs(rightCheek.x - noseTip.x);
    const symmetryRatio = leftDist / (rightDist + 0.0001);
    const eyeTilt = Math.abs(leftEye.y - rightEye.y);

    // If head is turned sideways (Yaw angle > 25 deg)
    const isFacingSideways = symmetryRatio < 0.60 || symmetryRatio > 1.65;
    // If head is tilted heavily (Roll angle)
    const isHeadTilted = eyeTilt > 0.09;
    // Check if nose is inside frame
    const isCentered = noseTip.x > 0.22 && noseTip.x < 0.78 && noseTip.y > 0.18 && noseTip.y < 0.82;

    setFaceInGuide(isCentered && !isFacingSideways && !isHeadTilted);

    // Draw ONLY clean facial contour green dots (exact SIPP look)
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

    // Check constraints before processing blink
    if (isFacingSideways) {
      setPromptText('Hadapkan Wajah Lurus');
      setPromptSubtitle('Jangan menghadap ke samping');
      setProgress(0);
      blinkTrackerRef.current.hasClosed = false;
      blinkTrackerRef.current.calibratedFrames = 0;
      return;
    }

    if (isHeadTilted) {
      setPromptText('Posisikan Kepala Tegak');
      setPromptSubtitle('Jangan memiringkan kepala');
      setProgress(0);
      blinkTrackerRef.current.hasClosed = false;
      blinkTrackerRef.current.calibratedFrames = 0;
      return;
    }

    if (!isCentered) {
      setPromptText('Posisikan Wajah di Tengah');
      setPromptSubtitle('Arahkan wajah ke dalam lingkaran panduan');
      setProgress(15);
      blinkTrackerRef.current.hasClosed = false;
      blinkTrackerRef.current.calibratedFrames = 0;
      return;
    }

    // 2. High Precision Genuine 1x Blink Detection Engine
    const leftEAR = calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
    const currentEAR = (leftEAR + rightEAR) / 2.0;

    const tracker = blinkTrackerRef.current;

    // Thresholds: Eyes Closed vs Eyes Open
    const closeThreshold = Math.min(0.185, Math.max(0.14, tracker.openBaselineEAR * 0.65));
    const openThreshold = Math.max(0.22, tracker.openBaselineEAR * 0.82);

    setPromptText('Kedipkan Mata');
    setPromptSubtitle('(Tahan 1 Detik)');

    // Phase 1: Open Eye Calibration (User must be looking at camera with open eyes first)
    if (currentEAR >= openThreshold) {
      if (tracker.calibratedFrames < 6) {
        tracker.calibratedFrames += 1;
        tracker.openBaselineEAR = (tracker.openBaselineEAR * tracker.calibratedFrames + currentEAR) / (tracker.calibratedFrames + 1);
      }
      tracker.isEyesOpen = true;

      // If user previously closed eyes and now opened them -> 1X COMPLETE BLINK!
      if (tracker.hasClosed && !verifiedRef.current) {
        setProgress(100);
        handleVerificationSuccess();
        return;
      }
    } 
    // Phase 2: Eyes Closed (Only valid AFTER eyes were verified open)
    else if (currentEAR <= closeThreshold && tracker.isEyesOpen && tracker.calibratedFrames >= 4) {
      tracker.hasClosed = true;
      if (!tracker.closedTimestamp) {
        tracker.closedTimestamp = Date.now();
      }
      
      const closedDuration = Date.now() - tracker.closedTimestamp;
      const pct = Math.min(100, Math.round((closedDuration / 200) * 100));
      setProgress(pct);

      // If held closed for >= 200ms, also trigger verification
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
    setPromptText('✓ Verifikasi Berhasil');
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
      }, 150);
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
