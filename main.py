#Archivo de configuración principal del sistema inteligente
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
#from model import Image 
from IA.Cliente_IA import Obtain_response as response
from dotenv import load_dotenv
import os
import logging
import base64

# environment variables
load_dotenv()


# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sistema Inteligente de Respuestas a Imágenes", description="Un sistema que procesa imágenes y responde a preguntas relacionadas con ellas utilizando IA.")

#Endpoint para almacenar imagen (de manera individual) y cargar al modelo - gemini parece ser es el unico de agrapa
@app.post("/upload_image/")
async def upload_image(
    img: UploadFile = File(..., description="Imagen en formato de bytes"),
    prompt: str = Form(..., description="Pregunta del usuario relacionada con la imagen"),
    DigitalNotes: Optional[bool] = Form(False, description="Indica si se desea obtener notas digitales de la imagen"),
    ClasificationDocuments: Optional[bool] = Form(False, description="Indica si se desea clasificar documentos relacionados con la imagen"),
    RelevantInfo: Optional[bool] = Form(False, description="Indica si se desea obtener información relevante de la imagen")
):
    # Aquí se procesaría la imagen y se cargaría al modelo
    logger.info("Received image upload request with prompt: %s", prompt)

    if img.content_type not in ["image/jpeg", "image/png"]:
        logger.error("Unsupported image format: %s", img.content_type)
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are allowed.")
    
    try:
        # Leer la imagen y convertirla a base64 para enviarla al modelo
        logger.info("Processing the uploaded image: %s", img.filename)
        image_bytes = await img.read()

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        image_part = {
            "inline_data": {
                "mime_type": img.content_type,
                "data": image_b64
            }
        }

    except Exception as e:
        logger.error("Error processing the uploaded image: %s", str(e))
        raise HTTPException(status_code=500, detail="Error processing the uploaded image.")

    logger.info("Image processed successfully, sending to AI model for response generation.")

    full_prompt = prompt

    if DigitalNotes:
        full_prompt += "Obtener notas digitales de la imagen"
        logger.info("Digital Notes option selected.")
    
    elif ClasificationDocuments:
        full_prompt += "Clasificar documentos en la imagen"
        logger.info("Classification of Documents option selected.")

    elif RelevantInfo:
        full_prompt += "Obtener información relevante de la imagen"
        logger.info("Relevant Information option selected.")

    else:
        full_prompt = prompt
        logger.info("No specific option selected, using default prompt.")

    

    AiResponse = response(image_part, full_prompt)

    return JSONResponse(content={
        "filename": img.filename,
        "prompt": full_prompt,
        "ai_response": AiResponse.text
    })


if __name__ == "__main__":
    logger.info("Starting the FastAPI server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


