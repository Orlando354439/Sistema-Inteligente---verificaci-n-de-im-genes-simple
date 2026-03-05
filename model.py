from pydantic import BaseModel, field
from typing import List, Optional


class Image(BaseModel):
    UserQuestion: str = field(..., description="Pregunta del usuario relacionada con la imagen")



#FALTARÍA SABER SI ES NECESARIO GUARDAR ALGUN HISTORIAL DE IMÁGENES.