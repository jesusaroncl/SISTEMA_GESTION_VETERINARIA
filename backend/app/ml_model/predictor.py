# backend/app/ml_model/predictor.py

import matplotlib
# 1. AÑADIR ESTA LÍNEA PRIMERO:
# Le dice a Matplotlib que no use un backend de GUI (evita el error de tkinter)
matplotlib.use('Agg') 

import numpy as np
from PIL import Image
import tensorflow as tf
import librosa
import librosa.display
import matplotlib.pyplot as plt # 2. 'plt' DEBE importarse DESPUÉS de matplotlib.use('Agg')
import io
import os

matplotlib.use('Agg')

# --- 1. Definir la ruta del modelo RELATIVA a este script ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "modelo_CNN_MR_ACVIM.h5")

class AudioSpectrogramPredictor:
    
    def __init__(self, model_path):
        try:
            self.model = tf.keras.models.load_model(model_path)
            self.img_size = (128, 128) # Tamaño con el que se entrenó (según tu Colab)
            # Mapear índice -> Fase ACVIM (según tu Colab)
            self.labels = {0: "A", 1: "B", 2: "C_D"}
        except Exception as e:
            print(f"ERROR: No se pudo cargar el modelo desde {model_path}")
            print(e)
            self.model = None

    def _audio_to_spectrogram(self, audio_path):
        """
        Convierte una ruta de audio en una imagen de espectrograma en memoria.
        (Lógica adaptada de tu script de Colab)
        """
        # Cargar el archivo de audio (asegurándose de re-muestrear si es necesario)
        y, sr = librosa.load(audio_path, sr=4000) # Usamos SR=4000 (de tu Colab)
        
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        S_dB = librosa.power_to_db(S, ref=np.max)

        # Crear la imagen usando Matplotlib en memoria
        fig = plt.figure(figsize=(4, 4))
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        
        librosa.display.specshow(S_dB, sr=sr, x_axis=None, y_axis=None, cmap='magma', ax=ax)
        
        # Guardar la imagen en un buffer de bytes
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        plt.close(fig) # Cerrar la figura para liberar memoria
        
        buf.seek(0)
        return buf

    def _preprocess_image(self, image_buffer):
        """
        Pre-procesa la imagen (del espectrograma) para el modelo.
        """
        image = Image.open(image_buffer).convert("RGB")
        image = image.resize(self.img_size)
        image = np.array(image) / 255.0 # Normalizar
        image = np.expand_dims(image, axis=0) # Añadir dimensión de batch
        return image

    def predict(self, audio_path):
        """
        Función principal: Audio -> Espectrograma -> Predicción
        """
        if self.model is None:
            raise RuntimeError("El modelo de predicción no está cargado.")
            
        # 1. Convertir audio a espectrograma (en memoria)
        spectrogram_buffer = self._audio_to_spectrogram(audio_path)
        
        # 2. Pre-procesar esa imagen
        x = self._preprocess_image(spectrogram_buffer)
        
        # 3. Predecir
        prediction = self.model.predict(x)
        idx = int(np.argmax(prediction[0]))
        prob = float(np.max(prediction[0]))
        
        # 4. Devolver la fase predicha
        return self.labels[idx]

# --- Instanciar el modelo UNA SOLA VEZ (globalmente) ---
try:
    predictor_instancia = AudioSpectrogramPredictor(MODEL_PATH)
except Exception as e:
    predictor_instancia = None

# --- Función simple para que la API la importe ---
def predecir_soplo_cardiaco(audio_path):
    """
    Función principal llamada por la API.
    Recibe una RUTA a un archivo de audio y devuelve la predicción.
    """
    if predictor_instancia is None:
        raise RuntimeError("El modelo de predicción no está cargado.")
        
    fase_predicha = predictor_instancia.predict(audio_path)
    
    # Mapear el resultado (A, B, C_D) al formato que espera el frontend
    if fase_predicha == "A":
        return "Normal"
    elif fase_predicha == "B":
        return "Riesgo Moderado"
    else: # Fases C o D
        return "Alto Riesgo"