// import captureAudioFromScreen from '../decrapted/captureAudioFromScreen.js';
// import captureVideoFromScreen from './helpers/captureVideoFromScreen.js';
import captureStreamFromScreen from './helpers/captureStreamFromScreen.js';

const btnCaptureTab = document.getElementById("btn-capture-tab");
const resultDetection = document.getElementById("result-detection")

function handleResult(data) {
    const { audioResult, imageResult } = data;

    const detectionVoice = audioResult.result
    const detectionFace = imageResult.result

    if (detectionVoice && detectionFace) {
        resultDetection.classList.remove("hidden")
        resultDetection.style.display = "flex";
        resultDetection.style.justifyContent = "center";
        resultDetection.style.gap = "26px"; // Lưu ý: đơn vị "px" cần được thêm vào
    }

    const colorVoice = detectionVoice["Dự đoán"] === "Real" ? "green" : "red";
    const colorFace = detectionFace["Dự đoán"] === "Real" ? "green" : "red";

    const voice_detection = document.querySelector("#voice-detection")
    // voice_detection.innerHTML = `
    //     <p>Kết quả nhận dạng giọng nói: ${detectionVoice["Dự đoán"]}</p>
    //     <p>Độ tin cậy: ${detectionVoice["Độ tin cậy"].toFixed(5)}</p>
    // `;
    voice_detection.innerHTML = `
        <p style="color: blue"><strong>Nhận dạng giọng nói:</strong></p>
        <p>Kết quả: <span style="color: ${colorVoice}; font-weight: 800;">${detectionVoice["Dự đoán"]}</span></p>
        <p><strong>Độ tin cậy:</strong> ${detectionVoice["Độ tin cậy"].toFixed(5)}</p>
        <div class="confidence-bar">
            <div class="confidence-level" style="width: ${detectionVoice["Độ tin cậy"] * 100}%"></div>
        </div>
    `;
    const face_detection = document.querySelector("#face-detection")
    // face_detection.innerHTML = `
    //     <p>Kết quả nhận dạng khuôn mặt: ${detectionFace["Dự đoán"]}</p>
    //     <p>Độ tin cậy: ${detectionFace["Độ tin cậy"]}</p>
    // `;
    face_detection.innerHTML = `
        <p style="color: blue"><strong>Nhận dạng khuôn mặt:</strong></p>
        <p>Kết quả: <span style="color: ${colorFace}; font-weight: 800;">${detectionFace["Dự đoán"]}</span></p>
        <p><strong>Độ tin cậy:</strong> ${detectionFace["Độ tin cậy"].toFixed(5)}</p>
        <div class="confidence-bar">
            <div class="confidence-level" style="width: ${detectionFace["Độ tin cậy"] * 100}%"></div>
        </div>
    `;
}

if (btnCaptureTab) {
    btnCaptureTab.onclick = async function() {
        try {
            // Lấy màn hình tab mình muốn
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: {
                    suppressLocalAudioPlayback: true // Ngăn âm thanh được phát lại cục bộ
                },
                // video: true
            });

            // Lấy video từ stream
            const video = document.getElementById('vid-capture');
            video.classList.remove("hidden")
            video.srcObject = stream;
            video.play();

            // Tắt tiếng cho tất cả các audio tracks nếu có
            stream.getAudioTracks().forEach(track => {
                track.enabled = true;
            });
            
            let startX, startY, endX, endY;
            let isSelecting = false;

            const overlay = document.getElementById('overlay');
            const selectionBox = document.getElementById('selection-box');
            const outputVideo = document.getElementById('output-video');
            const output = document.getElementById('output')
            
            const btnCaptureVid = document.querySelector('#btn-capture-vid') || document.createElement("button");
            if (!document.querySelector('#btn-capture-vid')) {
                btnCaptureVid.id = 'btn-capture-vid';
                btnCaptureVid.innerHTML = '<i class="fa fa-camera""></i> Capture video';
                
                // const main = document.getElementById('main');
                // main.insertBefore(btnCaptureVid, document.getElementById('detection-results'));
            }
            
            const main = document.getElementById('main')
            main.appendChild(btnCaptureVid)

            btnCaptureVid.addEventListener('click', async () => {
                try {
                    overlay.style.display = 'block';

                    // overlay.style.top = `${video.offsetTop}px`;
                    // overlay.style.left = `${video.offsetLeft}px`;
                    // overlay.style.width = `${video.offsetWidth}px`;
                    // overlay.style.height = `${video.offsetHeight}px`;
                   
                    // Add selection events
                    overlay.addEventListener('mousedown', startSelection);
                    overlay.addEventListener('mousemove', updateSelection);
                    overlay.addEventListener('mouseup', endSelection);
    
                    function startSelection(e) {
                        isSelecting = true;
                        startX = e.offsetX; // event.offsetX là một thuộc tính của sự kiện chuột trong JavaScript, giúp bạn lấy tọa độ X (chiều ngang) của con trỏ chuột tương đối với phần tử mà sự kiện được kích hoạt.
                        startY = e.offsetY;
                        
                        selectionBox.style.left = `${startX}px`;
                        selectionBox.style.top = `${startY}px`;
                        selectionBox.style.width = '0px';
                        selectionBox.style.height = '0px';
                        selectionBox.style.display = 'block';
                        // selectionBox.style.position = 'absolute';
                    }
    
                    function updateSelection(e) {
                        if (!isSelecting) return;
    
                        endX = e.offsetX;
                        endY = e.offsetY;
    
                        const width = Math.abs(endX - startX);
                        const height = Math.abs(endY - startY);
    
                        selectionBox.style.width = `${width}px`;
                        selectionBox.style.height = `${height}px`;
                        selectionBox.style.left = `${Math.min(startX, endX)}px`;
                        selectionBox.style.top = `${Math.min(startY, endY)}px`;
                    }
    
                    function endSelection() {
                        isSelecting = false;
                        overlay.style.display = 'none';
                        selectionBox.style.display = 'none';
    
                        const x = parseInt(selectionBox.style.left);
                        const y = parseInt(selectionBox.style.top);
                        const width = parseInt(selectionBox.style.width);
                        const height = parseInt(selectionBox.style.height);
    
                        if (width > 0 && height > 0) {
                            captureRegion(video, x, y, width, height);
                        }
                    }
    
                    async function captureRegion(video, x, y, width, height) {
                        output.classList.remove('hidden')

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Lấy kích thước thực sự của video (nguồn stream)
                        const realWidth = video.videoWidth;
                        const realHeight = video.videoHeight;

                        // Lấy kích thước hiển thị trên trang (có thể bị CSS làm nhỏ đi)
                        const displayWidth = video.clientWidth;
                        const displayHeight = video.clientHeight;

                        // Tính tỷ lệ giữa video thực tế và video hiển thị
                        const scaleX = realWidth / displayWidth;
                        const scaleY = realHeight / displayHeight;

                        // Chuyển đổi tọa độ từ hiển thị sang thực tế
                        const realX = x * scaleX;
                        const realY = y * scaleY;
                        const realWidthRegion = width * scaleX;
                        const realHeightRegion = height * scaleY;

                        // Cập nhật canvas theo vùng chọn đã chuẩn hóa
                        canvas.width = realWidthRegion;
                        canvas.height = realHeightRegion;

                        function drawFrame() {
                            ctx.drawImage(video, realX, realY, realWidthRegion, realHeightRegion, 0, 0, realWidthRegion, realHeightRegion);
                            requestAnimationFrame(drawFrame);
                        }

                        drawFrame();

                        
                        // Tạo stream từ canvas
                        const capturedStream = canvas.captureStream(30);

                        // Thêm audio track từ stream gốc vào capturedStream (nếu có)
                        if (stream.getAudioTracks().length > 0) {
                            stream.getAudioTracks().forEach(track => {
                                capturedStream.addTrack(track);
                            });
                        }

                        outputVideo.srcObject = capturedStream;
                        outputVideo.play();

                        // let result2 = await captureVideoFromScreen(capturedStream, handleResult);
                        
                        // let result = await captureAudioFromScreen(capturedStream, handleResult);

                        let result = await captureStreamFromScreen(capturedStream, handleResult)
                        // setInterval(() => {
                        //     // Lấy ảnh từ canvas dưới dạng URL dữ liệu
                        //     const imageDataUrl = canvas.toDataURL('image/jpeg');
                            
                        //     saveImage(imageDataUrl);
                        // }, 3000); 
                    }
                } catch (err) {
                    console.error('Screen capture error:', err);
                    alert('Failed to capture screen: ' + err.message);
                }
            });
        } catch (error) {
            console.error("Lỗi khi chụp màn hình:", error);
        }
    };
}