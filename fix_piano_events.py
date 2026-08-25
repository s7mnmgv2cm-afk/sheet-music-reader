import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Extract from "els.pianoKeys.forEach(btn => {" to its corresponding closing "});"
# To be safe, we will use regex to find the block.
# It starts at els.pianoKeys.forEach(btn => {
# and ends right before "// Cheat Sheet Events"
start_str = "els.pianoKeys.forEach(btn => {"
end_str = "// Cheat Sheet Events"

before = js[:js.find(start_str)]
after = js[js.find(end_str):]

new_piano = """    els.pianoKeys.forEach(keyEl => {
        const pressKey = (e) => {
            if (e && e.cancelable) e.preventDefault(); 
            if (!state.isStarted || keyEl.dataset.isPressed === 'true') return;
            keyEl.dataset.isPressed = 'true';
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            let toneAccidental = accidental === 'n' ? '' : accidental;
            const noteString = `${note}${toneAccidental}${octave}`;
            
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
            if (e && e.cancelable) e.preventDefault();
            if (keyEl.dataset.isPressed !== 'true') return;
            keyEl.dataset.isPressed = 'false';
            
            const note = keyEl.dataset.note;
            const accidental = keyEl.dataset.accidental;
            const octave = keyEl.dataset.octave || 5;
            let toneAccidental = accidental === 'n' ? '' : accidental;
            const noteString = `${note}${toneAccidental}${octave}`;
            
            if (synth) synth.triggerRelease(noteString);
            
            if (state.appMode === 'play' || state.appMode === 'song') {
                keyEl.classList.remove('selected');
            }
        };

        keyEl.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            keyEl.setPointerCapture(e.pointerId);
            pressKey(e);
        });
        keyEl.addEventListener('pointerup', (e) => {
            keyEl.releasePointerCapture(e.pointerId);
            releaseKey(e);
        });
        keyEl.addEventListener('pointercancel', releaseKey);
        keyEl.addEventListener('pointerleave', releaseKey);
    });

    """

with open('app.v26.js', 'w') as f:
    f.write(before + new_piano + after)

