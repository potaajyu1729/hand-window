const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");

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
  maxNumHands: 2,
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

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length < 2) {
    return;
  }

  const handsLM = results.multiHandLandmarks;

  const h1 = handsLM[0];
  const h2 = handsLM[1];

  const p1 = h1[8]; 
  const p2 = h1[4]; 
  const p3 = h2[8];
  const p4 = h2[4];

  const x1 = p1.x * canvasElement.width;
  const y1 = p1.y * canvasElement.height;
  const x2 = p2.x * canvasElement.width;
  const y2 = p2.y * canvasElement.height;
  const x3 = p3.x * canvasElement.width;
  const y3 = p3.y * canvasElement.height;
  const x4 = p4.x * canvasElement.width;
  const y4 = p4.y * canvasElement.height;

  canvasCtx.save();

  canvasCtx.beginPath();
  canvasCtx.moveTo(x1, y1);
  canvasCtx.lineTo(x2, y2);
  canvasCtx.lineTo(x4, y4);
  canvasCtx.lineTo(x3, y3);
  canvasCtx.closePath();
  canvasCtx.clip();

  canvasCtx.drawImage(
    videoElement,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  canvasCtx.restore();

  for (const lm of handsLM) {
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