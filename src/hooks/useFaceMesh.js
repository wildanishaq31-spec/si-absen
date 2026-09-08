import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Calculates Euclidean distance between two points
 */
function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Direct Eyelid Openness Ratio Calculation:
 * Left Eye: Top (159) to Bottom (145) / Left (33) to Right (133)
 * Right Eye: Top (386) to Bottom (374) / Left (362) to Right (263)
 */
function getEyeOpenness(landmarks) {
  const leftTop = landmarks[159];
  const leftBottom = landmarks[145];
  const leftOuter = landmarks[33];
  const leftInner = landmarks[133];

  const rightTop = landmarks[386];
  const rightBottom = landmarks[374];
  const rightInner = landmarks[362];
  const rightOuter = landmarks[263];

  if (!leftTop || !leftBottom || !leftOuter || !leftInner || !rightTop || !rightBottom || !rightInner || !rightOuter) {
    return 0.28;
  }

  const leftHeight = getDistance(leftTop, leftBottom);
  const leftWidth = getDistance(leftOuter, leftInner);
  const leftRatio = leftWidth > 0 ? leftHeight / leftWidth : 0.28;

  const rightHeight = getDistance(rightTop, rightBottom);
  const rightWidth = getDistance(rightInner, rightOuter);
  const rightRatio = rightWidth > 0 ? rightHeight / rightWidth : 0.28;

  return (leftRatio + rightRatio) / 2.0;
}

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
  const verifiedRef = useRef(false);

  // Blink tracking ref
  const blinkRef = useRef({
    hadEyesOpen: false,
    hasClosed: false,
    closedStartTime: null,
    closedFrameCount: 0
  });

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    let isMounted = true;
    verifiedRef.current = false;
    setIsVerified(false);
    setProgress(0);
    blinkRef.current = {
      hadEyesOpen: false,
      hasClosed: false,
      closedStartTime: null,
      closedFrameCount: 0
    };

    if (!isActive) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const initFaceMesh = async () => {
      try {
        setIsModelLoading(true);

        let FaceMeshClass = window.FaceMesh;
        if (!FaceMeshClass) {
          try {
            const mod = await import('@mediapipe/face_mesh');
            FaceMeshClass = mod.FaceMesh || window.FaceMesh;
          } catch (e) {
            console.warn('Importing @mediapipe/face_mesh fallback to CDN', e);
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
        console.warn('FaceMesh AI initialization warning:', err);
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

  // Process Landmarks, Head Alignment, and Instant Blink Detection
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
      blinkRef.current.hasClosed = false;
      blinkRef.current.closedStartTime = null;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    setFaceDetected(true);

    // 1. Head Pose & Alignment Check
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

    // Generous frontal thresholds to allow natural slight movement
    const isFacingSideways = symmetryRatio < 0.45 || symmetryRatio > 2.20;
    const isHeadTilted = eyeTilt > 0.16;
    const isCentered = noseTip.x > 0.12 && noseTip.x < 0.88 && noseTip.y > 0.10 && noseTip.y < 0.90;

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

    if (isFacingSideways) {
      setPromptText('Hadapkan Wajah Lurus');
      setPromptSubtitle('Jangan menghadap ke samping');
      setProgress(0);
      blinkRef.current.hasClosed = false;
      blinkRef.current.closedStartTime = null;
      return;
    }

    if (isHeadTilted) {
      setPromptText('Posisikan Kepala Tegak');
      setPromptSubtitle('Jangan memiringkan kepala');
      setProgress(0);
      blinkRef.current.hasClosed = false;
      blinkRef.current.closedStartTime = null;
      return;
    }

    if (!isCentered) {
      setPromptText('Posisikan Wajah di Tengah');
      setPromptSubtitle('Arahkan wajah ke dalam lingkaran panduan');
      setProgress(15);
      blinkRef.current.hasClosed = false;
      blinkRef.current.closedStartTime = null;
      return;
    }

    // 2. Accurate Eye Openness Calculation
    const eyeOpenness = getEyeOpenness(landmarks);
    const tracker = blinkRef.current;

    setPromptText('Kedipkan Mata');
    setPromptSubtitle('(Tahan 1 Detik)');

    // Closed threshold: eye ratio < 0.205 (typical closed eyelid ratio is 0.08 - 0.18)
    // Open threshold: eye ratio >= 0.215 (typical open eye ratio is 0.25 - 0.40)
    const isCurrentlyClosed = eyeOpenness < 0.205;
    const isCurrentlyOpen = eyeOpenness >= 0.215;

    if (isCurrentlyOpen) {
      tracker.hadEyesOpen = true;

      // If user was confirmed to have closed their eyes and has NOW reopened them:
      // => Complete 1x Blink (Open ➔ Closed ➔ Reopened)!
      if (tracker.hasClosed && !verifiedRef.current) {
        setProgress(100);
        handleVerificationSuccess();
        return;
      }
    } else if (isCurrentlyClosed) {
      tracker.hasClosed = true;
      tracker.closedFrameCount += 1;

      if (!tracker.closedStartTime) {
        tracker.closedStartTime = Date.now();
      }

      const closedDuration = Date.now() - tracker.closedStartTime;
      const pct = Math.min(100, Math.round((closedDuration / 150) * 100));
      setProgress(pct);

      // If held closed for >= 150ms or >= 3 frames: verify instantly!
      if ((closedDuration >= 150 || tracker.closedFrameCount >= 3) && !verifiedRef.current) {
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
