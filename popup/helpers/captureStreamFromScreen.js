import sendAudioToModel from "./sendAudioToModel.js";
import sendImageToModel from "./sendImageToModel.js";

export default async function captureStreamFromScreen(stream, onResultCallback) {
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length === 0) {
    console.error('Không tìm thấy audio track trong stream');
    return;
  } else {
    console.log("Đã có audio track");
  }

  if (videoTracks.length === 0) {
    console.error('Không tìm thấy video track trong stream');
    return;
  } else {
    console.log("Đã có video track");
  }

  const videoTrack = videoTracks[0]; // Lấy track video đầu tiên

  // Tạo MediaRecorder để thu audio
  const audioStream = new MediaStream(audioTracks);
  const mediaRecorder = new MediaRecorder(audioStream);
  const audioChunks = [];
  let segmentCount = 0;
  let imageBlobs = []; // Mảng lưu các blob ảnh

  // Khởi tạo ImageCapture từ video track
  const imageCapture = new ImageCapture(videoTrack);

  // Thu thập dữ liệu audio khi có sẵn
  mediaRecorder.addEventListener('dataavailable', event => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  });

  // Xử lý khi dừng ghi
  mediaRecorder.addEventListener('stop', async () => {
    segmentCount++;
    const currentSegment = segmentCount;

    // Tạo blob từ chunks đã thu
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    audioChunks.length = 0;

    // Capture 20 frame trong 5 giây
    const framePromises = [];
    const startTime = Date.now();
    for (let i = 0; i < 20; i++) {
      framePromises.push(new Promise(async resolve => {
        const delay = (i * 5000) / 20; // Phân bố đều 20 frame trong 5 giây (250ms mỗi frame)
        setTimeout(async () => {
          try {
            const bitmap = await imageCapture.grabFrame();
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

            await new Promise(blobResolve => {
              canvas.toBlob(blob => {
                if (blob) {
                  imageBlobs.push(blob);
                }
                blobResolve();
              }, 'image/png', 0.95); // Nén chất lượng 95% để giảm kích thước
            });
            resolve();
          } catch (error) {
            console.error('Lỗi khi capture frame:', error);
            resolve(); // Tiếp tục dù có lỗi
          }
        }, delay);
      }));
    }

    await Promise.all(framePromises);
    const endTime = Date.now();
    console.log(`Capture 20 frames completed in ${endTime - startTime}ms`);

    // Sau khi capture xong, xử lý
    if (imageBlobs.length > 0) {
      try {
        const audioResult = await sendAudioToModel(audioBlob);

        // Gửi batch ảnh đến model (giả sử sendImageToModel có thể xử lý mảng blob)
        const imageResult = await sendImageToModel(imageBlobs)
       
        // Gọi callback với cả kết quả audio và image
        onResultCallback({
          segmentId: currentSegment,
          timestamp: new Date(),
          audioResult: audioResult,
          imageResult: imageResult,
        });

        imageBlobs.length = 0; // Reset sau khi gửi
      } catch (error) {
        console.error(`Lỗi khi xử lý đoạn #${currentSegment}:`, error);
      }
    }

    // Bắt đầu ghi lại audio cho đoạn tiếp theo
    mediaRecorder.start();
  });

  // Bắt đầu ghi
  mediaRecorder.start();

  // Thiết lập timer để cắt audio và frame mỗi 5 giây
  const intervalId = setInterval(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, 5000);

  // Trả về đối tượng điều khiển
  return {
    stopCapture: () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      clearInterval(intervalId);
      audioTracks.forEach(track => track.stop());
      videoTracks.forEach(track => track.stop());
      console.log("Đã dừng thu âm và video từ màn hình");
    }
  };
}