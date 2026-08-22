import re

with open('app.v25.js', 'r') as f:
    js = f.read()

# 1. Update single answer state to include octave
js = js.replace("selectedAnswer: {\n        note: null,\n        accidental: 'n'\n    },", "selectedAnswer: {\n        note: null,\n        accidental: 'n',\n        octave: null\n    },")

# 2. Update resetSelection
js = js.replace("state.selectedAnswer.accidental = 'n';", "state.selectedAnswer.accidental = 'n';\n    state.selectedAnswer.octave = null;")

# 3. Update piano handler
piano_old = """                } else {
                    keyEl.classList.add('selected');
                    state.currentChordInput.push({ note, accidental });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;"""
piano_new = """                } else {
                    keyEl.classList.add('selected');
                    state.currentChordInput.push({ note, accidental, octave });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;
                state.selectedAnswer.octave = octave;"""
js = js.replace(piano_old, piano_new)

# 4. Update guitar handler
guitar_old = """                } else {
                    el.classList.add('selected');
                    state.currentChordInput.push({ note, accidental });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;"""
guitar_new = """                } else {
                    el.classList.add('selected');
                    state.currentChordInput.push({ note, accidental, octave });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;
                state.selectedAnswer.octave = octave;"""
js = js.replace(guitar_old, guitar_new)

# 5. Update checkAnswer
check_old = """    if (isChord) {
        if (state.currentChordInput.length < activeItem.length) return;
        
        const correctPitches = activeItem.map(n => getPitchClass(n.key, n.accidental)).sort((a,b)=>a-b);
        const selectedPitches = state.currentChordInput.map(n => getPitchClass(n.note, n.accidental)).sort((a,b)=>a-b);
        
        isCorrect = correctPitches.length === selectedPitches.length && 
                    correctPitches.every((p, i) => p === selectedPitches[i]);
                    
        userNoteString = state.currentChordInput.map(n => formatNote(n.note, n.accidental)).join(' ');
    } else {
        if (!state.selectedAnswer.note) return;
        const correctPitch = getPitchClass(activeItem[0].key, activeItem[0].accidental);
        const selectedPitch = getPitchClass(state.selectedAnswer.note, state.selectedAnswer.accidental);
        isCorrect = correctPitch === selectedPitch;
        userNoteString = formatNote(state.selectedAnswer.note, state.selectedAnswer.accidental);
    }"""
    
check_new = """    const getAbsolutePitch = (n, acc, oct) => getPitchClass(n, acc) + (parseInt(oct) * 12);

    if (isChord) {
        if (state.currentChordInput.length < activeItem.length) return;
        
        const correctPitches = activeItem.map(n => getAbsolutePitch(n.key, n.accidental, n.octave)).sort((a,b)=>a-b);
        const selectedPitches = state.currentChordInput.map(n => getAbsolutePitch(n.note, n.accidental, n.octave)).sort((a,b)=>a-b);
        
        isCorrect = correctPitches.length === selectedPitches.length && 
                    correctPitches.every((p, i) => p === selectedPitches[i]);
                    
        userNoteString = state.currentChordInput.map(n => formatNote(n.note, n.accidental)).join(' ');
    } else {
        if (!state.selectedAnswer.note) return;
        const correctPitch = getAbsolutePitch(activeItem[0].key, activeItem[0].accidental, activeItem[0].octave);
        const selectedPitch = getAbsolutePitch(state.selectedAnswer.note, state.selectedAnswer.accidental, state.selectedAnswer.octave);
        isCorrect = correctPitch === selectedPitch;
        userNoteString = formatNote(state.selectedAnswer.note, state.selectedAnswer.accidental);
    }"""
js = js.replace(check_old, check_new)

with open('app.v25.js', 'w') as f:
    f.write(js)
