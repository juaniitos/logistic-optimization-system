# 🚀 Guía de Despliegue en AWS (Free Tier - $0)

Esta guía te llevará paso a paso para desplegar tu plataforma logística en AWS **completamente gratis** usando el Free Tier.

## 📋 Requisitos Previos

- Cuenta de AWS (menos de 12 meses para Free Tier)
- Cuenta de GitHub
- Git instalado en tu computadora

---

## 🔧 PARTE 1: Subir a GitHub

### 1.1 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `logistic-optimization-system`
3. Descripción: `Sistema de Optimización Logística - UPSE`
4. Selecciona **Public** (para compartir) o **Private**
5. Click en **Create repository**

### 1.2 Subir el código desde tu computadora

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
cd C:\Users\PORT141-NB\Downloads\logistic_sol

# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "Initial commit: Sistema de Optimización Logística"

# Conectar con tu repositorio de GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/logistic-optimization-system.git

# Subir el código
git branch -M main
git push -u origin main
```

---

## ☁️ PARTE 2: Configurar AWS

### 2.1 Crear cuenta AWS (si no tienes)

1. Ve a https://aws.amazon.com/free
2. Click en **Create a Free Account**
3. Sigue los pasos (necesitarás tarjeta de crédito, pero NO te cobrarán si usas Free Tier)

### 2.2 Acceder a la Consola de AWS

1. Ve a https://console.aws.amazon.com
2. Inicia sesión con tu cuenta

---

## 🖥️ PARTE 3: Crear Servidor EC2 (Backend)

### 3.1 Lanzar instancia EC2

1. En la consola AWS, busca **EC2** y haz click
2. Click en **Launch Instance**
3. Configura así:

   - **Name**: `logistic-backend`
   - **AMI**: Amazon Linux 2023 (Free tier eligible)
   - **Instance type**: `t2.micro` ⚠️ **IMPORTANTE: Solo t2.micro es gratis**
   - **Key pair**: Click en **Create new key pair**
     - Name: `logistic-key`
     - Type: RSA
     - Format: .pem
     - **Descarga y guarda este archivo** (lo necesitarás para conectarte)
   
4. **Network settings**: Click en **Edit**
   - **Auto-assign public IP**: Enable
   - **Security group**: Create new
     - Nombre: `logistic-sg`
     - Agregar reglas:
       - SSH (22) - Source: My IP
       - HTTP (80) - Source: Anywhere
       - Custom TCP (8000) - Source: Anywhere
       - Custom TCP (3000) - Source: Anywhere

5. **Storage**: 8 GB (Free Tier incluye hasta 30GB)

6. Click **Launch Instance**

### 3.2 Conectarse al servidor EC2

1. Espera que el estado sea **Running**
2. Copia la **Public IPv4 address** (ej: 54.123.45.67)
3. Abre PowerShell y conecta:

```powershell
# Ir a donde descargaste la key
cd Downloads

# Dar permisos a la key (en PowerShell)
icacls logistic-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"

# Conectar al servidor (reemplaza IP_PUBLICA)
ssh -i logistic-key.pem ec2-user@IP_PUBLICA
```

### 3.3 Instalar dependencias en EC2

Una vez conectado al servidor, ejecuta:

```bash
# Actualizar sistema
sudo yum update -y

# Instalar Python 3.11
sudo yum install python3.11 python3.11-pip git -y

# Crear alias para python
sudo alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Instalar Node.js (para build del frontend)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# Verificar instalación
python3 --version
node --version
```

### 3.4 Clonar y configurar el proyecto

```bash
# Clonar tu repositorio (reemplaza TU_USUARIO)
git clone https://github.com/TU_USUARIO/logistic-optimization-system.git
cd logistic-optimization-system

# Configurar Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Crear usuario admin
python create_admin.py

# Cargar datos de ejemplo
python seed_data.py
```

### 3.5 Iniciar el Backend como servicio

```bash
# Crear servicio systemd
sudo nano /etc/systemd/system/logistic-backend.service
```

Pega este contenido (presiona Ctrl+Shift+V):

```ini
[Unit]
Description=Logistic Backend API
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/logistic-optimization-system/backend
Environment="PATH=/home/ec2-user/logistic-optimization-system/backend/venv/bin"
ExecStart=/home/ec2-user/logistic-optimization-system/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Guarda con `Ctrl+O`, Enter, `Ctrl+X`

```bash
# Habilitar e iniciar el servicio
sudo systemctl daemon-reload
sudo systemctl enable logistic-backend
sudo systemctl start logistic-backend

# Verificar que está corriendo
sudo systemctl status logistic-backend
```

### 3.6 Verificar Backend

Abre en tu navegador: `http://TU_IP_PUBLICA:8000/api/docs`

Deberías ver la documentación de la API.

---

## 🌐 PARTE 4: Desplegar Frontend en S3

### 4.1 Crear el build de producción

En tu computadora local (PowerShell):

```powershell
cd C:\Users\PORT141-NB\Downloads\logistic_sol\frontend

# Crear archivo de configuración de producción
@"
VITE_API_URL=http://TU_IP_PUBLICA_EC2:8000/api
"@ | Out-File -FilePath .env.production -Encoding UTF8

# Instalar dependencias si no lo has hecho
npm install

# Crear build de producción
npm run build
```

Esto creará una carpeta `dist/` con los archivos estáticos.

### 4.2 Crear Bucket S3

1. En AWS Console, busca **S3**
2. Click **Create bucket**
3. Configura:
   - **Bucket name**: `logistic-frontend-TU_NOMBRE` (debe ser único globalmente)
   - **Region**: US East (N. Virginia) - us-east-1 (más económico)
   - **Object Ownership**: ACLs disabled
   - ❌ **Desmarcar** "Block all public access"
   - ✅ Marcar "I acknowledge..."
4. Click **Create bucket**

### 4.3 Configurar hosting estático

1. Click en tu bucket
2. Ve a la pestaña **Properties**
3. Scroll hasta **Static website hosting** → Click **Edit**
4. Selecciona **Enable**
5. Index document: `index.html`
6. Error document: `index.html`
7. Click **Save changes**

### 4.4 Configurar política de acceso público

1. Ve a la pestaña **Permissions**
2. En **Bucket policy** click **Edit**
3. Pega esta política (reemplaza NOMBRE_BUCKET):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::NOMBRE_BUCKET/*"
        }
    ]
}
```

4. Click **Save changes**

### 4.5 Subir archivos del Frontend

**Opción A: Usando AWS CLI (recomendado)**

```powershell
# Instalar AWS CLI si no lo tienes
# Descargar de: https://aws.amazon.com/cli/

# Configurar credenciales
aws configure
# AWS Access Key ID: (crear en IAM > Users > Security credentials)
# AWS Secret Access Key: (el secreto de la key)
# Region: us-east-1
# Output format: json

# Subir archivos
cd C:\Users\PORT141-NB\Downloads\logistic_sol\frontend
aws s3 sync dist/ s3://NOMBRE_BUCKET/ --delete
```

**Opción B: Usando la consola web**

1. En tu bucket S3, click **Upload**
2. Arrastra todos los archivos de la carpeta `dist/`
3. Click **Upload**

### 4.6 Obtener URL del Frontend

1. Ve a **Properties** de tu bucket
2. Scroll hasta **Static website hosting**
3. Copia el **Bucket website endpoint**
4. Ej: `http://logistic-frontend-tunombre.s3-website-us-east-1.amazonaws.com`

---

## ✅ PARTE 5: Verificar Despliegue

1. Abre la URL de S3 en tu navegador
2. Deberías ver la página de login
3. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

## 🔄 PARTE 6: Actualizar el Proyecto

### Actualizar Backend

```bash
# En el servidor EC2
cd ~/logistic-optimization-system
git pull origin main
sudo systemctl restart logistic-backend
```

### Actualizar Frontend

```powershell
# En tu computadora
cd C:\Users\PORT141-NB\Downloads\logistic_sol\frontend
npm run build
aws s3 sync dist/ s3://NOMBRE_BUCKET/ --delete
```

---

## 💰 Monitorear Costos (IMPORTANTE)

1. Ve a https://console.aws.amazon.com/billing
2. Click en **Bills** para ver el detalle
3. Configura una **Budget Alert**:
   - Billing → Budgets → Create budget
   - Budget type: Cost budget
   - Amount: $1
   - Esto te alertará si algo empieza a costar dinero

---

## 🔗 URLs Finales

Después del despliegue tendrás:

- **Frontend**: `http://tu-bucket.s3-website-us-east-1.amazonaws.com`
- **Backend API**: `http://tu-ip-ec2:8000/api`
- **Documentación API**: `http://tu-ip-ec2:8000/api/docs`
- **Repositorio GitHub**: `https://github.com/TU_USUARIO/logistic-optimization-system`

---

## ⚠️ Límites del Free Tier

| Servicio | Límite Gratis | Tu uso estimado |
|----------|---------------|-----------------|
| EC2 t2.micro | 750 hrs/mes | ~720 hrs (24/7) ✅ |
| S3 Storage | 5 GB | ~50 MB ✅ |
| S3 Requests | 20,000 GET | Variable ✅ |
| Data Transfer | 100 GB | Variable ✅ |

**Mientras uses t2.micro y no excedas estos límites, tu costo será $0**

---

## 🆘 Solución de Problemas

### El frontend no carga datos
- Verifica que la IP del backend en `.env.production` sea correcta
- Verifica que el backend esté corriendo: `sudo systemctl status logistic-backend`

### No puedo conectar a EC2
- Verifica que el Security Group permita SSH desde tu IP
- Verifica que la key .pem tenga los permisos correctos

### Error de CORS
- El backend ya está configurado para permitir CORS de cualquier origen

---

¡Listo! Tu plataforma está desplegada y accesible públicamente 🎉

