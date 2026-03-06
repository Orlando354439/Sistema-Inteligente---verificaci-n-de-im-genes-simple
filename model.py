from pydantic import BaseModel, Field
from fastapi import UploadFile
from typing import List, Optional


class Image(BaseModel):
    img: UploadFile = Field(..., description="Imagen en formato de bytes")
    prompt: str = Field(..., description="Pregunta del usuario relacionada con la imagen")
    DigitalNotes: Optional[bool] = Field(False, description="Indica si se desea obtener notas digitales de la imagen")
    ClasificationDocuments: Optional[bool] = Field(False, description="Indica si se desea clasificar documentos relacionados con la imagen")
    RelevantInfo: Optional[bool] = Field(False, description="Indica si se desea obtener información relevante de la imagen")



#FALTARÍA SABER SI ES NECESARIO GUARDAR ALGUN HISTORIAL DE IMÁGENES.