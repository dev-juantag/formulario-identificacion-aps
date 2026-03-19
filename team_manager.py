import json
import os
import sys

TEAM_DIR = ".antigravity/team"

def init_team():
    """Inicializa la infraestructura del equipo."""
    os.makedirs(f"{TEAM_DIR}/mailbox", exist_ok=True)
    os.makedirs(f"{TEAM_DIR}/locks", exist_ok=True)
    tasks_path = f"{TEAM_DIR}/tasks.json"
    if not os.path.exists(tasks_path):
        with open(tasks_path, 'w') as f:
            json.dump({"tasks": [], "members": []}, f, indent=2)
    if not os.path.exists(f"{TEAM_DIR}/broadcast.msg"):
        with open(f"{TEAM_DIR}/broadcast.msg", 'w') as f: f.write("")
    print("✓ Infraestructura 'Equipo Tagbot' lista.")

def assign_task(title, assigned_to, deps=[]):
    """Asigna una nueva tarea con soporte para dependencias."""
    path = f"{TEAM_DIR}/tasks.json"
    if not os.path.exists(path):
        init_team()
    with open(path, 'r+') as f:
        data = json.load(f)
        task = {
            "id": len(data["tasks"]) + 1,
            "title": title,
            "status": "PENDING",
            "plan_approved": False,
            "assigned_to": assigned_to,
            "dependencies": deps
        }
        data["tasks"].append(task)
        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()
    print(f"✓ Tarea {task['id']} ({title}) asignada a {assigned_to}.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "init":
            init_team()
        elif cmd == "add":
            if len(sys.argv) > 3:
                assign_task(sys.argv[2], sys.argv[3])
