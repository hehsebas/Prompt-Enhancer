"""
Servicio para gestionar chats y mensajes en Supabase
"""
from supabase import create_client, Client
from typing import List, Optional, Dict, Any
from uuid import UUID
import os
from datetime import datetime

from app.models import (
    Chat, ChatCreate, ChatUpdate, ChatSearchParams,
    Message, MessageCreate, ChatExport
)


class ChatService:
    """Servicio para operaciones CRUD de chats y mensajes"""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Usar service key para operaciones del backend
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados")
        
        self.client: Client = create_client(supabase_url, supabase_key)
    
    async def create_chat(self, user_id: str, chat_data: ChatCreate) -> Chat:
        """Crear un nuevo chat"""
        data = {
            "user_id": user_id,
            "title": chat_data.title,
            "tags": chat_data.tags or []
        }
        
        response = self.client.table("chats").insert(data).execute()
        
        if not response.data:
            raise Exception("Error al crear el chat")
        
        return Chat(**response.data[0])
    
    async def get_chat(self, chat_id: str, user_id: str) -> Optional[Chat]:
        """Obtener un chat por ID"""
        # Primero obtener el chat
        chat_response = self.client.table("chats")\
            .select("*")\
            .eq("id", chat_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not chat_response.data:
            return None
        
        # Contar mensajes
        messages_response = self.client.table("messages")\
            .select("id", count="exact")\
            .eq("chat_id", chat_id)\
            .execute()
        
        chat_data = chat_response.data
        chat_data["message_count"] = messages_response.count or 0
        chat_data["last_message_at"] = None
        
        return Chat(**chat_data)
    
    async def list_chats(self, user_id: str, params: ChatSearchParams) -> List[Chat]:
        """Listar chats del usuario con filtros"""
        query = self.client.table("chats")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("is_archived", params.is_archived)
        
        # Filtro por búsqueda de texto
        if params.query:
            query = query.ilike("title", f"%{params.query}%")
        
        # Filtro por tags
        if params.tags:
            query = query.contains("tags", params.tags)
        
        # Ordenamiento
        query = query.order(params.order_by, desc=(params.order_direction == "desc"))
        
        # Paginación
        query = query.range(params.offset, params.offset + params.limit - 1)
        
        response = query.execute()
        
        # Agregar conteo de mensajes para cada chat
        chats_with_counts = []
        for chat_data in response.data:
            # Contar mensajes para este chat
            messages_response = self.client.table("messages")\
                .select("id", count="exact")\
                .eq("chat_id", chat_data["id"])\
                .execute()
            
            chat_data["message_count"] = messages_response.count or 0
            chat_data["last_message_at"] = None
            chats_with_counts.append(Chat(**chat_data))
        
        return chats_with_counts
    
    async def update_chat(self, chat_id: str, user_id: str, update_data: ChatUpdate) -> Chat:
        """Actualizar un chat"""
        data = {}
        if update_data.title is not None:
            data["title"] = update_data.title
        if update_data.tags is not None:
            data["tags"] = update_data.tags
        if update_data.is_archived is not None:
            data["is_archived"] = update_data.is_archived
        
        if not data:
            # No hay nada que actualizar
            return await self.get_chat(chat_id, user_id)
        
        response = self.client.table("chats")\
            .update(data)\
            .eq("id", chat_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise Exception("Error al actualizar el chat")
        
        return await self.get_chat(chat_id, user_id)
    
    async def delete_chat(self, chat_id: str, user_id: str) -> bool:
        """Eliminar un chat (y todos sus mensajes por CASCADE)"""
        response = self.client.table("chats")\
            .delete()\
            .eq("id", chat_id)\
            .eq("user_id", user_id)\
            .execute()
        
        return len(response.data) > 0
    
    async def create_message(self, user_id: str, message_data: MessageCreate) -> Message:
        """Crear un nuevo mensaje"""
        # Calcular iteration_number si es una iteración
        iteration_number = 1
        if message_data.parent_message_id:
            parent_response = self.client.table("messages")\
                .select("iteration_number")\
                .eq("id", str(message_data.parent_message_id))\
                .single()\
                .execute()
            
            if parent_response.data:
                iteration_number = parent_response.data["iteration_number"] + 1
        
        data = {
            "chat_id": str(message_data.chat_id),
            "user_id": user_id,
            "role": message_data.role,
            "content": message_data.content,
            "original_prompt": message_data.original_prompt,
            "model": message_data.model,
            "tokens_used": message_data.tokens_used,
            "cost_usd": message_data.cost_usd,
            "generation_time_seconds": message_data.generation_time_seconds,
            "parent_message_id": str(message_data.parent_message_id) if message_data.parent_message_id else None,
            "iteration_number": iteration_number
        }
        
        response = self.client.table("messages").insert(data).execute()
        
        if not response.data:
            raise Exception("Error al crear el mensaje")
        
        return Message(**response.data[0])
    
    async def get_messages(self, chat_id: str, user_id: str) -> List[Message]:
        """Obtener todos los mensajes de un chat"""
        # Verificar que el chat pertenece al usuario
        chat = await self.get_chat(chat_id, user_id)
        if not chat:
            raise Exception("Chat no encontrado")
        
        response = self.client.table("messages")\
            .select("*")\
            .eq("chat_id", chat_id)\
            .order("created_at", desc=False)\
            .execute()
        
        return [Message(**msg) for msg in response.data]
    
    async def get_message_iterations(self, message_id: str, user_id: str) -> List[Message]:
        """Obtener todas las iteraciones de un mensaje"""
        # Primero obtener el mensaje original
        original = self.client.table("messages")\
            .select("*")\
            .eq("id", message_id)\
            .single()\
            .execute()
        
        if not original.data:
            raise Exception("Mensaje no encontrado")
        
        # Obtener todas las iteraciones hijas
        response = self.client.table("messages")\
            .select("*")\
            .eq("parent_message_id", message_id)\
            .order("iteration_number", desc=False)\
            .execute()
        
        return [Message(**msg) for msg in response.data]
    
    # =====================================================
    # EXPORTACIÓN
    # =====================================================
    
    async def export_chat(self, chat_id: str, user_id: str, format: str = "json") -> ChatExport:
        """Exportar un chat completo con todos sus mensajes"""
        chat = await self.get_chat(chat_id, user_id)
        if not chat:
            raise Exception("Chat no encontrado")
        
        messages = await self.get_messages(chat_id, user_id)
        
        return ChatExport(
            chat=chat,
            messages=messages,
            export_date=datetime.now(),
            format=format
        )
