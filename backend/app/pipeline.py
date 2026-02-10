import os
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError(
        "GOOGLE_API_KEY no encontrada o no valida. "
        "Por favor configura tu API key de Google AI Studio en el archivo .env"
    )

# Configurar Gemini
genai.configure(api_key=google_api_key)

class PromptEnhancer:
    """Servicio para mejorar prompts usando principios de ingeniería de prompts"""
    
    def __init__(self, model="gemini-2.5-flash"):
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
        
        model = genai.GenerativeModel(
            model_name=self.model,
            system_instruction=instructions
        )
        
        # Streaming de la respuesta
        stream = await model.generate_content_async(
            contents=user_message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048,
                top_p=0.95,
                top_k=40,
            ),
            stream=True
        )
        
        # Procesar el stream
        async for chunk in stream:
            if hasattr(chunk, 'text') and chunk.text:
                yield chunk.text
            
            # Actualizar tokens si están disponibles
            if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                self.prompt_tokens = chunk.usage_metadata.prompt_token_count
                self.completion_tokens = chunk.usage_metadata.candidates_token_count

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
        
        model = genai.GenerativeModel(
            model_name=self.model,
            system_instruction=instructions
        )
        
        # Generar título (sin streaming)
        response = await model.generate_content_async(
            contents=user_message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,  # Más determinista para títulos consistentes
                max_output_tokens=50,  # Títulos cortos
                top_p=0.9,
                top_k=20,
            )
        )
        
        # Actualizar tokens si están disponibles
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            self.prompt_tokens += response.usage_metadata.prompt_token_count
            self.completion_tokens += response.usage_metadata.candidates_token_count
        
        # Limpiar el título (remover comillas, puntos, etc.)
        title = response.text.strip()
        title = title.strip('"\'.,;:')
        
        # Limitar longitud por seguridad
        if len(title) > 60:
            title = title[:57] + '...'
        
        return title or "Nuevo Chat"


