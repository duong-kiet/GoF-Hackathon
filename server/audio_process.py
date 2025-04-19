# # from tensorflow.keras.models import load_model
# import tensorflow as tf
# import numpy as np
# import librosa
# import os

# current_dir = os.path.dirname(__file__) 
# model_path = os.path.abspath(os.path.join(current_dir, '..', 'cnn_audio.h5'))


# def predict_voice(model, audio_file_path, genre_mapping):

#     signal, sample_rate = librosa.load(audio_file_path, sr=22050)
#     mfcc = librosa.feature.mfcc(y=signal, sr=sample_rate, n_mfcc=13, n_fft=2048, hop_length=512)
#     mfcc = mfcc.T
#     mfcc = np.resize(mfcc, (130, 13, 1))
#     mfcc = mfcc[np.newaxis, ...]
#     prediction = model.predict(mfcc)
#     predicted_index = np.argmax(prediction, axis=1)
#     genre_label = genre_mapping[predicted_index[0]]
#     # print("Raw prediction:", prediction)
#     return prediction, genre_label

# # model = tf.keras.models.load_model(model_path)

# def process_audio_with_model(file_path):
#     model = tf.keras.models.load_model(model_path)

#     genre_mapping = {0: "fake", 1: "real"}
#     audio_file = file_path
#     predicted_voice = predict_voice(model, audio_file, genre_mapping)

#     prediction, genre_label = predicted_voice

#     if genre_label == 'fake':
#         return {
#             "Dự đoán": "Fake",
#             "Độ tin cậy": float(prediction[0][1])
#         }
#     else:
#         return {
#             "Dự đoán": "Real",
#             "Độ tin cậy": float(prediction[0][1])
#         }

# test_path = os.path.abspath(os.path.join(current_dir, '..', 'audio', 'music.wav'))
# print(process_audio_with_model(test_path))

# from tensorflow.keras.models import load_model
import tensorflow as tf
import numpy as np
import librosa
import os

current_dir = os.path.dirname(__file__) 
model_path = os.path.abspath(os.path.join(current_dir, '..', 'cnn_asvspoof_2021.h5'))


def predict_voice(model, audio_file_path, genre_mapping):

    signal, sample_rate = librosa.load(audio_file_path, sr=22050)
    mfcc = librosa.feature.mfcc(y=signal, sr=sample_rate, n_mfcc=13, n_fft=2048, hop_length=512)
    mfcc = mfcc.T
    mfcc = np.resize(mfcc, (130, 13, 1))
    mfcc = mfcc[np.newaxis, ...]
    prediction = model.predict(mfcc)
    predicted_index = np.argmax(prediction, axis=1)
    genre_label = genre_mapping[predicted_index[0]]
    # print("Raw prediction:", prediction)
    return prediction, genre_label

# model = tf.keras.models.load_model(model_path)

def process_audio_with_model(file_path):
    model = tf.keras.models.load_model(model_path)

    genre_mapping = {0: "fake", 1: "real"}
    audio_file = file_path
    predicted_voice = predict_voice(model, audio_file, genre_mapping)

    prediction, genre_label = predicted_voice

    if genre_label == 'fake':
        return {
            "Dự đoán": "Fake",
            "Độ tin cậy": float(prediction[0][1])
        }
    else:
        return {
            "Dự đoán": "Real",
            "Độ tin cậy": float(prediction[0][1])
        }

# test_path = os.path.abspath(os.path.join(current_dir, '..', 'audio', 'music.wav'))
# print(process_audio_with_model(test_path))