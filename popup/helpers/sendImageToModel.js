export default async function sendImageToModel(blobs) {
    try {
      // Tạo form data
      const formData = new FormData();

      blobs.forEach((blob, index) => {
        formData.append('files', blob, `image-capture-${index}.png`);
      });

      // formData.append('image_file', blob, 'image-capture.png');

      console.log("FormData", formData)
      
      const response = await fetch('http://localhost:8000/images', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log("Kết quả phân tích ảnh:", data);
      return data;
    } catch (error) {
      console.error('Lỗi khi gửi ảnh đến model:', error);
      return null;
    }
  }
  