import re

with open('app.v30.js', 'r') as f:
    js = f.read()

old_block = """            els.pianoWrapper.style.maxWidth = '100%';
            els.staffContainer.classList.remove('song-mode');
            renderSong();"""

new_block = """            els.pianoWrapper.style.maxWidth = '100%';
            els.staffContainer.classList.remove('song-mode');
            els.songControls.style.display = 'flex';
            if (!state.songData) {
                state.songData = SONGS[els.songSelect.value || 'twinkle'];
                els.bpmInput.value = state.songData.bpm;
            }
            renderSong();"""

js = js.replace(old_block, new_block)

with open('app.v30.js', 'w') as f:
    f.write(js)
