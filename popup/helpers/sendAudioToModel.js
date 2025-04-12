export default async function sendAudioToModel(blob) {
  try {
    // Tạo form data
    const formData = new FormData();
    formData.append('audio_file', blob, 'audio-recording.wav');
    
    const response = await fetch('http://localhost:8000/audio', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    console.log("Kết quả phân tích:", data);
    return data;
  } catch (error) {
    console.error('Lỗi khi gửi audio đến model:', error);
    return null;
  }
}
