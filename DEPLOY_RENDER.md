# Despliegue En Render

Este proyecto queda preparado para publicarse en Render con tres recursos:

- `logistic-optimization-api`: backend FastAPI.
- `logistic-optimization-web`: frontend React/Vite.
- `logistic-optimization-db`: base de datos PostgreSQL.

## 1. Subir El Proyecto A GitHub

Render despliega desde un repositorio. Sube estos cambios a GitHub antes de crear el servicio.

```bash
git add .
git commit -m "Preparar despliegue en Render"
git push origin main
```

## 2. Crear Blueprint En Render

1. Entra a Render.
2. Selecciona **New** y luego **Blueprint**.
3. Conecta el repositorio de GitHub.
4. Render detectara el archivo `render.yaml` en la raiz del proyecto.
5. Confirma la creacion de los servicios.

## 3. Revisar La URL Del Backend

El frontend usa esta variable:

```env
VITE_API_URL=https://logistic-optimization-api.onrender.com/api
```

Si Render cambia el subdominio del backend, actualiza la variable `VITE_API_URL` del servicio `logistic-optimization-web` con la URL real del backend terminada en `/api`.

## 4. Cargar Datos Iniciales

El archivo `render.yaml` ejecuta automaticamente:

```bash
python init_render_db.py
```

Este comando crea las tablas, carga datos de demostracion si la base esta vacia y crea el usuario administrador si no existe.

Usuario inicial:

```text
admin / admin123
```

Luego cambia la clave para una entrega publica.

Si necesitas ejecutarlo manualmente, abre la consola del servicio backend en Render y corre el mismo comando.

## 5. Verificar

Backend:

```text
https://logistic-optimization-api.onrender.com/health
https://logistic-optimization-api.onrender.com/api/docs
```

Frontend:

```text
https://logistic-optimization-web.onrender.com/login
```
