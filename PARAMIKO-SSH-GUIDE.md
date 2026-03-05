# Guía: Conexión SSH a VPS con Paramiko (Python)

Referencia para conectarse a un VPS Linux desde Windows usando `paramiko` — útil cuando `sshpass` no está disponible.

---

## Instalación

```bash
pip install paramiko
```

---

## Datos del VPS (Bruno Ferrini)

| Campo | Valor |
|-------|-------|
| **IP** | `190.119.16.211` |
| **Usuario** | `root` |
| **Puerto** | `22` (default) |
| **OS** | Ubuntu |

---

## Patrón básico: ejecutar comando remoto

```python
import paramiko

def ssh_exec(command, host="190.119.16.211", user="root", password="..."):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password)

    stdin, stdout, stderr = client.exec_command(command)
    out = stdout.read().decode()
    err = stderr.read().decode()

    client.close()
    return out, err

# Uso
out, err = ssh_exec("systemctl status mi-servicio")
print(out)
```

---

## Patrón: subir archivos via SFTP

```python
import paramiko

def sftp_upload(local_path, remote_path, host="190.119.16.211", user="root", password="..."):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password)

    sftp = client.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()
    client.close()
    print(f"Subido: {local_path} -> {remote_path}")

# Uso
sftp_upload("bot.py", "/root/mi-proyecto/bot.py")
```

---

## Patrón: deploy completo (subir archivos + ejecutar comandos)

```python
import paramiko
import os

VPS_HOST = "190.119.16.211"
VPS_USER = "root"
VPS_PASS = "..."           # Mejor leer de .env
VPS_PATH = "/root/mi-proyecto"
SERVICE  = "mi-servicio"

# Archivos a subir
FILES = [
    "main.py",
    "requirements.txt",
    # ...
]

def deploy():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS)

    sftp = client.open_sftp()

    # Subir archivos
    for filename in FILES:
        local  = filename
        remote = f"{VPS_PATH}/{filename}"
        sftp.put(local, remote)
        print(f"  Subido: {filename}")

    sftp.close()

    # Ejecutar comandos post-deploy
    commands = [
        f"cd {VPS_PATH} && pip3 install -r requirements.txt -q",
        f"systemctl restart {SERVICE}",
        f"systemctl is-active {SERVICE}",
    ]

    for cmd in commands:
        _, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        print(f"$ {cmd}")
        if out: print(f"  {out}")
        if err: print(f"  ERR: {err}")

    client.close()
    print("Deploy completo.")

if __name__ == "__main__":
    deploy()
```

---

## Leer archivo remoto

```python
def ssh_read_file(remote_path, **kwargs):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(**kwargs)

    sftp = client.open_sftp()
    with sftp.open(remote_path, "r") as f:
        content = f.read().decode()

    sftp.close()
    client.close()
    return content

# Uso
crontab = ssh_read_file("/var/spool/cron/crontabs/root",
                         hostname="190.119.16.211", username="root", password="...")
```

---

## Comandos de mantenimiento frecuentes

```python
# Ver estado de un servicio
ssh_exec("systemctl status mi-servicio --no-pager")

# Ver logs en tiempo real (últimas 50 líneas)
ssh_exec("journalctl -u mi-servicio -n 50 --no-pager")

# Reiniciar servicio
ssh_exec("systemctl restart mi-servicio")

# Ver crontab de root
ssh_exec("crontab -l")

# Modificar crontab
new_cron = "0 14-23,0-4 * * * /usr/bin/python3 /root/script.py"
ssh_exec(f'(crontab -l 2>/dev/null; echo "{new_cron}") | crontab -')

# Ver logs de archivo
ssh_exec("tail -50 /root/mi-proyecto/logs/mi-log.log")

# Espacio en disco
ssh_exec("df -h /")

# Procesos corriendo
ssh_exec("ps aux | grep python")
```

---

## Notas importantes

### Timezone en cron (VPS con Ubuntu)
El cron daemon **ignora** la variable `TZ=` en el crontab en algunos sistemas.
**Solución**: usar horas UTC explícitas.

```
# Lima = UTC-5
# 9am Lima  = 14:00 UTC
# 11pm Lima = 04:00 UTC (día siguiente)

# MAL (TZ puede ignorarse):
TZ=America/Lima
0 9-23 * * * /usr/bin/python3 /root/script.py

# BIEN (UTC explícito):
0 14-23,0-4 * * * /usr/bin/python3 /root/script.py
59 4 * * *        /usr/bin/python3 /root/script.py
```

### OpenSSL legacy (SQL Server TLS 1.0/1.1)
Si el script usa pyodbc + SQL Server antiguo, agregar en el comando cron:

```
OPENSSL_CONF=/root/inventario-pro/openssl_legacy.cnf /usr/bin/python3 /root/script.py
```

### Credenciales: no hardcodear
Leer password desde `.env` local:

```python
from dotenv import load_dotenv
import os

load_dotenv()
VPS_PASS = os.getenv("VPS_PASSWORD")
```

---

## Por qué paramiko y no otras opciones

| Herramienta | Windows | Automatizable | Notas |
|-------------|---------|---------------|-------|
| `sshpass` | No | Sí | Solo Linux/Mac |
| `ssh` CLI | Sí | Difícil (password interactivo) | |
| `paramiko` | **Sí** | **Sí** | Librería Python pura |
| `fabric` | Sí | Sí | Usa paramiko internamente, más alto nivel |

---

## Proyectos que usan este patrón

- `MonitorAppBF/deploy_vps.py` — sube bot + reinicia servicio monitor-appbf
- `AppBF/` — deploy via paramiko cuando se necesita SSH desde Windows

---

**Creado:** 2026-02-26
**Autor:** Claude Code Assistant
