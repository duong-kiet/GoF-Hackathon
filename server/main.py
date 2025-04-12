from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import asyncio
import os
import uuid
from typing import List
import uvicorn
from audio_process import process_audio_with_model
from image_process import process_image_with_model
from pydub import AudioSegment
import subprocess
import io
from PIL import Image
import numpy as np

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_dir = os.path.dirname(__file__) 

# Đảm bảo thư mục audio tồn tại
UPLOAD_DIR_AUDIO = os.path.abspath(os.path.join(current_dir, '..', 'audio'))
os.makedirs(UPLOAD_DIR_AUDIO, exist_ok=True)

# Đảm bảo thư mục image tồn tại
UPLOAD_DIR_IMAGE = os.path.abspath(os.path.join(current_dir, '..', 'image'))
os.makedirs(UPLOAD_DIR_IMAGE, exist_ok=True)

# Kiểm tra định dạng file audio
def is_valid_audio(filename: str) -> bool:
    valid_extensions = [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".webm"]
    file_ext = os.path.splitext(filename)[1].lower()
    return file_ext in valid_extensions

# API endpoint để nhận file audio
@app.post("/audio")
async def process_audio(audio_file: UploadFile = File(...)):
    # Kiểm tra định dạng file
    if not is_valid_audio(audio_file.filename):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file âm thanh (mp3, wav, ogg, flac, m4a, webm)")
    
    print(audio_file) 

    # Tạo tên file duy nhất
    file_extension = os.path.splitext(audio_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR_AUDIO, unique_filename)
    # Lưu file
    try:
        content = await audio_file.read()
      
        audio_data = io.BytesIO(content)

        audio = AudioSegment.from_file(audio_data)
            
        # Export sang WAV với đầy đủ header
        audio.export(file_path, format="wav")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu file: {str(e)}")
    
    try:
        # Gọi model để xử lý audio
        result = process_audio_with_model(file_path)
        
        # Xóa file sau khi xử lý xong
        os.remove(file_path)
        
        return {
            "success": True,
            "message": "Xử lý audio thành công",
            # "filename": audio_file.filename,
            "result": result
        }
    
    except Exception as e:
        # Xóa file nếu xử lý thất bại
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý audio: {str(e)}")


# Hàm kiểm tra định dạng file hình ảnh hợp lệ
def is_valid_image(filename: str) -> bool:
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'} 
    return os.path.splitext(filename.lower())[1] in valid_extensions

@app.post("/images")
async def process_image(files: list[UploadFile] = File(...)):
    # Kiểm tra tất cả file đều hợp lệ
    for file in files:
        if not is_valid_image(file.filename):
            raise HTTPException(status_code=400, detail=f"File {file.filename} không phải là hình ảnh hợp lệ")

    image_paths = []

    try:
        # Lưu tất cả file (tùy chọn)
        for file in files:
            file_extension = '.png'  
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR_IMAGE, unique_filename)

            content = await file.read()
            with open(file_path, 'wb') as f:
                f.write(content)

            # Chuyển đổi và lưu lại dưới dạng PNG
            with Image.open(file_path) as img:
                img = img.convert('RGB')
                img.save(file_path, 'PNG')

            image_paths.append(file_path)

        # Xử lý batch
        result = process_image_with_model(UPLOAD_DIR_IMAGE)

        return {
            "success": True,
            "message": "Xử lý tập hình ảnh thành công",
            # "filenames": [file.filename for file in files],
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý tập hình ảnh: {str(e)}")

    finally:
        # Xóa tất cả file sau khi xử lý
        for path in image_paths:
            if os.path.exists(path):
                os.remove(path)



# API endpoint để kiểm tra server
@app.get("/")
def read_root():
    return {"message": "server is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)