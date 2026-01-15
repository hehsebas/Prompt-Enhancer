# Configuración de Google OAuth en Supabase

Este documento te guiará paso a paso para configurar la autenticación con Google OAuth en tu proyecto.

## Prerrequisitos

- Una cuenta de Google Cloud Platform
- Un proyecto de Supabase configurado
- Variables de entorno configuradas en tu proyecto

## Paso 1: Configurar Google Cloud Platform

### 1.1 Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el ID del proyecto

### 1.2 Configurar la Pantalla de Consentimiento OAuth

1. En Google Cloud Console, ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** como tipo de usuario
3. Completa la información requerida:
   - **App name**: Nombre de tu aplicación (ej: "PromptAI")
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
4. Haz clic en **Save and Continue**

### 1.3 Configurar Scopes (Alcances)

1. En la sección de **Scopes**, agrega los siguientes scopes:
   - `openid` (agrega manualmente)
   - `.../auth/userinfo.email` (agregado por defecto)
   - `.../auth/userinfo.profile` (agregado por defecto)
2. Haz clic en **Save and Continue**

### 1.4 Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Selecciona **Web application** como tipo de aplicación
4. Configura lo siguiente:

   **Authorized JavaScript origins**:
   - Para desarrollo local: `http://localhost:5173` (o el puerto que uses)
   - Para producción: `https://tudominio.com`

   **Authorized redirect URIs**:
   - Para desarrollo: `http://localhost:54321/auth/v1/callback`
   - Para producción: `https://<tu-proyecto-ref>.supabase.co/auth/v1/callback`
     - Puedes obtener esta URL desde el Dashboard de Supabase en **Authentication** > **Providers** > **Google**

5. Haz clic en **Create**
6. **IMPORTANTE**: Guarda el **Client ID** y **Client Secret** que aparecen

## Paso 2: Configurar Supabase

### 2.1 Configurar el Provider de Google

1. Ve a tu [Dashboard de Supabase](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Providers**
4. Busca **Google** y habilítalo
5. Ingresa las credenciales:
   - **Client ID**: El que obtuviste de Google Cloud
   - **Client Secret**: El que obtuviste de Google Cloud
6. Guarda los cambios

### 2.2 Configurar URL de Redirección

1. En el Dashboard de Supabase, ve a **Authentication** > **URL Configuration**
2. Agrega las siguientes URLs a **Redirect URLs**:
   - Para desarrollo: `http://localhost:5173/`
   - Para producción: `https://tudominio.com/`

## Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo `.env` en el frontend

Necesitas crear un archivo `.env` en la carpeta `frontend/` (no en `backend/`) con las siguientes variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto-ref.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

### 3.2 Obtener las credenciales de Supabase

1. Ve a tu [Dashboard de Supabase](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia los siguientes valores:
   - **URL**: Este es tu `VITE_SUPABASE_URL`
   - **anon public**: Este es tu `VITE_SUPABASE_ANON_KEY`

**IMPORTANTE**: 
- Usa la clave **anon public**, NO la **service_role** key
- Las variables DEBEN comenzar con `VITE_` para que Vite las exponga al cliente
- El archivo `.env` debe estar en la carpeta `frontend/`, no en `backend/`

### 3.3 Pasos para crear el archivo

En Windows (PowerShell):
```powershell
cd frontend
New-Item -Path . -Name ".env" -ItemType "file"
# Luego edita el archivo y agrega las variables
```

O simplemente crea un archivo llamado `.env` en la carpeta `frontend/` usando tu editor de código favorito.

## Paso 4: Probar la Integración

### 4.1 Desarrollo Local

1. Asegúrate de que tu servidor de desarrollo esté corriendo:
   ```bash
   npm run dev
   ```

2. Ve a la página de Sign Up o Log In
3. Haz clic en el botón **"Continuar con Google"**
4. Deberías ser redirigido a la pantalla de consentimiento de Google
5. Después de autorizar, serás redirigido de vuelta a tu aplicación

### 4.2 Verificar Autenticación

Después de iniciar sesión con Google:
- El usuario debería aparecer en tu Dashboard de Supabase en **Authentication** > **Users**
- La información del usuario (email, nombre, avatar) debería estar disponible en tu aplicación

## Solución de Problemas Comunes

### Error: "redirect_uri_mismatch"

**Causa**: La URL de redirección no coincide con las configuradas en Google Cloud.

**Solución**:
- Verifica que las **Authorized redirect URIs** en Google Cloud incluyan exactamente la URL de callback de Supabase
- Asegúrate de que no haya espacios adicionales o caracteres incorrectos

### Error: "Invalid client"

**Causa**: El Client ID o Client Secret son incorrectos.

**Solución**:
- Verifica que hayas copiado correctamente las credenciales de Google Cloud a Supabase
- Regenera las credenciales si es necesario

### El usuario no se guarda en la base de datos

**Causa**: La integración con tu backend no está completa.

**Solución**:
- El código actual guarda la sesión en el frontend
- Si necesitas guardar el usuario en tu base de datos personalizada, deberás crear un endpoint en tu backend que reciba la información de Supabase

## Notas Adicionales

### Modo de Producción

Cuando despliegues tu aplicación:

1. **Actualiza las URLs en Google Cloud**:
   - Agrega tu dominio de producción a **Authorized JavaScript origins**
   - Agrega la URL de callback de producción a **Authorized redirect URIs**

2. **Actualiza las URLs en Supabase**:
   - Agrega tu dominio de producción a las **Redirect URLs**

3. **Variables de entorno**:
   - Asegúrate de que las variables de entorno estén configuradas en tu servidor de producción

### Seguridad

- **NUNCA** compartas tu **Client Secret** públicamente
- **NUNCA** subas archivos `.env` a tu repositorio
- Considera implementar verificación de marca en Google para mejorar la confianza del usuario

### Branding Personalizado (Opcional)

Para mejorar la experiencia del usuario:

1. En Google Cloud Console, ve a **OAuth consent screen**
2. Agrega un logo de tu aplicación
3. Completa toda la información de branding
4. Considera solicitar verificación de marca (puede tomar varios días)

## Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Soporte

Si encuentras problemas:
1. Revisa los logs en la consola del navegador
2. Verifica los logs de autenticación en el Dashboard de Supabase
3. Consulta la documentación oficial de Supabase
