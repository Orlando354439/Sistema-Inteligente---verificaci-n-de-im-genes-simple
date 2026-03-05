#Archivo de configuración principal del sistema inteligente
from fastapi import FastAPI
from pydantic import BaseModel
#import model
from IA.Cliente_IA import Obtain_response as response
from dotenv import load_dotenv
import os
import logging



load_dotenv()


# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sistema Inteligente de Respuestas a Imágenes", description="Un sistema que procesa imágenes y responde a preguntas relacionadas con ellas utilizando IA.")

#Endpoint para almacenar imagen (de manera individual) y cargar al modelo - gemini parece ser es el unico de agrapa


#img: bytes
@app.post("/upload_image/")
def upload_image(prompt: str):
    # Aquí se procesaría la imagen y se cargaría al modelo
    logger.info("Received image upload request with prompt: %s", prompt)
    AiResponse = response(prompt)

    return {"response": AiResponse}
    
if __name__ == "__main__":
    logger.info("Starting the FastAPI server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


