"""
Script de prueba para verificar que el contexto se está manejando correctamente
"""
import asyncio
import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

from app.pipeline import PromptEnhancer

async def test_context():
    print("\n" + "="*60)
    print("PRUEBA DE CONTEXTO - Mejora iterativa de prompts")
    print("="*60 + "\n")
    
    enhancer = PromptEnhancer(model="gpt-4o-mini")
    
    # Simular primer mensaje
    print("[ 1 ] PRIMER MENSAJE:")
    print("Usuario: 'Crea un prompt sobre recetas de cocina'\n")
    
    conversation_history = []
    first_message = "Crea un prompt sobre recetas de cocina"
    
    print("Respuesta del asistente:")
    assistant_response_1 = ""
    async for chunk in enhancer.enhance_prompt_stream(first_message, conversation_history):
        print(chunk, end='', flush=True)
        assistant_response_1 += chunk
    
    # Agregar al historial
    conversation_history.append({"role": "user", "content": first_message})
    conversation_history.append({"role": "assistant", "content": assistant_response_1})
    
    print("\n\n" + "-"*60 + "\n")
    
    # Simular segundo mensaje
    print("[ 2 ] SEGUNDO MENSAJE (con contexto):")
    print("Usuario: 'Hazlo más largo'\n")
    
    second_message = "Hazlo más largo"
    
    print("Respuesta del asistente:")
    assistant_response_2 = ""
    async for chunk in enhancer.enhance_prompt_stream(second_message, conversation_history):
        print(chunk, end='', flush=True)
        assistant_response_2 += chunk
    
    print("\n\n" + "="*60)
    print("[OK] PRUEBA COMPLETADA")
    print(f"Tokens usados: {enhancer.prompt_tokens + enhancer.completion_tokens}")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(test_context())
