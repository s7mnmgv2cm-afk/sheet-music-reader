import re

with open('app.v28.js', 'r') as f:
    js = f.read()

old_click = """        btn.addEventListener('click', (e) => {
            const keyEl = e.currentTarget;
            if (!state.isStarted) return;"""

new_click = """        btn.addEventListener('click', (e) => {
            const keyEl = e.currentTarget;
            alert("Clicked! isStarted: " + state.isStarted + ", note: " + keyEl.dataset.note);
            if (!state.isStarted) return;"""

js = js.replace(old_click, new_click)

with open('app.v28.js', 'w') as f:
    f.write(js)
