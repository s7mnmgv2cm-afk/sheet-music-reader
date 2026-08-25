import re

with open('app.v29.js', 'r') as f:
    js = f.read()

# Replace the current click logic with mousedown/up
start_str = "els.pianoKeys.forEach(btn => {"
end_str = "// Cheat Sheet Events"

before = js[:js.find(start_str)]
after = js[js.find(end_str):]

new_piano = """els.pianoKeys.forEach(keyEl => {
        const pressKey = (e) => {
            if (!state.isStarted) return;
            
            // Prevent double firing if already pressed
            if (keyEl.dataset.isPressed === 'true') return;
            keyEl.dataset.isPressed = 'true';
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            let toneAccidental = accidental === 'n' ? '' : accidental;
            const noteString = `${note}${toneAccidental}${octave}`;
            
            // Trigger Attack (Start playing)
            if (synth) synth.triggerAttack(noteString);
            
            if (state.appMode === 'play') {
                keyEl.classList.add('selected');
                return;
            }
            if (state.appMode === 'song') {
                keyEl.classList.add('selected');
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
        };

        const releaseKey = (e) => {
            if (keyEl.dataset.isPressed !== 'true') return;
            keyEl.dataset.isPressed = 'false';
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            let toneAccidental = accidental === 'n' ? '' : accidental;
            const noteString = `${note}${toneAccidental}${octave}`;
            
            // Trigger Release (Stop playing)
            if (synth) synth.triggerRelease(noteString);
            
            if (state.appMode === 'play' || state.appMode === 'song') {
                keyEl.classList.remove('selected');
            }
        };

        // Standard Mouse Events
        keyEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only respond to left click
            pressKey(e);
        });
        keyEl.addEventListener('mouseup', releaseKey);
        keyEl.addEventListener('mouseleave', releaseKey);
        
        // Standard Touch Events (prevent default to avoid synthetic mousedown)
        keyEl.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            pressKey(e);
        }, {passive: false});
        keyEl.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            releaseKey(e);
        }, {passive: false});
        keyEl.addEventListener('touchcancel', releaseKey, {passive: false});
    });

    """

with open('app.v29.js', 'w') as f:
    f.write(before + new_piano + after)
