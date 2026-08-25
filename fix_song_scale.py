import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Add song-mode class
js = js.replace("els.staffContainer.innerHTML = '';", "els.staffContainer.innerHTML = '';\n    els.staffContainer.classList.add('song-mode');")

# Fix scale issues
old_render = """    const width = 250;
    renderer.resize(width + 20, 150);
    const context = renderer.getContext();
    context.scale(1.8, 1.8);
    
    const staveWidth = 220;"""
new_render = """    const width = 450;
    renderer.resize(width, 180);
    const context = renderer.getContext();
    // No native scale, we rely on CSS or just draw it normally
    // wait, VexFlow defaults are small. Let's do native scale:
    context.scale(1.5, 1.5);
    
    const staveWidth = 280;"""
js = js.replace(old_render, new_render)

old_cursor = """    const startX = state.songNotesInMeasure[0].x * 1.8; // scale adjustment"""
new_cursor = """    const startX = state.songNotesInMeasure[0].x * 1.5; // match native scale"""
js = js.replace(old_cursor, new_cursor)

old_cursor2 = """            const targetX = state.songNotesInMeasure[noteIndex].x * 1.8;"""
new_cursor2 = """            const targetX = state.songNotesInMeasure[noteIndex].x * 1.5;"""
js = js.replace(old_cursor2, new_cursor2)

old_hit = """        const noteX = state.songNotesInMeasure[i].x * 1.8 + 15;"""
new_hit = """        const noteX = state.songNotesInMeasure[i].x * 1.5 + 15;"""
js = js.replace(old_hit, new_hit)

# Clean up mode toggle
js = js.replace("els.pianoWrapper.style.maxWidth = '100%';", "els.pianoWrapper.style.maxWidth = '100%';\n            els.staffContainer.classList.remove('song-mode');")

with open('app.v26.js', 'w') as f:
    f.write(js)

with open('style.css', 'r') as f:
    css = f.read()

css += """
.staff-container.song-mode svg {
    transform: none !important;
}
"""
with open('style.css', 'w') as f:
    f.write(css)
