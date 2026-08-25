import re

with open('app.v25.js', 'r') as f:
    js = f.read()

# In renderStaff, update the piano octaves based on the current clef
dynamic_octave = """
    // Connect it to the rendering context and draw
    stave.setContext(context).draw();

    // DYNAMICALLY UPDATE PIANO OCTAVES BASED ON CLEF
    if (state.notes.length > 0) {
        const currentClef = state.notes[0][0].clef;
        const baseOctave = currentClef === 'bass' ? 2 : 4;
        
        // Update all 24 keys (14 white + 10 black)
        const keys = document.querySelectorAll('.piano-key');
        let currentNoteIndex = 0;
        keys.forEach((keyEl) => {
            const isOctave2 = currentNoteIndex >= 12; // 12 notes per octave
            const oct = baseOctave + (isOctave2 ? 1 : 0);
            keyEl.dataset.octave = oct;
            
            const label = keyEl.querySelector('.key-label');
            if (label) {
                const noteName = keyEl.dataset.note;
                const acc = keyEl.dataset.accidental === '#' ? '♯' : '';
                label.textContent = `${noteName}${acc}${oct}`;
            }
            currentNoteIndex++;
        });
    }
"""

js = js.replace("    // Connect it to the rendering context and draw\n    stave.setContext(context).draw();", dynamic_octave)

# Prevent Cb on lowest octave and B# on highest octave in generateQuestion
prevent_out_of_bounds = """
            let accidental = 'n';
            if (useAccidentals) {
                const rand = Math.random();
                if (rand < 0.25) accidental = 'b';
                else if (rand < 0.5) accidental = '#';
            }
            
            // PREVENT OUT OF BOUNDS NOTES
            if (note === 'C' && accidental === 'b' && octave === octaveRange[0]) {
                accidental = 'n'; // Cb at bottom of range -> B (below range), so remove flat
            }
            if (note === 'B' && accidental === '#' && octave === octaveRange[1]) {
                accidental = 'n'; // B# at top of range -> C (above range), so remove sharp
            }
"""

js = re.sub(r"            let accidental = 'n';\n            if \(useAccidentals\) \{\n                const rand = Math\.random\(\);\n                if \(rand < 0\.25\) accidental = 'b';\n                else if \(rand < 0\.5\) accidental = '#';\n            \}", prevent_out_of_bounds, js)

with open('app.v25.js', 'w') as f:
    f.write(js)
