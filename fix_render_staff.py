import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Only fix in renderStaff
old_render = """function renderStaff() {
    els.staffContainer.innerHTML = '';
    els.staffContainer.classList.add('song-mode');"""

new_render = """function renderStaff() {
    els.staffContainer.innerHTML = '';"""

js = js.replace(old_render, new_render)

with open('app.v26.js', 'w') as f:
    f.write(js)
