from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import time
import os

from app.pipeline import PromptEnhancer

app = FastAPI(
    title="Prompt Optimizer API",
    description="API para optimizar prompts de estudiantes usando técnicas de ingeniería de prompts",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones desde el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes (cambia a tu dominio específico para mayor seguridad)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Modelos de datos
class PromptRequest(BaseModel):
    """Modelo para la solicitud de optimización de prompt"""
    text: str = Field(..., min_length=10, max_length=2000, description="Prompt original del estudiante")
    model: Optional[str] = Field(default="gpt-4o-mini", description="Modelo de IA a utilizar")
    include_explanation: Optional[bool] = Field(default=True, description="Incluir explicación de cambios")

class PromptResponse(BaseModel):
    """Modelo para la respuesta de optimización"""
    success: bool
    original_prompt: str
    optimized_prompt: str
    explanation: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]


# Endpoints
@app.get("/")
async def root():
    """Endpoint raíz - información de la API"""
    return {
        "message": "Bienvenido a la API de Optimización de Prompts",
        "version": "1.0.0",
        "endpoints": {
            "/optimize": "POST - Optimizar un prompt",
            "/health": "GET - Verificar estado del servicio",
            "/docs": "GET - Documentación interactiva"
        }
    }


@app.get("/health")
async def health_check():
    """Verificar el estado del servicio"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "Prompt Optimizer API"
    }


@app.post("/optimize", response_model=PromptResponse)
async def optimize_prompt(request: PromptRequest):

    try:
        start_time = time.time()
        
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=500,
                detail="API key de OpenAI no configurada. Por favor configura la variable de entorno OPENAI_API_KEY"
            )
        
        if request.model == "gpt-4o":
            i_cost = 5 / 10**6
            o_cost = 15 / 10**6
        elif request.model == "gpt-4o-mini":
            i_cost = 0.15 / 10**6
            o_cost = 0.6 / 10**6
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Modelo '{request.model}' no soportado. Usa 'gpt-4o' o 'gpt-4o-mini'"
            )
        
        enhancer = PromptEnhancer(model=request.model)
        
        result = await enhancer.enhance_prompt(request.text)
        
        elapsed_time = time.time() - start_time
        
        # Calcular costo aproximado
        approximate_cost = (enhancer.prompt_tokens * i_cost) + (enhancer.completion_tokens * o_cost)
        
        explanation = None
        if request.include_explanation:
            explanation = {
                "expanded_prompt": result.get("expanded_prompt", ""),
                "decomposition_and_reasoning": result.get("decomposition_and_reasoninng", ""),
                "suggested_enhancements": result.get("suggested_enhancements", ""),
                "changes_summary": "El prompt ha sido mejorado con claridad, estructura y contexto adicional para obtener mejores resultados."
            }
        
        # Construir respuesta
        response = PromptResponse(
            success=True,
            original_prompt=request.text,
            optimized_prompt=result if isinstance(result, str) else result.get("advanced_prompt", ""),
            explanation=explanation,
            metadata={
                "model": request.model,
                "elapsed_time_seconds": round(elapsed_time, 2),
                "prompt_tokens": enhancer.prompt_tokens,
                "completion_tokens": enhancer.completion_tokens,
                "approximate_cost_usd": round(approximate_cost, 6),
                "timestamp": time.time()
            }
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el prompt: {str(e)}"
        )


@app.get("/models")
async def get_available_models():
    """Obtener lista de modelos disponibles"""
    return {
        "models": [
            {
                "id": "gpt-4o-mini",
                "name": "GPT-4o Mini",
                "description": "Modelo rápido y económico, recomendado para estudiantes",
                "cost_per_1k_tokens": {
                    "input": 0.15 / 1000,
                    "output": 0.6 / 1000
                }
            },
            {
                "id": "gpt-4o",
                "name": "GPT-4o",
                "description": "Modelo más potente para optimizaciones complejas",
                "cost_per_1k_tokens": {
                    "input": 5 / 1000,
                    "output": 15 / 1000
                }
            }
        ]
    }


# Manejo de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Manejador global de excepciones"""
    return {
        "success": False,
        "error": str(exc),
        "detail": "Ha ocurrido un error inesperado. Por favor, intenta nuevamente."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

