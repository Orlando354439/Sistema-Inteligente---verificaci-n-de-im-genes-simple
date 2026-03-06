#AQUÍ SE CREARÁ EL CLIENTE DE LA IA, QUE SE COMUNICARÁ CON EL SERVIDOR DE LA IA PARA OBTENER RESPUESTAS A LAS IMÁGENES DEL USUARIO.

from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "")
client = genai.Client(api_key=API_KEY)

def Obtain_response(img, prompt:str):
    # Aquí se procesaría la imagen y se cargaría al modelo

    #Primero procesar texto para pruebas
    response = client.models.generate_content(
        model="gemini-2.5-flash",

        contents = [img, prompt]
    )
    return response

if __name__ == "__main__":
    prompt = "¿Cómo estás?"
    response = Obtain_response(prompt)
    print(response)



#DOCS PARA image understanding: https://ai.google.dev/gemini-api/docs/image-understanding