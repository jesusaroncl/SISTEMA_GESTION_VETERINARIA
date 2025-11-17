# backend/generador_audio.py

import numpy as np
from scipy.io.wavfile import write
import os

# --- Configuración copiada de tu script de Colab ---
SR = 4000
DURACION = 10
BPM = 90

def generar_latido(sr=4000, duracion=0.8, severidad=0):
    """Genera un latido con murmullo sintético según severidad."""
    t = np.linspace(0, duracion, int(sr*duracion))
    s1 = np.exp(-((t-0.1)**2)/(2*(0.01)**2))
    s2 = np.exp(-((t-0.6)**2)/(2*(0.01)**2))
    murmullo = np.random.randn(len(t)) * (0.02 + 0.05*severidad)
    if severidad > 0:
        freq = 100 * (1 + severidad)
        murmullo += 0.02 * np.sin(2*np.pi*freq*t)
    return s1 + murmullo + s2

def generar_pcg(sr=4000, duracion=10, bpm=90, severidad=0):
    """Genera un fonocardiograma completo."""
    latido_duracion = 60 / bpm
    n_latidos = int(duracion / latido_duracion)
    señal = np.concatenate([
        generar_latido(sr, latido_duracion, severidad)
        for _ in range(n_latidos)
    ])
    señal = señal / np.max(np.abs(señal))
    señal = np.convolve(señal, np.ones(10)/10, mode='same')
    return señal

def guardar_wav(ruta, señal, sr=4000):
    """Guarda el archivo WAV."""
    señal_int16 = (señal * 32767).astype(np.int16)
    write(ruta, sr, señal_int16)

# --- Script principal para generar el archivo de prueba ---
if __name__ == "__main__":
    
    # 1. Generar audio para Fase "C_D" (Alto Riesgo)
    # Usamos severidad=2, que corresponde a "C_D" en tu Colab
    print("Generando audio de prueba (Alto Riesgo, Severidad=2)...")
    señal_alto_riesgo = generar_pcg(SR, DURACION, BPM, severidad=2)
    
    # 2. Guardar el archivo en la carpeta 'backend'
    ruta_salida = "audio_prueba_ALTO_RIESGO.wav"
    guardar_wav(ruta_salida, señal_alto_riesgo, SR)
    
    print(f"\n¡Éxito! Audio de prueba guardado como: {os.path.abspath(ruta_salida)}")
    print("Sube este archivo a la aplicación.")