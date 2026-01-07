#Optimizador de Prompts 

Una aplicación web educativa que ayuda a estudiantes a mejorar sus prompts para modelos de IA, utilizando técnicas avanzadas de ingeniería de prompts. La aplicación proporciona versiones optimizadas de prompts con explicaciones detalladas de los cambios realizados.


## Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Documentation](#api-documentation)
- [Diseño Responsivo](#diseño-responsivo)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Características

### Para Estudiantes
-  **Optimización Inteligente**: Mejora automática de prompts usando GPT-4o o GPT-4o-mini
-  **Comparación Visual**: Vista lado a lado del prompt original vs. optimizado
-  **Explicaciones Educativas**: Aprende qué cambios se hicieron y por qué
-  **Análisis Detallado**: Descomposición en subtareas y razonamiento paso a paso
-  **100% Responsivo**: Funciona perfectamente en PC, tablets y smartphones
-  **Rápido y Eficiente**: Optimización en segundos con feedback en tiempo real

### Técnicas de Ingeniería de Prompts Aplicadas
-  Análisis y expansión del prompt original
-  Definición de persona y contexto apropiado
-  Especificación de formato de salida
-  Descomposición en subtareas
-  Chain-of-thought reasoning
-  Sugerencias de referencias y herramientas
-  Criterios de éxito claros

##  Arquitectura

La aplicación sigue una arquitectura moderna de tres capas:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  - Interfaz de usuario responsiva                        │
│  - Gestión de estado con React Hooks                     │
│  - Comunicación con API mediante Axios                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (FastAPI)                       │
│  - Endpoints REST para optimización                      │
│  - Validación de datos con Pydantic                      │
│  - Manejo de errores y logging                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ API Calls
                     │
┌────────────────────▼────────────────────────────────────┐
│              PIPELINE DE OPTIMIZACIÓN                    │
│  - Análisis y expansión de prompts                       │
│  - Descomposición en subtareas                           │
│  - Integración con OpenAI API                            │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Usuario ingresa prompt** → Frontend captura y valida
2. **Frontend envía request** → Backend vía POST /optimize
3. **Backend procesa** → Pipeline de optimización con OpenAI
4. **Pipeline optimiza** → Análisis, expansión, descomposición
5. **Backend responde** → JSON con prompt optimizado + metadata
6. **Frontend muestra** → Resultado con explicaciones y comparación

##  Tecnologías

### Frontend
- **React 18.3** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos modernos
- **CSS3** - Estilos responsivos con variables CSS

### Backend
- **FastAPI 0.111** - Framework web moderno y rápido
- **Python 3.11+** - Lenguaje de programación
- **Pydantic** - Validación de datos
- **OpenAI API** - Modelos de lenguaje (GPT-4o, GPT-4o-mini)
- **Uvicorn** - Servidor ASGI

### DevOps
- **Docker & Docker Compose** - Containerización
- **Nginx** - Servidor web para producción
- **Git** - Control de versiones

##  Requisitos Previos

- **Node.js** 18+ y npm
- **Python** 3.11+
- **OpenAI API Key** ([Obtener aquí](https://platform.openai.com/api-keys))
- **Docker** (opcional, para deployment con contenedores)

##  Instalación

### Opción 1: Instalación Local (Desarrollo)

#### 1. Clonar el repositorio

```bash
git clone https://github.com/hehsebas/Prompt-enhancer.git
cd prompt-optimizer
```

#### 2. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY=sq........
```

#### 3. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
copy .env.example .env
# Editar .env si es necesario (por defecto apunta a localhost:8000)
```

#### 4. Ejecutar la aplicación

**Terminal 1 - Backend:**
```bash
cd backend
# Con entorno virtual activado
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

### Opción 2: Docker Compose (Producción)

```bash
# 1. Configurar variables de entorno
copy .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY

# 2. Construir y ejecutar contenedores
docker-compose up --build

# La aplicación estará disponible en:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Uso

### Interfaz Web

1. **Ingresa tu prompt original** en el área de texto
2. **Selecciona el modelo** de IA (GPT-4o-mini recomendado)
3. **Haz clic en "Optimizar Prompt"** o presiona `Ctrl+Enter`
4. **Revisa el resultado**:
   - Prompt optimizado con mejoras aplicadas
   - Explicación detallada de los cambios
   - Comparación lado a lado (opcional)
   - Metadata (tiempo, costo, tokens)


##  API Documentation

### Endpoints Principales

#### `POST /optimize`
Optimiza un prompt proporcionado.

**Request Body:**
```json
{
  "text": "Explícame qué es el cambio climático",
  "model": "gpt-4o-mini",
  "include_explanation": true
}
```

**Response:**
```json
{
  "success": true,
  "original_prompt": "Explícame qué es el cambio climático",
  "optimized_prompt": "Como experto en ciencias ambientales...",
  "explanation": {
    "expanded_prompt": "...",
    "decomposition_and_reasoning": "...",
    "suggested_enhancements": "...",
    "changes_summary": "..."
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "elapsed_time_seconds": 12.45,
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "approximate_cost_usd": 0.000234,
    "timestamp": 1234567890.123
  }
}
```

#### `GET /models`
Obtiene la lista de modelos disponibles.

#### `GET /health`
Verifica el estado del servicio.

**Documentación interactiva completa:** http://localhost:8000/docs


### Modelos de IA

Para agregar más modelos, edita:
1. `backend/app/main.py` - Agregar costos y validación
2. `frontend/src/App.jsx` - Agregar opción en el selector

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm run test
```

##  Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

##  Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

##  Autores

- **Sebastián Reina** - *Desarrollo inicial* - [hehsebas](https://github.com/hehsebas)


**Hecho con ❤️ para estudiantes que quieren mejorar sus habilidades con IA**

