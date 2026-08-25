import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Remove the pointer capture just in case it's causing issues
js = js.replace("keyEl.setPointerCapture(e.pointerId);", "")
js = js.replace("keyEl.releasePointerCapture(e.pointerId);", "")

with open('app.v26.js', 'w') as f:
    f.write(js)
