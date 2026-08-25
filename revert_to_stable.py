import re

with open('app.v27.js', 'r') as f:
    js = f.read()

# The current block we want to replace starts at `els.pianoKeys.forEach` and ends at `// Cheat Sheet Events`
start_str = "els.pianoKeys.forEach(keyEl => {"
end_str = "// Cheat Sheet Events"

if start_str in js and end_str in js:
    before = js[:js.find(start_str)]
    after = js[js.find(end_str):]
    
    stable_piano = """els.pianoKeys.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const keyEl = e.currentTarget;
            if (!state.isStarted) return;
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            
            let toneAccidental = accidental === 'n' ? '' : accidental;
            if (synth) synth.triggerAttackRelease(`${note}${toneAccidental}${octave}`, "8n");
            
            if (state.appMode === 'play') {
                keyEl.classList.add('selected');
                setTimeout(() => keyEl.classList.remove('selected'), 150);
                return;
            }
            if (state.appMode === 'song') {
                keyEl.classList.add('selected');
                setTimeout(() => keyEl.classList.remove('selected'), 150);
                handleSongHit(note, accidental, octave);
                return;
            }
            
            if (state.questionType === 'chord') {
                if (keyEl.classList.contains('selected')) {
                    keyEl.classList.remove('selected');
                    state.currentChordInput = state.currentChordInput.filter(n => !(n.note === note && n.accidental === accidental));
                } else {
                    keyEl.classList.add('selected');
                    state.currentChordInput.push({ note, accidental, octave });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;
                state.selectedAnswer.octave = octave;
                els.pianoKeys.forEach(b => b.classList.remove('selected'));
                keyEl.classList.add('selected');
                checkAnswer();
            }
        });
    });

    """
    
    with open('app.v27.js', 'w') as f:
        f.write(before + stable_piano + after)

