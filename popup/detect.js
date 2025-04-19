import switchToPage from "./helpers/switchToPage.js";

// Tạo loading indicator
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.display = 'none';
loadingIndicator.style.position = 'fixed';
loadingIndicator.style.top = '50%';
loadingIndicator.style.left = '50%';
loadingIndicator.style.transform = 'translate(-50%, -50%)';
loadingIndicator.style.background = 'white';
loadingIndicator.style.color = 'white';
loadingIndicator.style.padding = '20px';
loadingIndicator.style.borderRadius = '8px';
loadingIndicator.style.zIndex = '1000';
// loadingIndicator.innerHTML = `
//     <div style="display: flex; align-items: center; gap: 10px;">
//         <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
//         <span style="font-size: 18px; color: blue">Đang quay về trang chủ...</span>
//     </div>
// `;

// Hàm cập nhật nội dung loading indicator
function updateLoadingMessage(message) {
  loadingIndicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
        <span style="font-size: 18px; color: blue">${message}</span>
    </div>
  `;
}

document.body.appendChild(loadingIndicator);

// Hàm hiển thị/ẩn loading indicator
function showLoading(message = "Đang xử lý...") {
  updateLoadingMessage(message);
  loadingIndicator.style.display = 'block';
}

function hideLoading() {
  loadingIndicator.style.display = 'none';
}


const orginalHeight = document.body.offsetHeight
chrome.runtime.sendMessage({ action: 'resizeWindow', orginalHeight });

import captureAudioFromScreen from "./helpers/captureAudioFromScreen.js";
import sendImageToModel from "./helpers/sendImageToModel.js";

let detectionVoice = null;
let detectionFace = null;


function handleResultAudio(data) {
  const { audioResult } = data;

  detectionVoice = audioResult?.result;

  const voiceDetection = document.querySelector("#voice-detection");
  if (detectionVoice) {
      const colorVoice = detectionVoice["Dự đoán"] === "Real" ? "green" : "red";
      voiceDetection.innerHTML = `
          <p style="color: blue"><strong>Nhận dạng giọng nói:</strong></p>
          <p>Kết quả: <span style="color: ${colorVoice}; font-weight: 800;">${detectionVoice["Dự đoán"]}</span></p>
          <p><strong>Độ tin cậy:</strong> ${detectionVoice["Độ tin cậy"].toFixed(5)}</p>
          <div class="confidence-bar">
              <div class="confidence-level" style="width: ${detectionVoice["Độ tin cậy"] * 100}%"></div>
          </div>
      `;
      hideLoading();

  } else {
      voiceDetection.innerHTML = `<p style="color: blue"><strong>Nhận dạng giọng nói:</strong></p><p>Chưa có dữ liệu</p>`;
    }
}

function handleResultImage(data) {
  // const { result } = data;

  detectionFace = data?.result;

  const faceDetection = document.querySelector("#face-detection");
  if (detectionFace) {
      const colorFace = detectionFace["Dự đoán"] === "Real" ? "green" : "red";
      faceDetection.innerHTML = `
          <p style="color: blue"><strong>Nhận dạng khuôn mặt:</strong></p>
          <p>Kết quả: <span style="color: ${colorFace}; font-weight: 800;">${detectionFace["Dự đoán"]}</span></p>
          <p><strong>Độ tin cậy:</strong> ${detectionFace["Độ tin cậy"].toFixed(5)}</p>
          <div class="confidence-bar">
              <div class="confidence-level" style="width: ${detectionFace["Độ tin cậy"] * 100}%"></div>
          </div>
      `;

      hideLoading();

  } else {
      faceDetection.innerHTML = `<p style="color: blue"><strong>Nhận dạng khuôn mặt:</strong></p><p>Chưa có dữ liệu</p>`;
  }
}

let imageBlobs = [];

const containerVideo = document.querySelector('.container-video');
const video = document.getElementById('video');

const videoWrapper = document.createElement('div');
videoWrapper.style.position = 'relative';
videoWrapper.style.width = '100%';
videoWrapper.style.margin = '20px 0 10px';
containerVideo.appendChild(videoWrapper);

videoWrapper.appendChild(video);
// video.style.width = '100%';
// video.style.display = 'block';

showLoading("Đang tải mô hình...")
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('../face_detection_models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('../face_detection_models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('../face_detection_models'),
]);
hideLoading()

// Khởi động media
async function startMedia() {
  showLoading("Khởi tạo media")
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        // video: true,
        audio: { suppressLocalAudioPlayback: true },
    });
    video.srcObject = stream;

    // Đợi video sẵn sàng
    await new Promise(resolve => {
        video.onloadedmetadata = () => {
          video.classList.remove("not-loaded")
            video.play();
            resolve();
        };
    });

    chrome.runtime.sendMessage({ action: 'resizeWindow', height:720 });

    // Khởi động audio
    const audioCapture = await captureAudioFromScreen(stream, handleResultAudio);
    showLoading()

    hideLoading();
    return { stream, audioCapture };
  } catch (err) {
      console.error("Lỗi khi lấy stream:", err);
      const stateLoading = document.querySelector(".state-loading")
      stateLoading.style.color = "red"
      stateLoading.innerText = "Yêu cầu quyền truy cập tab"
      showLoading("Đang quay về trang chủ...");

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'resizeWindow', height:438 });
        switchToPage('popup/index.html');
        hideLoading();
      }, 5000)
      throw err;
  }
}

const faceCanvas = document.createElement('canvas');

// Xử lý image
const processImages = async (canvas) => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.offsetWidth;
  tempCanvas.height = video.offsetHeight;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  const detections = await faceapi.detectAllFaces(tempCanvas, new faceapi.TinyFaceDetectorOptions());
  const resizedDetections = faceapi.resizeResults(detections, { width: video.offsetWidth, height: video.offsetHeight });

  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  faceapi.draw.drawDetections(canvas, resizedDetections);

  if (resizedDetections.length > 0) {
      const detection = resizedDetections[0];
      let { x, y, width, height } = detection.box;

      const padding = 20;
      x = Math.max(0, x - padding);
      y = Math.max(0, y - padding);
      width = Math.min(video.offsetWidth - x, width + 2 * padding);
      height = Math.min(video.offsetHeight - y, height + 2 * padding);

      // Giới hạn kích thước faceCanvas
      const maxCanvasSize = 300;
      const scale = Math.min(maxCanvasSize / width, maxCanvasSize / height, 1);
      faceCanvas.width = width * scale;
      faceCanvas.height = height * scale;
      const faceCtx = faceCanvas.getContext('2d');
      faceCtx.drawImage(tempCanvas, x, y, width, height, 0, 0, faceCanvas.width, faceCanvas.height);

      await new Promise(resolve => {
        faceCanvas.toBlob(blob => {
          if (blob && imageBlobs.length < 20) {
              imageBlobs.push(blob);
          }
          resolve();
        }, 'image/png', 0.95);
      });
      
      // Nếu đủ 20 frame, gửi tới mô hình
  if (imageBlobs.length >= 20) {
    const blobsToSend = [...imageBlobs]; // Sao chép để gửi, giữ nguyên imageBlobs để tiếp tục thu thập
    imageBlobs.length = 0; // Xóa danh sách để bắt đầu nhóm mới
    try {
      const result = await sendImageToModel(blobsToSend);
      handleResultImage(result);
      showLoading();
    } catch (error) {
      console.error("Lỗi khi gửi ảnh tới mô hình:", error);
    }
  } 
} else {
  handleResultImage(null);
}
};

// Khởi động media và xử lý
const { stream, audioCapture } = await startMedia();

// Bắt đầu xử lý image khi video phát
video.addEventListener('play', () => {
    const stateLoading = document.querySelector(".state-loading")
    stateLoading.classList.add("hidden")

    showLoading("Đang xử lý kết quả...");

    // Tạo canvas một lần duy nhất
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    videoWrapper.appendChild(canvas);

    faceapi.matchDimensions(canvas, { width: video.offsetWidth, height: video.offsetHeight });

    const imageInterval = setInterval(() => processImages(canvas), 500);
  
    video.addEventListener('ended', () => {
        clearInterval(imageInterval);
    });
});

// Thêm nút dừng
const stopButton = document.createElement('button');
stopButton.innerText = "🛑 Dừng";
stopButton.style = "width: 100%; margin-top: 20px";
containerVideo.appendChild(stopButton);

stopButton.addEventListener('click', () => {
  showLoading("Đang dừng...");
  audioCapture.stopCapture()
  video.classList.add('not-loaded')
  video.srcObject = null;

  setTimeout(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.remove(tabs[0].id);
    });
  }, 3000)

  // stream.getTracks().forEach(track => track.stop());
  // containerVideo.removeChild(videoWrapper);
  // containerVideo.removeChild(stopButton);

  // video.classList.add('not-loaded')
  // handleResultAudio(null);
  // handleResultImage(null);
  // video.srcObject = null;
  // imageBlobs = [];
});