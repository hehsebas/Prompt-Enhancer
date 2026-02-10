from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import time
import os
import json
from dotenv import load_dotenv
from uuid import UUID


load_dotenv()

from app.pipeline import PromptEnhancer
from app.chat_service import ChatService
from app.models import (
    Chat, ChatCreate, ChatUpdate, ChatSearchParams,
    Message, MessageCreate, ConversationRequest, ConversationResponse
)

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
    text: str = Field(..., min_length=1, max_length=2000, description="Prompt original del usuario")
    model: Optional[str] = Field(default="gemini-2.5-flash", description="Modelo de IA a utilizar")

class PromptResponse(BaseModel):
    """Modelo para la respuesta de optimización"""
    success: bool
    original_prompt: str
    optimized_prompt: str
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
    """Endpoint simplificado - ya no se usa en producción"""
    raise HTTPException(
        status_code=410,
        detail="Este endpoint está deprecado. Usa /conversation/stream en su lugar"
    )


@app.post("/optimize/stream")
async def optimize_prompt_stream(request: PromptRequest):
    """Endpoint simplificado - ya no se usa en producción"""
    raise HTTPException(
        status_code=410,
        detail="Este endpoint está deprecado. Usa /conversation/stream en su lugar"
    )


@app.get("/models")
async def get_available_models():
    """Obtener lista de modelos disponibles"""
    return {
        "models": [
            {
                "id": "gemini-2.5-flash-latest-exp",
                "name": "GPT-4o Mini",
                "description": "Modelo rápido y económico, recomendado para estudiantes",
                "cost_per_1k_tokens": {
                    "input": 0.15 / 1000,
                    "output": 0.6 / 1000
                }
            }
        ]
    }


@app.post("/generate-title")
async def generate_title(request: dict):
    """
    Genera un título inteligente para un chat basado en el mensaje del usuario.
    Usa IA para interpretar el contenido.
    """
    try:
        user_message = request.get("message", "")
        model = request.get("model", "gemini-2.5-flash")
        
        if not user_message or len(user_message.strip()) == 0:
            return {"title": "Nuevo Chat"}
        
        enhancer = PromptEnhancer(model=model)
        title = await enhancer.generate_chat_title(user_message)
        
        return {"title": title}
        
    except Exception as e:
        print(f"Error generando título: {str(e)}")
        # En caso de error, devolver un título genérico
        return {"title": "Nuevo Chat"}


# =====================================================
# SISTEMA DE CHATS Y CONVERSACIONES
# =====================================================

# Dependencia para obtener el user_id del header de autorización
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extraer user_id del token de autorización"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    # En producción, aquí deberías validar el token JWT de Supabase
    # Por ahora, asumimos que el frontend envía el user_id en el header
    # Format: "Bearer {user_id}"
    try:
        user_id = authorization.replace("Bearer ", "")
        return user_id
    except:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_optional_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extraer user_id del token de autorización (opcional para modo invitado)"""
    if not authorization or authorization.strip() == "":
        return None
    
    try:
        user_id = authorization.replace("Bearer ", "").strip()
        # Si después de limpiar está vacío, retornar None
        if not user_id:
            return None
        return user_id
    except:
        return None


# Instancia del servicio de chats
chat_service = ChatService()


@app.post("/chats", response_model=Chat)
async def create_chat(
    chat_data: ChatCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Crear un nuevo chat"""
    try:
        return await chat_service.create_chat(user_id, chat_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats", response_model=List[Chat])
async def list_chats(
    query: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated tags
    is_archived: bool = False,
    limit: int = 20,
    offset: int = 0,
    order_by: str = "updated_at",
    order_direction: str = "desc",
    user_id: str = Depends(get_current_user_id)
):
    """Listar chats del usuario con filtros"""
    try:
        params = ChatSearchParams(
            query=query,
            tags=tags.split(",") if tags else None,
            is_archived=is_archived,
            limit=limit,
            offset=offset,
            order_by=order_by,
            order_direction=order_direction
        )
        return await chat_service.list_chats(user_id, params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats/{chat_id}", response_model=Chat)
async def get_chat(
    chat_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Obtener un chat por ID"""
    try:
        chat = await chat_service.get_chat(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        return chat
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/chats/{chat_id}", response_model=Chat)
async def update_chat(
    chat_id: str,
    update_data: ChatUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Actualizar un chat"""
    try:
        return await chat_service.update_chat(chat_id, user_id, update_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chats/{chat_id}")
async def delete_chat(
    chat_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Eliminar un chat"""
    try:
        success = await chat_service.delete_chat(chat_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        return {"success": True, "message": "Chat eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats/{chat_id}/messages", response_model=List[Message])
async def get_messages(
    chat_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Obtener todos los mensajes de un chat"""
    try:
        return await chat_service.get_messages(chat_id, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chats/{chat_id}/messages", response_model=Message)
async def create_message(
    chat_id: str,
    message_data: MessageCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Crear un nuevo mensaje en un chat"""
    try:
        return await chat_service.create_message(user_id, message_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/conversation", response_model=ConversationResponse)
async def create_conversation(
    request: ConversationRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Endpoint simplificado - ya no se usa en producción"""
    raise HTTPException(
        status_code=410,
        detail="Este endpoint está deprecado. Usa /conversation/stream en su lugar"
    )


@app.post("/conversation/stream")
async def create_conversation_stream(
    request: ConversationRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Crear o continuar una conversación con streaming.
    Mejora el prompt del usuario aplicando principios de ingeniería de prompts.
    Soporta modo invitado (sin user_id) - no guarda en DB.
    """
    try:
        chat_id = None
        user_message_id = None
        
        # Solo crear/usar chat si hay usuario autenticado
        if user_id:
            # Crear chat si no existe
            if not request.chat_id:
                chat = await chat_service.create_chat(
                    user_id,
                    ChatCreate(title="Nuevo Chat")
                )
                chat_id = chat.id
            else:
                chat_id = request.chat_id
            
            # Guardar mensaje del usuario
            user_message = await chat_service.create_message(
                user_id,
                MessageCreate(
                    chat_id=chat_id,
                    role="user",
                    content=request.user_message
                )
            )
            user_message_id = user_message.id
        else:
            # Modo invitado: generar IDs temporales
            chat_id = None
            user_message_id = f"guest-{int(time.time() * 1000)}"
        
        async def generate():
            try:
                start_time = time.time()
                enhancer = PromptEnhancer(model=request.model)
                
                # Enviar información del chat y mensaje del usuario
                yield f"data: {json.dumps({'type': 'chat_info', 'chat_id': str(chat_id) if chat_id else None, 'user_message_id': str(user_message_id)})}\n\n"
                
                # Enviar evento de inicio
                yield f"data: {json.dumps({'type': 'start', 'message': 'Mejorando tu prompt...'})}\n\n"
                
                # Obtener el prompt mejorado con streaming
                full_response = ""
                async for chunk in enhancer.enhance_prompt_stream(request.user_message):
                    full_response += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                
                elapsed_time = time.time() - start_time
                
                # Calcular costos para Gemini (gratis en tier free)
                approximate_cost = 0.0
                
                # Guardar respuesta del asistente solo si hay usuario autenticado
                assistant_message_id = None
                if user_id:
                    assistant_message = await chat_service.create_message(
                        user_id,
                        MessageCreate(
                            chat_id=chat_id,
                            role="assistant",
                            content=full_response,
                            original_prompt=request.user_message,
                            model=request.model,
                            tokens_used=enhancer.prompt_tokens + enhancer.completion_tokens,
                            cost_usd=approximate_cost,
                            generation_time_seconds=elapsed_time,
                            parent_message_id=request.parent_message_id
                        )
                    )
                    assistant_message_id = str(assistant_message.id)
                else:
                    # Modo invitado: generar ID temporal
                    assistant_message_id = f"guest-{int(time.time() * 1000)}"
                
                # Enviar metadata final
                metadata = {
                    "type": "done",
                    "assistant_message_id": assistant_message_id,
                    "metadata": {
                        "model": request.model,
                        "elapsed_time_seconds": round(elapsed_time, 2),
                        "prompt_tokens": enhancer.prompt_tokens,
                        "completion_tokens": enhancer.completion_tokens,
                        "approximate_cost_usd": round(approximate_cost, 6),
                        "timestamp": time.time(),
                        "is_iteration": request.parent_message_id is not None
                    }
                }
                yield f"data: {json.dumps(metadata)}\n\n"
                
            except Exception as e:
                error_data = {
                    "type": "error",
                    "message": str(e)
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats/{chat_id}/export")
async def export_chat(
    chat_id: str,
    format: str = "json",
    user_id: str = Depends(get_current_user_id)
):
    """Exportar un chat completo"""
    try:
        export_data = await chat_service.export_chat(chat_id, user_id, format)
        
        if format == "json":
            return JSONResponse(content=export_data.dict())
        elif format == "markdown":
            # Generar markdown
            md_content = f"# {export_data.chat.title}\n\n"
            md_content += f"**Creado:** {export_data.chat.created_at}\n\n"
            md_content += "---\n\n"
            
            for msg in export_data.messages:
                role_label = "👤 Usuario" if msg.role == "user" else "🤖 Asistente"
                md_content += f"### {role_label}\n\n"
                md_content += f"{msg.content}\n\n"
                if msg.model:
                    md_content += f"*Modelo: {msg.model} | Tokens: {msg.tokens_used} | Costo: ${msg.cost_usd}*\n\n"
                md_content += "---\n\n"
            
            return JSONResponse(content={"format": "markdown", "content": md_content})
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
