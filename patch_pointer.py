import re

with open('app.v26.js', 'r') as f:
    js = f.read()

old_events = """        // Bind events for both mouse and touch devices
        keyEl.addEventListener('mousedown', pressKey);
        keyEl.addEventListener('mouseup', releaseKey);
        keyEl.addEventListener('mouseleave', releaseKey);
        keyEl.addEventListener('touchstart', pressKey, {passive: false});
        keyEl.addEventListener('touchend', releaseKey, {passive: false});
        keyEl.addEventListener('touchcancel', releaseKey, {passive: false});"""

new_events = """        // Bind events using Pointer Events for unified mouse/touch/trackpad handling
        keyEl.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return; // only left click
            keyEl.setPointerCapture(e.pointerId);
            pressKey(e);
        });
        keyEl.addEventListener('pointerup', (e) => {
            keyEl.releasePointerCapture(e.pointerId);
            releaseKey(e);
        });
        keyEl.addEventListener('pointercancel', releaseKey);
        keyEl.addEventListener('pointerleave', releaseKey);"""

js = js.replace(old_events, new_events)

with open('app.v26.js', 'w') as f:
    f.write(js)
