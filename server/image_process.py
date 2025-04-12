import numpy as np
import cv2
import os
import tensorflow as tf

# UPLOAD_DIR_IMAGE = r'C:\Users\Admin\Documents\Code\daily chill\GDSC-Hackathon-new\image'

current_dir = os.path.dirname(__file__) 
model_path = os.path.abspath(os.path.join(current_dir, '..', 'model.keras'))
UPLOAD_DIR_IMAGE = os.path.abspath(os.path.join(current_dir, '..', 'image'))

def ELA(image_path, quality=90):
    temp_path = UPLOAD_DIR_IMAGE + "\\" + "temp.jpg"
    original_image = cv2.imread(UPLOAD_DIR_IMAGE + "\\" + image_path)
    cv2.imwrite(temp_path, original_image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    temp_image = cv2.imread(temp_path)
    ELA_image = cv2.absdiff(original_image, temp_image)
    ELA_image = ELA_image.astype(np.uint8)
    os.remove(temp_path)
    return ELA_image

def load(image_dir, img_size = (299, 299)):
    images = []
    
    for i in os.listdir(image_dir):
        image = ELA(i)
        image = cv2.resize(image, img_size)
        images.append(image)
    
    return images

# image_dir = os.path.abspath(os.path.join(current_dir, '..', 'image'))

Xception = tf.keras.models.load_model(model_path)

def process_image_with_model(file_paths):
    images = load(file_paths)
    normal_images = np.array(images).astype('float32') / 255

    y_pred = Xception.predict(normal_images, batch_size=4)
    y_pred_class = np.argmax(y_pred, axis=1)
    
    real = np.count_nonzero(y_pred_class==1)
    print(real/len(y_pred_class))
    if real > len(y_pred_class) / 2:
        return {
            "Dự đoán": "Real",
            "Độ tin cậy": real/len(y_pred_class)
        }
    else:
        return {
            "Dự đoán": "Fake",
            "Độ tin cậy": (1 - real/len(y_pred_class))
        }

# UPLOAD_DIR_IMAGE = r'C:\Users\Admin\Documents\Code\daily chill\GDSC-Hackathon-new\image'

# print(process_image_with_model(UPLOAD_DIR_IMAGE))

