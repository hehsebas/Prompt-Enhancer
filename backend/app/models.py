from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ChatCreate(BaseModel):
    """Modelo para crear un nuevo chat"""
    title: Optional[str] = Field(default="Nuevo Chat", max_length=200)
    tags: Optional[List[str]] = Field(default_factory=list)


class ChatUpdate(BaseModel):
    """Modelo para actualizar un chat existente"""
    title: Optional[str] = Field(None, max_length=200)
    tags: Optional[List[str]] = None
    is_archived: Optional[bool] = None


class Chat(BaseModel):
    """Modelo de respuesta para un chat"""
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    tags: List[str]
    message_count: Optional[int] = 0
    last_message_at: Optional[datetime] = None

class MessageCreate(BaseModel):
    """Modelo para crear un nuevo mensaje"""
    chat_id: UUID
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)
    original_prompt: Optional[str] = None
    parent_message_id: Optional[UUID] = None
    
    # Metadata (solo para mensajes del asistente)
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    cost_usd: Optional[float] = None
    generation_time_seconds: Optional[float] = None


class Message(BaseModel):
    """Modelo de respuesta para un mensaje"""
    id: UUID
    chat_id: UUID
    user_id: UUID
    role: str
    content: str
    original_prompt: Optional[str] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    cost_usd: Optional[float] = None
    generation_time_seconds: Optional[float] = None
    parent_message_id: Optional[UUID] = None
    iteration_number: int
    created_at: datetime


class ConversationRequest(BaseModel):
    """Modelo para solicitar una respuesta en una conversación"""
    chat_id: Optional[UUID] = None  # None para crear un nuevo chat
    user_message: str = Field(..., min_length=1, max_length=2000)
    parent_message_id: Optional[UUID] = None  # Para iteraciones
    model: Optional[str] = Field(default="gpt-4o-mini")


class ConversationResponse(BaseModel):
    """Modelo de respuesta para una conversación"""
    success: bool
    chat_id: UUID
    user_message: Message
    assistant_message: Message
    is_iteration: bool = False


class ChatSearchParams(BaseModel):
    """Parámetros para búsqueda de chats"""
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    is_archived: Optional[bool] = False
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    order_by: str = Field(default="updated_at", pattern="^(created_at|updated_at|title)$")
    order_direction: str = Field(default="desc", pattern="^(asc|desc)$")


class ChatExport(BaseModel):
    """Modelo para exportar un chat completo"""
    chat: Chat
    messages: List[Message]
    export_date: datetime
    format: str = "json"  # json, markdown, txt
