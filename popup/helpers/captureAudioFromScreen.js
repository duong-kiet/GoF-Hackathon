import sendAudioToModel from "./sendAudioToModel.js";

export default async function captureAudioFromScreen(stream, onResultCallback) {
  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length === 0) {
    console.error('Không tìm thấy audio track trong stream');
    onResultCallback({ audioResult: null });
    return;
  } else {
    console.log("Đã có audio track");
  }


  // Tạo MediaRecorder để thu audio
  const audioStream = new MediaStream(audioTracks);
  const mediaRecorder = new MediaRecorder(audioStream);
  const audioChunks = [];
  let segmentCount = 0;

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

    // Sau khi capture xong, xử lý
    
    try {
      const audioResult = await sendAudioToModel(audioBlob);
      // Gửi batch ảnh đến model (giả sử sendImageToModel có thể xử lý mảng blob)
      
      // Gọi callback với cả kết quả audio
      onResultCallback({
          segmentId: currentSegment,
          timestamp: new Date(),
          audioResult: audioResult,
      });

    } catch (error) {
      console.error(`Lỗi khi xử lý đoạn #${currentSegment}:`, error);
    }


    // Bắt đầu ghi lại audio cho đoạn tiếp theo
    if (mediaRecorder.state !== 'recording') {
      mediaRecorder.start();
    }
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
      console.log("Đã dừng thu âm và video từ màn hình");
    }
  };
}