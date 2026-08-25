import re

with open('app.v27.js', 'r') as f:
    js = f.read()

# Remove isPressed logic
js = js.replace("if (!state.isStarted || keyEl.dataset.isPressed === 'true') return;\n            keyEl.dataset.isPressed = 'true';", "if (!state.isStarted) return;")
js = js.replace("if (keyEl.dataset.isPressed !== 'true') return;\n            keyEl.dataset.isPressed = 'false';", "")

with open('app.v27.js', 'w') as f:
    f.write(js)
