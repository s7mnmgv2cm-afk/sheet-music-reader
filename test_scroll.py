import re

with open('app.v32.js', 'r') as f:
    js = f.read()

# Make sure playbackCursor is always visible for debugging, even during count-in
js = js.replace("els.playbackCursor.classList.add('hidden');", "// els.playbackCursor.classList.add('hidden');")
js = js.replace("els.playbackCursor.classList.remove('hidden');", "")

with open('app.v32.js', 'w') as f:
    f.write(js)
