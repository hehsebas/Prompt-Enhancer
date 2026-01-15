from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from supabase import create_client, Client
import time
import os
from datetime import timedelta
from dotenv import load_dotenv


load_dotenv()

from app.pipeline import PromptEnhancer

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(
    title="Prompt Optimizer API",
    description="API para optimizar prompts de estudiantes usando técnicas de ingeniería de prompts",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Cambiar a la URL del frontend
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

class UserSignUp(BaseModel):
    """Modelo para registro de usuario"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Contraseña")
    plan: Optional[str] = Field(default="Free")

class UserLogin(BaseModel):
    """Modelo para inicio de sesión"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Modelo para respuesta de usuario"""
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None
    token: Optional[str] = None


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


@app.post("/auth/signup", response_model=UserResponse)
async def signup(user_data: UserSignUp):
    """Registrar un nuevo usuario usando Supabase Auth"""
    try:
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "username": user_data.username,
                    "plan": user_data.plan
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=400,
                detail="Error al registrar el usuario"
            )
        
        try:
            supabase.table("users").insert({
                "id": auth_response.user.id,  # Usar el mismo ID de auth.users
                "username": user_data.username,
                "email": auth_response.user.email,
                "plan": user_data.plan
            }).execute()
        except Exception as e:
            print(f"[WARNING] No se pudo insertar en tabla users: {e}")

        access_token = auth_response.session.access_token if auth_response.session else "pending_verification"
        
        message = "Usuario registrado exitosamente"
        if not auth_response.session:
            message += ". Por favor verifica tu email para activar tu cuenta"
        
        return UserResponse(
            success=True,
            message=message,
            user={
                "id": auth_response.user.id,
                "username": user_data.username,
                "email": auth_response.user.email,
                "plan": user_data.plan
            },
            token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en el registro: {str(e)}"
        )


@app.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    """Iniciar sesión usando Supabase Auth"""
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=401,
                detail="Credenciales inválidas"
            )
        
        user_data_response = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        if user_data_response.data:
            user_info = user_data_response.data[0]
            username = user_info["username"]
            plan = user_info["plan"]
        else:
            user_metadata = auth_response.user.user_metadata or {}
            username = user_metadata.get("username", credentials.email.split('@')[0])
            plan = user_metadata.get("plan", "Free")
        
        return UserResponse(
            success=True,
            message="Inicio de sesión exitoso",
            user={
                "id": auth_response.user.id,
                "username": username,
                "email": auth_response.user.email,
                "plan": plan
            },
            token=auth_response.session.access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en el inicio de sesión: {str(e)}"
        )
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
        
        approximate_cost = (enhancer.prompt_tokens * i_cost) + (enhancer.completion_tokens * o_cost)
        
        explanation = None
        if request.include_explanation:
            explanation = {
                "expanded_prompt": result.get("expanded_prompt", ""),
                "decomposition_and_reasoning": result.get("decomposition_and_reasoninng", ""),
                "suggested_enhancements": result.get("suggested_enhancements", ""),
                "changes_summary": "El prompt ha sido mejorado con claridad, estructura y contexto adicional para obtener mejores resultados."
            }
        
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
