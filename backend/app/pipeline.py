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


    async def enhance_prompt_stream(self, user_input):
        """
        Mejora un prompt usando principios de ingeniería de prompts.
        Devuelve solo el prompt mejorado, listo para copiar y usar.
        """
        instructions = (
            "Eres un experto en ingeniería de prompts. Tu trabajo es tomar prompts simples "
            "y transformarlos en versiones mejoradas, claras y efectivas que generen mejores resultados. "
            "Aplica principios como: especificar el rol, dar contexto, estructurar bien las instrucciones, "
            "y definir el formato de salida esperado."
        )
        
        user_message = f"""Mejora el siguiente prompt aplicando principios de ingeniería de prompts:

"{user_input}"

**Instrucciones:**
- Devuelve SOLO el prompt mejorado, sin explicaciones adicionales
- El prompt debe ser claro, específico y bien estructurado
- Si el prompt original es muy vago o corto, añade contexto razonable
- Mantén el objetivo original del prompt
- Usa un lenguaje directo y profesional

Prompt mejorado:"""
        
        response = openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": user_message}
            ],
            stream=True,
            stream_options={"include_usage": True}  # Para obtener tokens al final
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


