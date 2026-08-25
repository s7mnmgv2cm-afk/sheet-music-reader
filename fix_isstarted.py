import re

with open('app.v28.js', 'r') as f:
    js = f.read()

old_start = "els.startOverlay.classList.add('hidden');"
new_start = "state.isStarted = true;\n            els.startOverlay.classList.add('hidden');"

# Replace all occurrences (both in try and catch blocks)
js = js.replace(old_start, new_start)

# Remove the debug alert I added just now
js = js.replace('alert("Clicked! isStarted: " + state.isStarted + ", note: " + keyEl.dataset.note);', '')

with open('app.v28.js', 'w') as f:
    f.write(js)
