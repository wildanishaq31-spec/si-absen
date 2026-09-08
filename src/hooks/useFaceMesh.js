import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Calculates Euclidean distance between two 2D/3D points
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

export function useFaceMesh({ videoRef, canvasRef, isActive, onLivenessSuccess }) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInGuide, setFaceInGuide] = useState(false);
  const [promptText, setPromptText] = useState('Menyiapkan Pemindai Biometrik...');
  const [promptSubtitle, setPromptSubtitle] = useState('Harap tunggu sebentar');
  const [challenge, setChallenge] = useState('BLINK'); // 'BLINK' | 'STEADY'
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isVerified, setIsVerified] = useState(false);

  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const blinkStateRef = useRef({ hasOpened: false, hasClosed: false, closedStartTime: null });
  const steadyStartTimeRef = useRef(null);
  const verifiedRef = useRef(false);

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    let isMounted = true;
    verifiedRef.current = false;
    setIsVerified(false);
    setProgress(0);
    blinkStateRef.current = { hasOpened: false, hasClosed: false, closedStartTime: null };
    steadyStartTimeRef.current = null;

    if (!isActive) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const initFaceMesh = async () => {
      try {
        setIsModelLoading(true);
        setPromptText('Memuat AI Biometrik...');
        setPromptSubtitle('Menginisialisasi MediaPipe FaceMesh');

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
          setPromptText('Posisikan Wajah di Lingkaran');
          setPromptSubtitle('Pastikan seluruh wajah terlihat jelas');
        }
      } catch (err) {
        console.warn('FaceMesh AI initialization warning (fallback active):', err);
        if (isMounted) {
          setIsModelLoading(false);
          setPromptText('Posisikan Wajah di Lingkaran');
          setPromptSubtitle('Tahan posisi wajah untuk mengambil foto');
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
        // Continue loop even if one frame fails
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

  // Process Landmarks, Draw Green Dots, and Check Liveness (Blink)
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
      setPromptText('Posisikan Wajah di Lingkaran');
      setPromptSubtitle('Wajah belum terdeteksi');
      blinkStateRef.current = { hasOpened: false, hasClosed: false, closedStartTime: null };
      steadyStartTimeRef.current = null;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    setFaceDetected(true);

    // Check if face is roughly centered inside the oval guide (0.35 to 0.65 in normalized x/y)
    const noseTip = landmarks[1]; // Nose tip landmark
    const isCentered = noseTip && noseTip.x > 0.30 && noseTip.x < 0.70 && noseTip.y > 0.25 && noseTip.y < 0.75;
    setFaceInGuide(isCentered);

    // Draw Glowing Green Mesh Points (as seen in the screenshot!)
    ctx.save();
    // If front camera mirrored:
    ctx.fillStyle = '#4ADE80';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 4;

    const totalLandmarks = landmarks.length;
    // Draw dots for landmarks with optimal density
    for (let i = 0; i < totalLandmarks; i++) {
      // Draw key landmark points (face contour, lips, eyes, eyebrows, nose)
      const pt = landmarks[i];
      const x = pt.x * canvas.width;
      const y = pt.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();

    if (!isCentered) {
      setPromptText('Posisikan Wajah di Tengah');
      setPromptSubtitle('Arahkan wajah tepat ke dalam lingkaran');
      setProgress(20);
      return;
    }

    // Liveness Detection: Eye Aspect Ratio (EAR) for Blink Detection
    const leftEAR = calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    const BLINK_THRESHOLD = 0.19; // Closed eyes threshold
    const OPEN_THRESHOLD = 0.24;  // Open eyes threshold

    if (challenge === 'BLINK') {
      setPromptText('Kedipkan Mata');
      setPromptSubtitle('(Tahan 1 Detik)');

      if (avgEAR > OPEN_THRESHOLD) {
        blinkStateRef.current.hasOpened = true;
      }

      if (blinkStateRef.current.hasOpened && avgEAR < BLINK_THRESHOLD) {
        if (!blinkStateRef.current.closedStartTime) {
          blinkStateRef.current.closedStartTime = Date.now();
        }
        
        const closedDuration = Date.now() - blinkStateRef.current.closedStartTime;
        const currentProgress = Math.min(100, Math.round((closedDuration / 600) * 100));
        setProgress(currentProgress);

        if (closedDuration >= 500 && !verifiedRef.current) {
          // Liveness Blink Verified!
          handleVerificationSuccess();
        }
      } else {
        if (!blinkStateRef.current.hasClosed) {
          setProgress(prev => Math.max(25, prev - 5));
        }
        blinkStateRef.current.closedStartTime = null;
      }
    } else {
      // Steady hold challenge fallback
      if (!steadyStartTimeRef.current) {
        steadyStartTimeRef.current = Date.now();
      }
      const steadyDuration = Date.now() - steadyStartTimeRef.current;
      const currentProgress = Math.min(100, Math.round((steadyDuration / 1200) * 100));
      setProgress(currentProgress);
      setPromptText('Tahan Posisi Wajah');
      setPromptSubtitle('Memverifikasi biometrik...');

      if (steadyDuration >= 1200 && !verifiedRef.current) {
        handleVerificationSuccess();
      }
    }
  };

  const handleVerificationSuccess = () => {
    verifiedRef.current = true;
    setIsVerified(true);
    setProgress(100);
    setPromptText('✨ Verifikasi Berhasil!');
    setPromptSubtitle('Mencocokkan data biometrik pegawai...');

    // Haptic feedback if available on mobile
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    if (onLivenessSuccess) {
      setTimeout(() => {
        onLivenessSuccess();
      }, 500);
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
    challenge,
    setChallenge,
    triggerManualSuccess: handleVerificationSuccess
  };
}
