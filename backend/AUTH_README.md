# Autenticación JWT - Sistema de Optimización Logística

## ✅ Implementación Completada

### Componentes Creados

1. **Modelo de Usuario** (`app/models/models.py`)
   - Tabla `users` con campos: username, email, hashed_password, full_name, is_active, is_admin

2. **Schemas de Autenticación** (`app/schemas/auth.py`)
   - `UserCreate`: Registro de nuevos usuarios
   - `UserLogin`: Login con credenciales
   - `UserResponse`: Respuesta con datos del usuario
   - `Token`: Respuesta con JWT token
   - `TokenData`: Datos decodificados del token

3. **Utilidades de Autenticación** (`app/utils/auth.py`)
   - `get_password_hash()`: Hash de contraseñas con bcrypt
   - `verify_password()`: Verificación de contraseñas
   - `create_access_token()`: Crear JWT tokens
   - `decode_token()`: Decodificar y validar tokens
   - `get_current_user()`: Obtener usuario autenticado
   - `get_current_active_admin()`: Verificar permisos de admin

4. **Endpoints de Autenticación** (`app/routes/auth.py`)
   - `POST /api/auth/register`: Registrar nuevo usuario
   - `POST /api/auth/login`: Login y obtener token
   - `GET /api/auth/me`: Obtener perfil del usuario actual
   - `GET /api/auth/users`: Listar usuarios (Admin)
   - `PATCH /api/auth/users/{user_id}/toggle-admin`: Cambiar rol admin (Admin)
   - `PATCH /api/auth/users/{user_id}/toggle-active`: Activar/desactivar usuario (Admin)

5. **Usuario Administrador Inicial**
   - Script `create_admin.py` para crear usuario admin
   - Credenciales por defecto:
     - Username: `admin`
     - Password: `admin123`
     - Email: `admin@logistica.upse.edu.ec`

### Configuración JWT

En `app/config.py`:
```python
SECRET_KEY: str = "your-secret-key-change-this-in-production"
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
```

⚠️ **IMPORTANTE**: Cambiar `SECRET_KEY` en producción con una clave segura generada.

### Dependencias Instaladas

```bash
pip install python-jose[cryptography]  # JWT tokens
pip install passlib[bcrypt]             # Password hashing
pip install python-multipart            # OAuth2 forms
pip install email-validator             # Email validation
```

### Rutas Protegidas

Ejemplo de protección en `app/api/inventory.py`:
```python
from app.utils.auth import get_current_user
from app.models.models import User

@router.post("/warehouses")
async def create_warehouse(
    warehouse: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Requiere autenticación
):
    """Create a new warehouse (requires authentication)"""
    # ... código ...
```

## 🧪 Pruebas con la API

### 1. Registrar un nuevo usuario

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario1",
    "email": "usuario1@example.com",
    "password": "password123",
    "full_name": "Usuario de Prueba"
  }'
```

### 2. Login (obtener token)

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Acceder a endpoint protegido

```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Crear bodega (requiere autenticación)

```bash
curl -X POST "http://localhost:8000/api/inventory/warehouses" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bodega Norte",
    "address": "Av. Principal 123, Quito",
    "latitude": -0.1807,
    "longitude": -78.4678,
    "capacity": 5000
  }'
```

## 📱 Integración con Frontend

### Ejemplo en React

```javascript
// Login
const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
};

// Hacer request con token
const fetchProtectedData = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

## 🔒 Seguridad

### Buenas Prácticas Implementadas

1. ✅ Contraseñas hasheadas con bcrypt
2. ✅ JWT tokens con expiración (30 minutos)
3. ✅ Validación de email con Pydantic
4. ✅ Protección contra usuarios inactivos
5. ✅ Roles de usuario (admin/user)
6. ✅ Endpoints protegidos con dependencias

### Recomendaciones para Producción

1. **Cambiar SECRET_KEY**: Generar una clave segura
   ```python
   import secrets
   secrets.token_urlsafe(32)
   ```

2. **Usar HTTPS**: Configurar SSL/TLS en producción

3. **Refresh Tokens**: Implementar sistema de refresh tokens para sesiones largas

4. **Rate Limiting**: Limitar intentos de login

5. **Variables de Entorno**: Mover SECRET_KEY a archivo `.env`

## 🚀 Próximos Pasos

- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting a endpoints de login
- [ ] Implementar recuperación de contraseña por email
- [ ] Agregar logging de accesos
- [ ] Crear middleware de auditoría

## 📝 Notas

- El token expira en 30 minutos por defecto
- Los usuarios inactivos no pueden hacer login
- Solo admins pueden ver lista de usuarios y cambiar roles
- El usuario admin inicial debe cambiar su contraseña después del primer login
