# Guía VPS — Conexión, Deploy y Mantenimiento

Referencia para conectarse al VPS y gestionar proyectos Next.js + PostgreSQL desde Windows usando Paramiko.

---

## Datos del VPS

| Campo       | Valor                  |
|-------------|------------------------|
| **IP**      | `212.85.12.168`        |
| **Usuario** | `root`                 |
| **Puerto**  | `22`                   |
| **OS**      | Ubuntu                 |
| **SSH**     | `ssh root@212.85.12.168` |

---

## Proyectos activos

| Proyecto   | Puerto | PM2 name   | Ruta                  | BD              | Usuario BD       |
|------------|--------|------------|-----------------------|-----------------|------------------|
| mega-hard  | 3000   | mega-hard  | `/var/www/megahard`   | `mega_hard_db`  | `mega_hard_user` |
| NelaGlow   | 3001   | nelaglow   | `/var/www/nelaglow`   | `nelaglow_db`   | `nelaglow_user`  |

> Próximo proyecto libre: **puerto 3002**, ruta `/var/www/<nombre>`.

---

## Conexión SSH desde Windows con Paramiko

### Instalación
```bash
pip install paramiko
```

### Patrón base
```python
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('212.85.12.168', username='root', password='Jflores@@2025', timeout=30)

def run(cmd, timeout=60):
    print(f'\n$ {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out)
    if err: print('ERR:', err)
    return out

# Tus comandos aquí
run('pm2 status')

client.close()
```

> **IMPORTANTE**: Siempre usar `encoding='utf-8', errors='replace'` para no crashear con emojis en los scripts de deploy.

### Subir archivos via SFTP
```python
sftp = client.open_sftp()
sftp.put('ruta/local/archivo.sql', '/ruta/remota/archivo.sql')
sftp.close()
```

---

## Deploy de nuevo proyecto Next.js

### 1. En el VPS — crear BD y usuario
```python
run("sudo -u postgres psql -c \"CREATE USER miapp_user WITH PASSWORD 'MiApp2025' CREATEDB;\"")
run("sudo -u postgres psql -c \"CREATE DATABASE miapp_db OWNER miapp_user;\"")
run("sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE miapp_db TO miapp_user;\"")
```

### 2. Clonar repo y configurar
```python
run('git clone https://github.com/usuario/repo.git /var/www/miapp')
run('chmod +x /var/www/miapp/deploy.sh')

# Escribir .env
env = '''DATABASE_URL="postgresql://miapp_user:MiApp2025@localhost:5432/miapp_db?schema=public"
AUTH_SECRET="<generar con: openssl rand -base64 32>"
AUTH_URL="http://212.85.12.168:3002"
NODE_ENV="production"'''
run(f"""cat > /var/www/miapp/.env << 'ENVEOF'\n{env}\nENVEOF""")
```

### 3. Setup inicial y deploy
```python
run('/var/www/miapp/deploy.sh --setup', timeout=60)
run('cd /var/www/miapp && ./deploy.sh', timeout=600)
```

---

## Actualizar proyecto existente (después de git push)

```python
run('cd /var/www/nelaglow && git pull && ./deploy.sh', timeout=600)
```

---

## Migrar datos locales → VPS

### Exportar con pg desde local
```javascript
// scripts/export-seed.js
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Consultar datos y generar seed.sql con INSERT ... ON CONFLICT (id) DO NOTHING
```

### Subir y ejecutar seed
```python
sftp.put(r'C:\Devs\MiApp\scripts\seed.sql', '/tmp/seed.sql')
run('PGPASSWORD=MiApp2025 psql -h 127.0.0.1 -U miapp_user -d miapp_db -f /tmp/seed.sql')
```

### Verificar estructura de tablas antes de generar el seed
```python
run('PGPASSWORD=MiApp2025 psql -h 127.0.0.1 -U miapp_user -d miapp_db -c "\\d nombre_tabla"')
```
> Siempre verificar columnas reales en el VPS — pueden diferir de la BD local si el schema evolucionó.

---

## Crear usuario admin en BD vacía

```python
# 1. Generar hash bcrypt con node del VPS
hash_val = run("node -e \"const b=require('/var/www/nelaglow/node_modules/bcryptjs');b.hash('admin123',12).then(h=>console.log(h))\"")

# 2. Insertar usuario (ajustar columnas según schema real)
sql = f"""INSERT INTO users (id, username, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'admin', '{hash_val}', 'Administrador', 'ADMIN', true, NOW(), NOW());"""
run(f"cat > /tmp/seed_user.sql << 'EOF'\n{sql}\nEOF")
run('PGPASSWORD=NelaGlow2025 psql -h 127.0.0.1 -U nelaglow_user -d nelaglow_db -f /tmp/seed_user.sql')
```

---

## Comandos de mantenimiento PM2

```python
run('pm2 status')                    # Ver todos los procesos
run('pm2 logs nelaglow --lines 50')  # Últimas 50 líneas de logs
run('pm2 restart nelaglow')          # Reiniciar sin redeploy
run('pm2 stop nelaglow')             # Detener
run('pm2 start ecosystem.config.js --env production')  # Iniciar
run('pm2 save')                      # Persistir configuración
```

---

## Consultas PostgreSQL frecuentes

```python
# Ver bases de datos
run('sudo -u postgres psql -c "\\l"')

# Ver usuarios
run('sudo -u postgres psql -c "\\du"')

# Ver tablas de un proyecto
run('PGPASSWORD=NelaGlow2025 psql -h 127.0.0.1 -U nelaglow_user -d nelaglow_db -c "\\dt"')

# Ver estructura de una tabla
run('PGPASSWORD=NelaGlow2025 psql -h 127.0.0.1 -U nelaglow_user -d nelaglow_db -c "\\d users"')

# Contar registros
run('PGPASSWORD=NelaGlow2025 psql -h 127.0.0.1 -U nelaglow_user -d nelaglow_db -c "SELECT COUNT(*) FROM products;"')
```

---

## Notas importantes

1. **Passwords sin `!`**: El carácter `!` en passwords de PostgreSQL causa problemas al pasarlo por shell. Usar passwords sin `!` para usuarios de BD.
2. **Encoding UTF-8**: Siempre inicializar `sys.stdout` con `utf-8` antes de usar Paramiko — los scripts de deploy tienen emojis.
3. **Verificar schema antes de seed**: Las columnas en el VPS pueden diferir de local. Ejecutar `\d tabla` antes de generar el SQL.
4. **Puerto siguiente libre**: El siguiente proyecto debe usar puerto **3002**.
5. **ESLint/TS en build**: Si el build falla por errores de linting, agregar a `next.config.ts`:
   ```ts
   eslint: { ignoreDuringBuilds: true },
   typescript: { ignoreBuildErrors: true },
   ```
6. **`ecosystem.config.js`**: Cada proyecto necesita su propio archivo con `name`, `PORT` y `APP_DIR` únicos.

---

**Creado:** 2026-02-26
