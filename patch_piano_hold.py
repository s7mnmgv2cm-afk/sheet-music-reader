import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Replace the piano click event listener with mousedown/mouseup logic
old_piano = """    els.pianoKeys.forEach(keyEl => {
        keyEl.addEventListener('click', (e) => {
            if (!state.isStarted) return;
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            
            let toneAccidental = accidental === 'n' ? '' : accidental;
            if (synth) synth.triggerAttackRelease(`${note}${toneAccidental}${octave}`, "8n");
            
            if (state.appMode === 'play') {
                // Just flash the key
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
    });"""

new_piano = """    els.pianoKeys.forEach(keyEl => {
        const pressKey = (e) => {
            if (e && e.cancelable) e.preventDefault(); // prevent double firing on touch
            if (!state.isStarted || keyEl.dataset.isPressed === 'true') return;
            keyEl.dataset.isPressed = 'true';
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            
            let toneAccidental = accidental === 'n' ? '' : accidental;
            const noteString = `${note}${toneAccidental}${octave}`;
            
            if (synth) {
                synth.triggerAttack(noteString);
            }
            
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
            if (e && e.cancelable) e.preventDefault();
            if (keyEl.dataset.isPressed !== 'true') return;
            keyEl.dataset.isPressed = 'false';
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            let toneAccidental = accidental === 'n' ? '' : accidental;
            const noteString = `${note}${toneAccidental}${octave}`;
            
            if (synth) {
                synth.triggerRelease(noteString);
            }
            
            if (state.appMode === 'play' || state.appMode === 'song') {
                keyEl.classList.remove('selected');
            }
        };

        // Bind events for both mouse and touch devices
        keyEl.addEventListener('mousedown', pressKey);
        keyEl.addEventListener('mouseup', releaseKey);
        keyEl.addEventListener('mouseleave', releaseKey);
        keyEl.addEventListener('touchstart', pressKey, {passive: false});
        keyEl.addEventListener('touchend', releaseKey, {passive: false});
        keyEl.addEventListener('touchcancel', releaseKey, {passive: false});
    });"""

js = js.replace(old_piano, new_piano)

# Also fix the guitar click listener just in case, to make it consistent (optional, but good)
# Actually, the user asked specifically about "鍵盤" (keyboard), so let's stick to the keyboard to be safe and avoid breaking guitar unless necessary. 

with open('app.v26.js', 'w') as f:
    f.write(js)
