import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError(
        "OPENAI_API_KEY no encontrada o no valida. "
        "Por favor configura tu API key de OpenAI en el archivo .env"
    )

# Configurar OpenAI
openai_client = OpenAI(api_key=openai_api_key)

class PromptEnhancer:
    """Servicio para mejorar prompts usando principios de ingeniería de prompts"""
    
    def __init__(self, model="gpt-4o-mini"):
        self.model = model
        self.prompt_tokens = 0
        self.completion_tokens = 0


    async def enhance_prompt_stream(self, user_input, conversation_history=None):
        """
        Mejora un prompt usando principios de ingeniería de prompts.
        Mantiene el contexto de la conversación para mejoras iterativas.
        
        Args:
            user_input: El mensaje actual del usuario
            conversation_history: Lista de mensajes previos [{"role": "user/assistant", "content": "..."}]
        """
        instructions = (
            "Eres un experto en ingeniería de prompts. Tu trabajo es ayudar al usuario a mejorar sus prompts "
            "de manera iterativa y conversacional. \n\n"
            "IMPORTANTE: Si el usuario está refinando o ajustando un prompt anterior:\n"
            "- Toma como base el ÚLTIMO prompt que generaste (está en el historial)\n"
            "- Aplica SOLO los cambios o ajustes que el usuario solicita\n"
            "- Mantén la estructura y contenido previo que el usuario no pidió cambiar\n\n"
            "Si el usuario da un comando corto como 'hazlo más largo', 'más detallado', 'enfócalo en X':\n"
            "- Expande o modifica el ÚLTIMO prompt generado según la instrucción\n"
            "- NO generes un nuevo prompt desde cero\n\n"
            "Si es un prompt completamente nuevo (sin relación con mensajes anteriores):\n"
            "- Transfórmalo en una versión mejorada, clara y efectiva\n"
            "- Aplica principios de ingeniería de prompts"
        )
        
        # Construir el array de mensajes con historial
        messages = [{"role": "system", "content": instructions}]
        
        # Si hay historial, incluirlo COMPLETO para mantener contexto
        if conversation_history:
            messages.extend(conversation_history)
            print(f"[DEBUG Pipeline] Historial incluido: {len(conversation_history)} mensajes")
        
        # Agregar el mensaje actual del usuario
        messages.append({"role": "user", "content": user_input})
        
        print(f"[DEBUG Pipeline] Total mensajes a enviar a OpenAI: {len(messages)}")
        
        response = openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            stream_options={"include_usage": True}
        )
        
        # Streaming de la respuesta
        for chunk in response:
            # Actualizar tokens si están disponibles (último chunk)
            if hasattr(chunk, 'usage') and chunk.usage:
                self.prompt_tokens = chunk.usage.prompt_tokens
                self.completion_tokens = chunk.usage.completion_tokens
            
            # Enviar contenido si existe
            if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def generate_chat_title(self, user_input):
        """
        Genera un título descriptivo y conciso para el chat basado en el mensaje del usuario.
        Usa IA para interpretar el contenido y crear un título relevante.
        """
        instructions = (
            "Eres un experto en análisis de texto. Tu trabajo es leer un mensaje del usuario "
            "e interpretar su intención principal para crear un título breve y descriptivo."
        )
        
        user_message = f"""Analiza el siguiente mensaje y genera un título breve que describa de qué trata:

"{user_input}"

**Instrucciones:**
- Devuelve SOLO el título, sin explicaciones ni puntos al final
- El título debe ser descriptivo y claro (máximo 6-8 palabras)
- Interpreta la intención del usuario, no copies textualmente
- Usa un lenguaje profesional y directo
- No uses comillas en el título

Ejemplos:
- Mensaje: "Necesito ayuda para crear un plan de marketing para mi startup" → Título: "Plan de marketing para startup"
- Mensaje: "Cómo puedo mejorar mi currículum para aplicar a trabajos de tecnología" → Título: "Mejora de currículum tecnológico"
- Mensaje: "Explícame qué es machine learning" → Título: "Explicación de machine learning"

Título:"""
        
        # Generar título (sin streaming)
        response = openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,  # Más determinista para títulos consistentes
            max_tokens=50  # Títulos cortos
        )
        
        # Actualizar contadores de tokens
        if hasattr(response, 'usage') and response.usage:
            self.prompt_tokens += response.usage.prompt_tokens
            self.completion_tokens += response.usage.completion_tokens
        
        # Obtener el texto de la respuesta
        title = response.choices[0].message.content.strip()
        
        # Limpiar el título (remover comillas, puntos, etc.)
        title = title.strip('"\'.,;:')
        
        # Limitar longitud por seguridad
        if len(title) > 60:
            title = title[:57] + '...'
        
        return title or "Nuevo Chat"


