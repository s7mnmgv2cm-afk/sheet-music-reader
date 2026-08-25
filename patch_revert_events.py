import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Use regex to replace the pointer events block
js = re.sub(r"keyEl\.addEventListener\('pointerdown'[\s\S]*?keyEl\.addEventListener\('pointerleave', releaseKey\);", """keyEl.addEventListener('mousedown', pressKey);
        keyEl.addEventListener('mouseup', releaseKey);
        keyEl.addEventListener('mouseleave', releaseKey);
        keyEl.addEventListener('touchstart', pressKey, {passive: false});
        keyEl.addEventListener('touchend', releaseKey, {passive: false});
        keyEl.addEventListener('touchcancel', releaseKey, {passive: false});""", js)

with open('app.v26.js', 'w') as f:
    f.write(js)
