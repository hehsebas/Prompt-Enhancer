import os
import asyncio
from pathlib import Path
from openai import AsyncOpenAI
from dotenv import load_dotenv

backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError(
        "OPENAI_API_KEY no encontrada o no valida "
    )

client = AsyncOpenAI(api_key=api_key)


class PromptEnhancer:
    
    def __init__(self, model="gpt-4o-mini", tools_dict=None):
        self.model = model
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.tools_dict = tools_dict or {}

    async def call_llm(self, prompt):
        response = await client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system", 
                    "content": 
                        "Eres un asistente altamente inteligente especializado en ingeniería de prompts. "
                        "Tu tarea es analizar y comprender el prompt proporcionado, "
                        "luego proporcionar una respuesta clara y concisa basada estrictamente en las instrucciones dadas. "
                        "No incluyas explicaciones adicionales o contexto más allá de lo requerido."
                },
                {
                    "role": "user", 
                    "content": prompt
                } 
            ],
            temperature=0.0,
        )
        
        self.prompt_tokens += response.usage.prompt_tokens
        self.completion_tokens += response.usage.completion_tokens

        return response.choices[0].message.content

    async def analyze_and_expand_input(self, input_prompt):
        analysis_and_expansion_prompt = f"""
        Eres un asistente altamente inteligente especializado en análisis de prompts.
        Analiza el {{prompt}} proporcionado y genera respuestas concisas para los siguientes aspectos clave:

        - **Objetivo principal del prompt:** Identifica el tema central o solicitud dentro del prompt proporcionado.
        - **Persona:** Recomienda la persona más relevante para que el modelo de IA adopte (ej: experto, profesor, conversacional, etc.)
        - **Longitud óptima de salida:** Sugiere una longitud óptima (corta, breve, media, larga) basada en la tarea, y da un número aproximado de palabras si es apropiado.
        - **Formato de salida más conveniente:** Recomienda el formato óptimo para el resultado (ej: lista, párrafo, código, tabla, JSON, etc.).
        - **Requisitos específicos:** Destaca cualquier condición especial, regla o expectativa establecida o implícita dentro del prompt.
        - **Mejoras sugeridas:** Ofrece recomendaciones sobre cómo modificar o mejorar el prompt para una generación de salida más precisa o eficiente.
        - **Prompting de un ejemplo:** Crea un ejemplo relacionado para guiar la generación de salida.
        
        Luego úsalos para reformular y expandir el {{prompt}} proporcionado.
        Devuelve el prompt expandido como salida en formato de texto. Abstente de explicar el proceso de generación.

        Ejemplo 1:
        {{prompt}}: "Explica el entrelazamiento cuántico a un niño de 10 años."
        
        *proceso_de_pensamiento*:
        - **Objetivo principal:** Simplificar concepto complejo de física cuántica para niños.
        - **Persona:** Profesor paciente y amigable
        - **Longitud óptima:** Breve (100-150 palabras)
        - **Formato más conveniente:** Narrativa con analogía
        - **Requisitos específicos:** Explicación apropiada para edad (10 años).
        - **Mejoras sugeridas:** 
            - Solicitar analogías específicas
            - Incluir elementos interactivos
            - Agregar preguntas de seguimiento
            - Sugerir ayudas visuales
        - **Ejemplo de salida:**
            "Imagina que tienes dos pares especiales de calcetines. Cuando pones un calcetín en tu habitación y el otro en la cocina, 
            ¡algo mágico sucede! Lo que le pasa a un calcetín afecta instantáneamente al otro calcetín. 
            Si volteas un calcetín al revés, el otro calcetín automáticamente se voltea al revés también, ¡sin importar qué tan lejos estén!" 
        
        *salida*:
        Como un profesor de ciencias amigable, por favor explica el entrelazamiento cuántico a un estudiante de 10 años usando estas pautas:

        Comienza con una analogía relacionable usando objetos cotidianos
        Usa lenguaje simple y claro evitando términos técnicos
        Incluye 2-3 ejemplos interactivos que demuestren el concepto
        Agrega datos curiosos que despierten la curiosidad
        Termina con preguntas simples para verificar la comprensión
        Mantén la explicación breve (100-150 palabras)

        Estructura tu explicación así:
        
        Analogía de apertura
        Explicación principal con ejemplos
        Escenarios interactivos "¿Qué pasaría si...?"
        Datos curiosos sobre el entrelazamiento cuántico
        Preguntas para verificar comprensión

        Recuerda mantener un tono entusiasta y alentador durante toda la explicación.
        
        Ejemplo de salida:
        Imagina que tienes dos pares especiales de calcetines. Cuando pones un calcetín en tu habitación y el otro en la cocina, 
        ¡algo mágico sucede! Lo que le pasa a un calcetín afecta instantáneamente al otro calcetín. 
        Si volteas un calcetín al revés, el otro calcetín automáticamente se voltea al revés también, ¡sin importar qué tan lejos estén!

        Ahora, analiza el siguiente prompt y devuelve solo la *salida* generada:
        {{prompt}}: {input_prompt}
        """

        return await self.call_llm(analysis_and_expansion_prompt)

    async def decompose_and_add_reasoning(self, expanded_prompt):

        decomposition_and_reasoning_prompt = f"""
        Eres un asistente de IA altamente capaz encargado de mejorar la ejecución de tareas complejas.
        Analiza el {{prompt}} proporcionado y úsalo para generar la siguiente salida:
        
        - **Descomposición en subtareas:** Divide la tarea descrita en el prompt en subtareas manejables y específicas que el modelo de IA necesita abordar.
        - **Razonamiento en cadena de pensamiento:** Para subtareas que involucren pensamiento crítico o pasos complejos, agrega razonamiento usando un enfoque paso a paso para mejorar la toma de decisiones y la calidad de salida.
        - **Criterios de éxito:** Define qué constituye una finalización exitosa para cada subtarea, asegurando una guía clara para los resultados esperados.

        Devuelve la siguiente salida estructurada para cada subtarea:

        1. **Descripción de subtarea**: Describe una subtarea específica.
        2. **Razonamiento**: Proporciona razonamiento o explicación de por qué esta subtarea es esencial o cómo debe abordarse.
        3. **Criterios de éxito**: Define cómo se ve la finalización exitosa para esta subtarea.

        Ejemplo:
        {{Prompt}}: "Explica cómo se evalúan los modelos de aprendizaje automático usando validación cruzada."

        ##PROCESO DE PENSAMIENTO##
        *Subtarea 1*:
        - **Descripción**: Define la validación cruzada y su propósito.
        - **Razonamiento**: Aclarar el concepto asegura que el lector entienda el mecanismo básico detrás de la evaluación del modelo.
        - **Criterios de éxito**: La explicación debe incluir una definición clara de validación cruzada y su rol en evaluar el rendimiento del modelo.
        
        *Subtarea 2*:
        - **Descripción**: Describe cómo la validación cruzada divide los datos en conjuntos de entrenamiento y validación.
        - **Razonamiento**: Explicar la división es crucial para entender cómo los modelos son validados y probados para generalización.
        - **Criterios de éxito**: Una explicación adecuada de validación cruzada k-fold con una ilustración de cómo se dividen los datos.

        Ahora, analiza el siguiente prompt expandido y devuelve las subtareas, razonamiento y criterios de éxito.
        Prompt: {expanded_prompt}
        """
        return await self.call_llm(decomposition_and_reasoning_prompt)

    async def suggest_enhancements(self, input_prompt, tools_dict=None):
        if tools_dict is None:
            tools_dict = {}
            
        enhancement_suggestion_prompt = f"""
        Eres un asistente altamente inteligente especializado en sugerencia de referencias e integración de herramientas.
        Analiza el {{input_prompt}} proporcionado y el {{tools_dict}} disponible para recomendar mejoras:

        - **Necesidad de referencias:** Determina si materiales de referencia adicionales beneficiarían la ejecución de la tarea (ej: sitios web, documentaciones, libros, artículos, etc.)
        - **Aplicabilidad de herramientas:** Evalúa si alguna herramienta disponible podría mejorar la eficiencia o precisión
        - **Complejidad de integración:** Evalúa el esfuerzo requerido para incorporar los recursos sugeridos
        - **Impacto esperado:** Estima la mejora potencial en la calidad de salida
        
        Si las mejoras son justificadas, proporciona recomendaciones estructuradas en este formato:
        
        ##SUGERENCIAS DE REFERENCIAS##
        (Solo si aplica, máximo 3)
        - Nombre/tipo de referencia
        - Propósito: Cómo mejora la salida
        - Integración: Cómo incorporarla
        
        ##SUGERENCIAS DE HERRAMIENTAS##
        (Solo si aplica, máximo 3)
        - Nombre de herramienta del tools_dict
        - Propósito: Cómo mejora la tarea
        - Integración: Cómo implementarla
        
        Si ninguna mejora mejoraría significativamente la salida, devuelve una cadena vacía ""

        Ahora, analiza el siguiente prompt y herramientas, luego devuelve solo la *salida* generada:
        {{input_prompt}}: {input_prompt}
        {{tools_dict}}: {tools_dict}
        """
        return await self.call_llm(enhancement_suggestion_prompt)

    async def assemble_prompt(self, components):
        """Ensambla todos los componentes en un prompt cohesivo"""
        expanded_prompt = components.get("expanded_prompt", "")
        decomposition_and_reasoning = components.get("decomposition_and_reasoninng", "")
        suggested_enhancements = components.get("suggested_enhancements", "")
        
        output_prompt = (
            f"{expanded_prompt}\n\n"
            f"{suggested_enhancements}\n\n"
            f"{decomposition_and_reasoning}"
        )
        return output_prompt

    async def enhance_prompt(self, input_prompt):
        tools_dict = {}
        
        expanded_prompt = await self.analyze_and_expand_input(input_prompt)
        
        suggested_enhancements, decomposition_and_reasoning = await asyncio.gather(
            self.suggest_enhancements(input_prompt, tools_dict),
            self.decompose_and_add_reasoning(expanded_prompt)
        )
        
        components = {
            "expanded_prompt": expanded_prompt,
            "decomposition_and_reasoninng": decomposition_and_reasoning,
            "suggested_enhancements": suggested_enhancements
        }
        
        output_prompt = await self.assemble_prompt(components)
        
        # Retornar diccionario con todos los componentes
        return {
            "advanced_prompt": output_prompt,
            "expanded_prompt": expanded_prompt,
            "decomposition_and_reasoninng": decomposition_and_reasoning,
            "suggested_enhancements": suggested_enhancements
        }

