import re

with open('app.v26.js', 'r') as f:
    js = f.read()

old_else = """        } else {
            els.staffCard.style.display = 'flex';
            els.instruction.style.display = 'block';
            els.historyArea.style.display = 'block';
            els.pianoWrapper.style.maxWidth = '900px';
            stopSong();
            generateNextQuestion();
        }"""
        
new_else = """        } else {
            els.staffCard.style.display = 'flex';
            els.instruction.style.display = 'block';
            els.historyArea.style.display = 'block';
            els.pianoWrapper.style.maxWidth = '900px';
            els.staffContainer.classList.remove('song-mode');
            stopSong();
            generateNextQuestion();
        }"""

js = js.replace(old_else, new_else)

with open('app.v26.js', 'w') as f:
    f.write(js)
