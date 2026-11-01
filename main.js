const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const videoModeToggle = document.getElementById("video-mode");

const portalVideo = document.createElement("video");
portalVideo.src = "video.mp4";
portalVideo.loop = true;
portalVideo.muted = true;

function setVideoMode(enabled) {
  if (enabled) {
    portalVideo.play().catch(error => {
      videoModeToggle.checked = false;
      console.error("動画演出を再生できませんでした。", error);
    });
  } else {
    portalVideo.pause();
  }
}

videoModeToggle.addEventListener("change", () => {
  setVideoMode(videoModeToggle.checked);
});
setVideoMode(videoModeToggle.checked);

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });
  videoElement.srcObject = stream;

  return new Promise(resolve => {
    videoElement.onloadedmetadata = () => resolve();
  });
}

function resize() {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
}

const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 4,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.drawImage(
    videoElement,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  const landmarks = results.multiHandLandmarks || [];

  if (videoModeToggle.checked && landmarks.length > 0) {
    for (let i = 0; i < landmarks.length; i += 2) {
      const firstHand = landmarks[i];
      const secondHand = landmarks[i + 1];
      const windowPoints = secondHand
        ? [firstHand[8], firstHand[4], secondHand[4], secondHand[8]]
        : [firstHand[8], firstHand[5], firstHand[17], firstHand[4]];

      canvasCtx.save();
      canvasCtx.beginPath();
      canvasCtx.moveTo(
        windowPoints[0].x * canvasElement.width,
        windowPoints[0].y * canvasElement.height
      );
      for (const point of windowPoints.slice(1)) {
        canvasCtx.lineTo(
          point.x * canvasElement.width,
          point.y * canvasElement.height
        );
      }
      canvasCtx.closePath();
      canvasCtx.clip();
      canvasCtx.drawImage(
        portalVideo,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      canvasCtx.restore();
    }
  }

  for (const lm of landmarks) {
    drawConnectors(canvasCtx, lm, HAND_CONNECTIONS);
    drawLandmarks(canvasCtx, lm);
  }
}

async function main() {
  await startCamera();
  resize();

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
  });

  camera.start();
}

main();