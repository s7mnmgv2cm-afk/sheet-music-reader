import re

with open('app.v27.js', 'r') as f:
    js = f.read()

# Replace the event listeners to properly handle touch
old_bind = """        // Bulletproof event binding
        keyEl.addEventListener('mousedown', pressKey);
        keyEl.addEventListener('mouseup', releaseKey);
        keyEl.addEventListener('mouseleave', releaseKey);
        keyEl.addEventListener('touchstart', pressKey, {passive: false});
        keyEl.addEventListener('touchend', releaseKey, {passive: false});
        keyEl.addEventListener('touchcancel', releaseKey, {passive: false});"""

new_bind = """        // Bulletproof event binding
        keyEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // only left click
            pressKey(e);
        });
        keyEl.addEventListener('mouseup', releaseKey);
        keyEl.addEventListener('mouseleave', releaseKey);
        
        keyEl.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault(); // Prevents synthetic mousedown
            pressKey(e);
        }, {passive: false});
        keyEl.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            releaseKey(e);
        }, {passive: false});
        keyEl.addEventListener('touchcancel', releaseKey, {passive: false});"""

js = js.replace(old_bind, new_bind)

# Also ensure isPressed doesn't get stuck by allowing a tiny timeout to clear it or just trusting it now that synthetic clicks are prevented
with open('app.v27.js', 'w') as f:
    f.write(js)
