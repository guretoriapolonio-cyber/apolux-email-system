"""
Apolux — Launcher do App Desktop
Abre o sistema como janela nativa de programa (sem precisar de navegador separado)
Roda o mesmo backend Flask, então o site em localhost:5050 também funciona se preferir.
"""

import threading
import time
import webview
from app import app, verificar_agendados_loop

def iniciar_flask():
    app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)

if __name__ == "__main__":
    threading.Thread(target=iniciar_flask, daemon=True).start()
    threading.Thread(target=verificar_agendados_loop, daemon=True).start()
    time.sleep(1.2)

    webview.create_window(
        "Apolux — Technology & AI",
        "http://127.0.0.1:5050",
        width=1280,
        height=820,
        min_size=(1000, 650),
        background_color="#0b0e14"
    )
    webview.start()
