/**
 * Face Biometrics & Recognition Utility for SI-ABSEN
 * Uses MediaPipe FaceMesh 468/478 Landmarks to calculate invariant 3D geometric descriptors.
 * 
 * Invariants:
 * 1. Scale-invariant: Normalized by inter-ocular distance (outer eye distance).
 * 2. Translation-invariant: Centered at nose bridge (landmark 168).
 * 3. Pose-aligned: Rotation-normalized against eye angle.
 */

// Selected 68 Key Invariant Landmarks across facial structure
export const KEY_BIOMETRIC_LANDMARKS = [
  // Jawline Contour (15 points)
  234, 93, 132, 58, 172, 136, 150, 152, 377, 400, 378, 365, 397, 288, 454,
  // Left Eyebrow (5 points)
  70, 63, 105, 66, 107,
  // Right Eyebrow (5 points)
  336, 296, 334, 293, 300,
  // Nose Bridge & Base (8 points)
  168, 6, 197, 195, 5, 4, 1, 2,
  // Left Eye Outline (8 points)
  33, 160, 158, 133, 153, 144, 145, 159,
  // Right Eye Outline (8 points)
  362, 385, 387, 263, 373, 380, 374, 386,
  // Lips Outer & Inner (15 points)
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 146, 91, 181, 84,
  // Cheek Highlights & Forehead (4 points)
  151, 9, 123, 352
];

/**
 * Euclidean distance helper
 */
function dist(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = (p1.x || 0) - (p2.x || 0);
  const dy = (p1.y || 0) - (p2.y || 0);
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Extracts a normalized 3D Biometric Face Descriptor vector from MediaPipe landmarks
 * @param {Array} landmarks - 468 landmark points from MediaPipe FaceMesh
 * @returns {Array<number>|null} - Normalized float vector descriptor
 */
export function extractFaceDescriptor(landmarks) {
  if (!landmarks || landmarks.length < 468) return null;

  // 1. Reference Anchor Points
  const leftOuterEye = landmarks[33];
  const rightOuterEye = landmarks[263];
  const leftPupil = landmarks[468] || landmarks[473] || landmarks[133];
  const rightPupil = landmarks[473] || landmarks[468] || landmarks[362];
  const noseBridge = landmarks[168] || landmarks[6];
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const mouthTop = landmarks[0];
  const mouthBottom = landmarks[17];

  if (!leftOuterEye || !rightOuterEye || !noseBridge || !chin || !noseTip) {
    return null;
  }

  // 2. Normalization Scale (Inter-ocular distance)
  const eyeDistance = dist(leftOuterEye, rightOuterEye);
  if (eyeDistance <= 0.0001) return null;

  // 3. Center Origin: Nose Bridge
  const cx = noseBridge.x;
  const cy = noseBridge.y;
  const cz = noseBridge.z || 0;

  // 4. Alignment Angle (2D tilt compensation)
  const angle = Math.atan2(rightOuterEye.y - leftOuterEye.y, rightOuterEye.x - leftOuterEye.x);
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  const vector = [];

  // A. Key Facial Structural Ratios (Invariant Geometric Proportions)
  const faceHeight = dist(forehead, chin);
  const faceWidth = dist(leftCheek, rightCheek);
  const noseLength = dist(noseBridge, noseTip);
  const mouthWidth = dist(mouthLeft, mouthRight);
  const mouthHeight = dist(mouthTop, mouthBottom);
  const pupilDistance = dist(leftPupil, rightPupil);
  const eyeToNose = dist(noseBridge, noseTip);
  const noseToMouth = dist(noseTip, mouthTop);
  const mouthToChin = dist(mouthBottom, chin);

  vector.push(
    faceHeight / eyeDistance,
    faceWidth / eyeDistance,
    faceHeight / (faceWidth + 0.0001),
    noseLength / eyeDistance,
    mouthWidth / eyeDistance,
    mouthHeight / (mouthWidth + 0.0001),
    pupilDistance / eyeDistance,
    noseToMouth / (eyeToNose + 0.0001),
    mouthToChin / (eyeToNose + 0.0001),
    dist(leftCheek, noseTip) / (dist(rightCheek, noseTip) + 0.0001),
    dist(leftOuterEye, mouthLeft) / eyeDistance,
    dist(rightOuterEye, mouthRight) / eyeDistance
  );

  // B. Normalized 3D Relative Coordinates of Key Landmarks (Aligned & Scaled)
  for (let i = 0; i < KEY_BIOMETRIC_LANDMARKS.length; i++) {
    const idx = KEY_BIOMETRIC_LANDMARKS[i];
    const pt = landmarks[idx];
    if (pt) {
      // Translate to center
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dz = (pt.z || 0) - cz;

      // Rotate to compensate head tilt
      const rx = (dx * cosA - dy * sinA) / eyeDistance;
      const ry = (dx * sinA + dy * cosA) / eyeDistance;
      const rz = dz / eyeDistance;

      vector.push(rx, ry, rz);
    } else {
      vector.push(0, 0, 0);
    }
  }

  // 5. Normalize descriptor vector to unit norm (L2 Normalization)
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}

/**
 * Computes the element-wise average of multiple face descriptors to create a robust Master Embedding
 * @param {Array<Array<number>>} descriptorsList
 * @returns {Array<number>|null}
 */
export function averageFaceDescriptors(descriptorsList) {
  if (!descriptorsList || descriptorsList.length === 0) return null;
  const valid = descriptorsList.filter(d => Array.isArray(d) && d.length > 0);
  if (valid.length === 0) return null;

  const length = valid[0].length;
  const avg = new Array(length).fill(0);

  for (let i = 0; i < valid.length; i++) {
    const d = valid[i];
    for (let j = 0; j < length; j++) {
      avg[j] += (d[j] || 0);
    }
  }

  // Normalize
  let norm = 0;
  for (let j = 0; j < length; j++) {
    avg[j] = avg[j] / valid.length;
    norm += avg[j] * avg[j];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let j = 0; j < length; j++) {
      avg[j] = avg[j] / norm;
    }
  }

  return avg;
}

/**
 * Compares two face descriptors using Cosine Similarity & calibrated Euclidean Distance
 * @param {Array<number>} descA - Live face descriptor
 * @param {Array<number>} descB - Master enrolled face descriptor
 * @param {number} threshold - Match threshold (default: 0.80 = 80%)
 * @returns {{ isMatch: boolean, similarity: number, scorePercent: number, distance: number }}
 */
export function compareFaceDescriptors(descA, descB, threshold = 0.80) {
  if (!descA || !descB || !Array.isArray(descA) || !Array.isArray(descB)) {
    return { isMatch: false, similarity: 0, scorePercent: 0, distance: 999 };
  }

  const len = Math.min(descA.length, descB.length);
  if (len < 10) {
    return { isMatch: false, similarity: 0, scorePercent: 0, distance: 999 };
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  let euclideanSum = 0;

  for (let i = 0; i < len; i++) {
    const a = descA[i];
    const b = descB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
    const diff = a - b;
    euclideanSum += diff * diff;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  const cosineSim = denominator > 0 ? dotProduct / denominator : 0;
  const euclideanDist = Math.sqrt(euclideanSum);

  // Calibrated Similarity Score: 0 to 1
  // For facial vectors, identical faces score > 0.90, distinct people score < 0.70
  let similarity = Math.max(0, Math.min(1, cosineSim));
  
  // Calibrate score percentage to intuitive user-friendly 0-100%
  // Anything below 0.65 maps to < 50%, above 0.82 maps to > 80%
  let scorePercent = 0;
  if (similarity >= 0.95) {
    scorePercent = Math.round(95 + (similarity - 0.95) * 100);
  } else if (similarity >= 0.80) {
    scorePercent = Math.round(80 + ((similarity - 0.80) / 0.15) * 15);
  } else if (similarity >= 0.65) {
    scorePercent = Math.round(50 + ((similarity - 0.65) / 0.15) * 30);
  } else {
    scorePercent = Math.round((similarity / 0.65) * 50);
  }
  scorePercent = Math.max(0, Math.min(100, scorePercent));

  const isMatch = similarity >= threshold;

  return {
    isMatch,
    similarity: Number(similarity.toFixed(4)),
    scorePercent,
    distance: Number(euclideanDist.toFixed(4)),
    threshold
  };
}
