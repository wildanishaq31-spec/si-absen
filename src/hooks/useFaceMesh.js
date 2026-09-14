import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  extractFaceDescriptor, 
  compareFaceDescriptors, 
  averageFaceDescriptors 
} from '../utils/faceBiometrics';

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
 * Left Eye: Vertical (159 to 145) / Horizontal (33 to 133)
 * Right Eye: Vertical (386 to 374) / Horizontal (362 to 263)
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
    return null;
  }

  const leftHeight = getDistance(leftTop, leftBottom);
  const leftWidth = getDistance(leftOuter, leftInner);
  const leftRatio = leftWidth > 0 ? leftHeight / leftWidth : 0.25;

  const rightHeight = getDistance(rightTop, rightBottom);
  const rightWidth = getDistance(rightInner, rightOuter);
  const rightRatio = rightWidth > 0 ? rightHeight / rightWidth : 0.25;

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

export function useFaceMesh({ 
  videoRef, 
  canvasRef, 
  isActive, 
  masterFaceDescriptor = null,
  isEnrollment = false,
  onLivenessSuccess,
  onMatchFailed
}) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInGuide, setFaceInGuide] = useState(false);
  const [promptText, setPromptText] = useState(isEnrollment ? 'Perekaman Wajah' : 'Kedipkan Mata');
  const [promptSubtitle, setPromptSubtitle] = useState('(Tahan 1 Detik)');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isVerified, setIsVerified] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [lastScorePercent, setLastScorePercent] = useState(null);

  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const verifiedRef = useRef(false);
  const descriptorSamplesRef = useRef([]);

  // Dynamic Eye Baseline & Blink State Tracker
  const blinkStateRef = useRef({
    calibratedFrames: 0,
    openEyeBaseline: 0, // dynamic baseline
    isEyesOpen: false,
    hasClosed: false,
    closedTimestamp: null
  });

  // Reset internal states on activation
  useEffect(() => {
    let isMounted = true;
    verifiedRef.current = false;
    setIsVerified(false);
    setProgress(0);
    setMatchError(null);
    setLastScorePercent(null);
    descriptorSamplesRef.current = [];

    blinkStateRef.current = {
      calibratedFrames: 0,
      openEyeBaseline: 0,
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
          setPromptText(isEnrollment ? 'Kedipkan Mata' : 'Kedipkan Mata');
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
  }, [isActive, isEnrollment]);

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

  // Process Landmarks, Enforce Frontal Face, and Strict 2-Phase Blink & Recognition
  const processFaceResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Oval Guide Parameters calibrated to video aspect ratio
    const minDim = Math.min(canvas.width, canvas.height);
    const ovalCenterX = canvas.width * 0.5;
    const ovalCenterY = canvas.height * 0.48;
    const ovalRadiusX = minDim * 0.28;
    const ovalRadiusY = minDim * 0.40;

    const isPointInsideOval = (pt, factorX = 1.0, factorY = 1.0) => {
      if (!pt) return false;
      const px = pt.x * canvas.width;
      const py = pt.y * canvas.height;
      const dx = (px - ovalCenterX) / (ovalRadiusX * factorX);
      const dy = (py - ovalCenterY) / (ovalRadiusY * factorY);
      return (dx * dx + dy * dy) <= 1.0;
    };

    const hasLandmarks = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
    const landmarks = hasLandmarks ? results.multiFaceLandmarks[0] : null;

    let isInsideOval = false;
    let isFacingSideways = false;
    let isHeadTilted = false;

    if (landmarks) {
      const noseTip = landmarks[1];
      const leftCheek = landmarks[234];
      const rightCheek = landmarks[454];
      const leftEye = landmarks[133];
      const rightEye = landmarks[362];
      const chin = landmarks[152];
      const forehead = landmarks[10];

      if (noseTip && leftCheek && rightCheek && leftEye && rightEye) {
        const isNoseInOval = isPointInsideOval(noseTip, 0.75, 0.75);
        const isLeftEyeInOval = isPointInsideOval(leftEye, 0.95, 0.95);
        const isRightEyeInOval = isPointInsideOval(rightEye, 0.95, 0.95);
        const isChinInOval = isPointInsideOval(chin, 1.0, 1.0);
        const isForeheadInOval = isPointInsideOval(forehead, 1.0, 1.0);

        isInsideOval = isNoseInOval && isLeftEyeInOval && isRightEyeInOval && isChinInOval && isForeheadInOval;

        const leftDist = Math.abs(noseTip.x - leftCheek.x);
        const rightDist = Math.abs(rightCheek.x - noseTip.x);
        const symmetryRatio = leftDist / (rightDist + 0.0001);
        const eyeTilt = Math.abs(leftEye.y - rightEye.y);

        isFacingSideways = symmetryRatio < 0.45 || symmetryRatio > 2.20;
        isHeadTilted = eyeTilt > 0.16;
      }
    }

    setFaceDetected(hasLandmarks);
    setFaceInGuide(isInsideOval);

    // ==========================================
    // 1. DRAW DARK VIGNETTE MASK OUTSIDE OVAL
    // ==========================================
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, 2 * Math.PI);
    ctx.fill('evenodd');
    ctx.restore();

    // ==========================================
    // 2. DRAW GLOWING OVAL BOUNDARY GUIDE
    // ==========================================
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, 2 * Math.PI);
    ctx.lineWidth = 3.5;
    if (matchError) {
      ctx.strokeStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 18;
      ctx.setLineDash([]);
    } else if (isVerified) {
      ctx.strokeStyle = '#22C55E';
      ctx.shadowColor = '#22C55E';
      ctx.shadowBlur = 22;
      ctx.setLineDash([]);
    } else if (hasLandmarks && isInsideOval) {
      ctx.strokeStyle = '#34D399';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 18;
      ctx.setLineDash([]);
    } else if (hasLandmarks && !isInsideOval) {
      ctx.strokeStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 6]);
    } else {
      ctx.strokeStyle = '#64748B';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.setLineDash([8, 6]);
    }
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 3. DRAW ANIMATED LASER SCAN BAR (CLIPPED)
    // ==========================================
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, 2 * Math.PI);
    ctx.clip();

    const time = Date.now() / 1000;
    const laserY = ovalCenterY + Math.sin(time * 2.8) * (ovalRadiusY * 0.88);

    const laserGradient = ctx.createLinearGradient(ovalCenterX - ovalRadiusX, laserY, ovalCenterX + ovalRadiusX, laserY);
    if (matchError) {
      laserGradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      laserGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.95)');
      laserGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.strokeStyle = laserGradient;
      ctx.shadowColor = '#EF4444';
    } else if (hasLandmarks && isInsideOval) {
      laserGradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
      laserGradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.95)');
      laserGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.strokeStyle = laserGradient;
      ctx.shadowColor = '#22C55E';
    } else {
      laserGradient.addColorStop(0, 'rgba(245, 158, 11, 0)');
      laserGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.85)');
      laserGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.strokeStyle = laserGradient;
      ctx.shadowColor = '#F59E0B';
    }
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ovalCenterX - ovalRadiusX, laserY);
    ctx.lineTo(ovalCenterX + ovalRadiusX, laserY);
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 4. DRAW FACIAL LANDMARK DOTS (ONLY INSIDE OVAL)
    // ==========================================
    if (landmarks && isInsideOval) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, 2 * Math.PI);
      ctx.clip(); // 100% Clip Protection

      ctx.fillStyle = matchError ? '#EF4444' : isVerified ? '#22C55E' : '#4ADE80';
      ctx.shadowColor = matchError ? '#DC2626' : '#22C55E';
      ctx.shadowBlur = 4;

      for (let i = 0; i < CONTOUR_LANDMARKS.length; i++) {
        const idx = CONTOUR_LANDMARKS[i];
        const pt = landmarks[idx];
        if (pt && isPointInsideOval(pt, 1.0, 1.0)) {
          const x = pt.x * canvas.width;
          const y = pt.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // ==========================================
    // 5. ENFORCE STRICT VALIDATIONS BEFORE LIVENESS
    // ==========================================
    if (!hasLandmarks) {
      setProgress(0);
      setPromptText('Posisikan Wajah');
      setPromptSubtitle('Arahkan wajah ke dalam batas oval');
      blinkStateRef.current.hasClosed = false;
      blinkStateRef.current.calibratedFrames = 0;
      return;
    }

    if (!isInsideOval) {
      setProgress(0);
      setPromptText('Posisikan Wajah di Dalam Oval');
      setPromptSubtitle('Arahkan wajah Anda tepat ke dalam garis oval');
      blinkStateRef.current.hasClosed = false;
      blinkStateRef.current.calibratedFrames = 0;
      return;
    }

    if (isFacingSideways) {
      setProgress(0);
      setPromptText('Hadapkan Wajah Lurus');
      setPromptSubtitle('Jangan menghadap ke samping');
      blinkStateRef.current.hasClosed = false;
      return;
    }

    if (isHeadTilted) {
      setProgress(0);
      setPromptText('Posisikan Kepala Tegak');
      setPromptSubtitle('Jangan memiringkan kepala');
      blinkStateRef.current.hasClosed = false;
      return;
    }

    // Collect frame sample if position is completely valid
    const currentDesc = extractFaceDescriptor(landmarks);
    if (currentDesc) {
      descriptorSamplesRef.current.push(currentDesc);
      if (descriptorSamplesRef.current.length > 10) {
        descriptorSamplesRef.current.shift();
      }
    }

    // 4. Adaptive Relative Drop Eye-Blink Detection (100% Reliable for all eye shapes)
    const eyeOpenness = getEyeOpenness(landmarks);
    if (!eyeOpenness) return;

    const tracker = blinkStateRef.current;
    if (!matchError) {
      setPromptText(isEnrollment ? 'Kedipkan Mata' : 'Kedipkan Mata');
      setPromptSubtitle('(Tahan 1 Detik)');
    }

    // Step A: Calibrate the user's OPEN eye baseline
    if (tracker.calibratedFrames < 8) {
      tracker.openEyeBaseline = tracker.openEyeBaseline === 0 
        ? eyeOpenness 
        : Math.max(tracker.openEyeBaseline, eyeOpenness);
      tracker.calibratedFrames += 1;
      tracker.isEyesOpen = true;
      setProgress(20);
      return;
    }

    // Keep updating the maximum open eye ratio if user opens eyes wider
    if (eyeOpenness > tracker.openEyeBaseline) {
      tracker.openEyeBaseline = (tracker.openEyeBaseline * 0.8) + (eyeOpenness * 0.2);
    }

    const baseline = tracker.openEyeBaseline;
    const isEyesClosed = eyeOpenness <= (baseline * 0.60) || eyeOpenness < 0.12;
    const isEyesOpen = eyeOpenness >= (baseline * 0.80);

    // Phase 1: User is looking at camera with open eyes
    if (isEyesOpen) {
      tracker.isEyesOpen = true;

      // If user PREVIOUSLY CLOSED their eyes and has NOW RE-OPENED them:
      // => 1X COMPLETE NATURAL BLINK (Open ➔ Closed ➔ Reopened)!
      if (tracker.hasClosed && !verifiedRef.current) {
        setProgress(100);
        handleBlinkComplete(landmarks);
        return;
      }

      tracker.closedTimestamp = null;
      setProgress(25);
    } 
    // Phase 2: User CLOSES their eyes (Blinking or Closed Hold)
    else if (isEyesClosed && tracker.isEyesOpen) {
      tracker.hasClosed = true;
      if (!tracker.closedTimestamp) {
        tracker.closedTimestamp = Date.now();
      }

      const closedDuration = Date.now() - tracker.closedTimestamp;
      const pct = Math.min(100, Math.round(50 + (closedDuration / 200) * 50));
      setProgress(pct);

      // If held closed for >= 200ms: Complete blink!
      if (closedDuration >= 200 && !verifiedRef.current) {
        setProgress(100);
        handleBlinkComplete(landmarks);
      }
    }
  };

  /**
   * Called when physical blink is completed.
   * Performs Face Descriptor extraction, Master Biometric Comparison or Enrollment.
   */
  const handleBlinkComplete = (landmarks) => {
    if (verifiedRef.current) return;

    // 1. Extract high quality descriptor (average of recent samples + current)
    const currentDescriptor = extractFaceDescriptor(landmarks);
    const samples = [...descriptorSamplesRef.current];
    if (currentDescriptor) samples.push(currentDescriptor);

    const finalDescriptor = averageFaceDescriptors(samples) || currentDescriptor;

    // ENROLLMENT MODE: Perekaman Master Biometrik Baru
    if (isEnrollment) {
      verifiedRef.current = true;
      setIsVerified(true);
      setProgress(100);
      setPromptText('✓ Master Wajah Terekam');
      setPromptSubtitle('Biometrik berhasil disimpan!');

      if (navigator.vibrate) {
        try { navigator.vibrate([80, 40, 80]); } catch (e) {}
      }

      if (onLivenessSuccess) {
        setTimeout(() => {
          onLivenessSuccess({
            descriptor: finalDescriptor,
            isMatch: true,
            scorePercent: 100
          });
        }, 200);
      }
      return;
    }

    // ATTENDANCE MODE: Cek Kemiripan Wajah dengan Master Profile (1:1 Face Matching)
    let isMatch = true;
    let scorePercent = 100;
    let similarityVal = 1.0;

    // If masterFaceDescriptor exists, enforce strict biometrics matching
    if (masterFaceDescriptor && Array.isArray(masterFaceDescriptor) && masterFaceDescriptor.length > 0) {
      const matchResult = compareFaceDescriptors(finalDescriptor, masterFaceDescriptor, 0.78);
      isMatch = matchResult.isMatch;
      scorePercent = matchResult.scorePercent;
      similarityVal = matchResult.similarity;
      setLastScorePercent(scorePercent);

      if (!isMatch) {
        // MISMATCH DETECTED: Wajah Teman / Orang Lain!
        setMatchError(`Wajah tidak cocok (${scorePercent}%). Absensi ditolak!`);
        setPromptText('❌ Wajah Tidak Sesuai!');
        setPromptSubtitle(`Kemiripan ${scorePercent}% (Minimal 78%)`);
        setProgress(0);
        blinkStateRef.current.hasClosed = false;

        // Vibrate warning
        if (navigator.vibrate) {
          try { navigator.vibrate([200, 100, 200]); } catch (e) {}
        }

        if (onMatchFailed) {
          onMatchFailed({
            scorePercent,
            similarity: similarityVal,
            message: `Wajah yang terdeteksi tidak cocok dengan data biometrik terdaftar (${scorePercent}%). Titip absen tidak diperkenankan!`
          });
        }

        // Reset after 2.8 seconds so user can re-try with valid face
        setTimeout(() => {
          setMatchError(null);
          setPromptText('Kedipkan Mata');
          setPromptSubtitle('(Tahan 1 Detik)');
          verifiedRef.current = false;
        }, 2800);

        return;
      }
    }

    // MATCHED & VERIFIED
    verifiedRef.current = true;
    setIsVerified(true);
    setProgress(100);
    setPromptText('✓ Wajah Terverifikasi');
    setPromptSubtitle(`Kemiripan ${scorePercent}% • Memproses presensi...`);

    if (navigator.vibrate) {
      try { navigator.vibrate([80, 40, 80]); } catch (e) {}
    }

    if (onLivenessSuccess) {
      setTimeout(() => {
        onLivenessSuccess({
          descriptor: finalDescriptor,
          isMatch: true,
          scorePercent,
          similarity: similarityVal
        });
      }, 250);
    }
  };

  const handleManualTriggerSuccess = () => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    setIsVerified(true);
    setProgress(100);
    setPromptText('✓ Verifikasi Berhasil');
    setPromptSubtitle('Memproses...');

    if (onLivenessSuccess) {
      setTimeout(() => {
        onLivenessSuccess({
          descriptor: null,
          isMatch: true,
          scorePercent: 100
        });
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
    matchError,
    lastScorePercent,
    triggerManualSuccess: handleManualTriggerSuccess
  };
}
