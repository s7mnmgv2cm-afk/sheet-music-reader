import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Add elements
js = js.replace("appModeSelect: document.getElementById('app-mode-select'),", """appModeSelect: document.getElementById('app-mode-select'),
    songControls: document.getElementById('song-controls'),
    practiceControls: document.getElementById('practice-controls'),
    songSelect: document.getElementById('song-select'),
    bpmInput: document.getElementById('bpm-input'),
    songPlayBtn: document.getElementById('song-play-btn'),
    songStopBtn: document.getElementById('song-stop-btn'),
    songScore: document.getElementById('song-score'),
    playbackCursor: document.getElementById('playback-cursor'),""")

# Add state variables
js = js.replace("appMode: 'practice', // 'practice' or 'play'", """appMode: 'practice', // 'practice', 'play', or 'song'
    songData: null,
    songCurrentMeasure: 0,
    songIsPlaying: false,
    songCombo: 0,
    songNotesInMeasure: [], // to track positions and hits""")

# Init songs
js = js.replace("generateGuitarFretboard();", """generateGuitarFretboard();
    // Populate song select
    if (typeof SONGS !== 'undefined') {
        SONGS.forEach((song, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = song.title;
            els.songSelect.appendChild(opt);
        });
        state.songData = SONGS[0];
        els.bpmInput.value = state.songData.bpm;
    }""")

# Mode toggle logic
mode_toggle_old = """        if (state.appMode === 'play') {
            els.staffCard.style.display = 'none';
            els.instruction.style.display = 'none';
            els.historyArea.style.display = 'none';
            els.pianoWrapper.style.maxWidth = '100%';
        } else {
            els.staffCard.style.display = 'flex';
            els.instruction.style.display = 'block';
            els.historyArea.style.display = 'block';
            els.pianoWrapper.style.maxWidth = '900px';
        }"""
mode_toggle_new = """        els.songControls.style.display = state.appMode === 'song' ? 'flex' : 'none';
        els.practiceControls.style.display = state.appMode === 'practice' ? 'flex' : 'none';
        
        if (state.appMode === 'play') {
            els.staffCard.style.display = 'none';
            els.instruction.style.display = 'none';
            els.historyArea.style.display = 'none';
            els.pianoWrapper.style.maxWidth = '100%';
            stopSong();
        } else if (state.appMode === 'song') {
            els.staffCard.style.display = 'flex';
            els.instruction.style.display = 'none';
            els.historyArea.style.display = 'none';
            els.pianoWrapper.style.maxWidth = '100%';
            renderSongMeasure(0);
        } else {
            els.staffCard.style.display = 'flex';
            els.instruction.style.display = 'block';
            els.historyArea.style.display = 'block';
            els.pianoWrapper.style.maxWidth = '900px';
            stopSong();
            generateNextQuestion();
        }"""
js = js.replace(mode_toggle_old, mode_toggle_new)

# Song play buttons
song_listeners = """    els.songSelect.addEventListener('change', (e) => {
        state.songData = SONGS[e.target.value];
        els.bpmInput.value = state.songData.bpm;
        stopSong();
        renderSongMeasure(0);
    });
    
    els.songPlayBtn.addEventListener('click', startSong);
    els.songStopBtn.addEventListener('click', stopSong);
"""
js = js.replace("els.typeSelect.addEventListener('change',", song_listeners + "    els.typeSelect.addEventListener('change',")

# Keyboard click logic
piano_click = """            if (state.appMode === 'play') {
                // Just flash the key
                keyEl.classList.add('selected');
                setTimeout(() => keyEl.classList.remove('selected'), 150);
                return;
            }"""
piano_click_new = """            if (state.appMode === 'play') {
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
            }"""
js = js.replace(piano_click, piano_click_new)
js = js.replace("if (state.appMode === 'play') {\n                el.classList.add('selected');\n                setTimeout(() => el.classList.remove('selected'), 150);\n                return;\n            }", """if (state.appMode === 'play') {\n                el.classList.add('selected');\n                setTimeout(() => el.classList.remove('selected'), 150);\n                return;\n            }\n            if (state.appMode === 'song') {\n                el.classList.add('selected');\n                setTimeout(() => el.classList.remove('selected'), 150);\n                handleSongHit(note, accidental, octave);\n                return;\n            }""")

# Song challenge functions
song_funcs = """
// --- Song Challenge Logic ---
function renderSongMeasure(measureIdx) {
    state.songCurrentMeasure = measureIdx;
    els.staffContainer.innerHTML = '';
    els.playbackCursor.classList.add('hidden');
    
    if (measureIdx >= state.songData.measures.length) {
        stopSong();
        return;
    }
    
    const measure = state.songData.measures[measureIdx];
    const VF = Vex.Flow;
    
    // Create an SVG renderer and attach it to the DIV element
    const renderer = new VF.Renderer(els.staffContainer, VF.Renderer.Backends.SVG);
    const width = 250;
    renderer.resize(width + 20, 150);
    const context = renderer.getContext();
    context.scale(1.8, 1.8);
    
    const staveWidth = 220;
    const stave = new VF.Stave(10, 10, staveWidth);
    stave.addClef(state.songData.clef);
    stave.setContext(context).draw();
    
    const notes = measure.map(nData => {
        return new VF.StaveNote({
            clef: state.songData.clef,
            keys: nData.keys,
            duration: nData.duration
        });
    });
    
    VF.Formatter.FormatAndDraw(context, stave, notes);
    
    // Store note X coordinates for the cursor and hit detection
    state.songNotesInMeasure = notes.map((n, i) => {
        // VexFlow note.getAbsoluteX() gets the X coordinate relative to the stave
        return {
            x: n.getAbsoluteX(),
            key: measure[i].keys[0],
            duration: measure[i].duration,
            hit: false,
            staveNote: n
        };
    });
    
    // Add the cursor back to the container
    els.staffContainer.appendChild(els.playbackCursor);
    
    // Update piano octaves dynamically
    const baseOctave = state.songData.clef === 'bass' ? 2 : 4;
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

function startSong() {
    if (state.songIsPlaying) return;
    state.songIsPlaying = true;
    state.songCombo = 0;
    els.songScore.textContent = `Combo: ${state.songCombo}`;
    
    els.songPlayBtn.disabled = true;
    els.songStopBtn.disabled = false;
    
    Tone.Transport.bpm.value = parseInt(els.bpmInput.value) || 100;
    renderSongMeasure(0);
    
    // Add 1 measure count-in
    let countIn = 4;
    els.playbackCursor.classList.add('hidden');
    
    const tick = () => {
        if (!state.songIsPlaying) return;
        
        if (countIn > 0) {
            // Play click
            synth.triggerAttackRelease("C5", "32n"); // Metronome click
            countIn--;
            if (countIn === 0) {
                Tone.Transport.start();
                scheduleMeasure();
            } else {
                setTimeout(tick, (60 / Tone.Transport.bpm.value) * 1000);
            }
        }
    };
    tick();
}

let songEventId = null;
let measureProgress = 0;

function scheduleMeasure() {
    els.playbackCursor.classList.remove('hidden');
    
    const bpm = Tone.Transport.bpm.value;
    const beatDuration = 60 / bpm;
    
    const startX = state.songNotesInMeasure[0].x * 1.8; // scale adjustment
    els.playbackCursor.style.left = `${startX}px`;
    
    let noteIndex = 0;
    
    songEventId = Tone.Transport.scheduleRepeat((time) => {
        if (!state.songIsPlaying) return;
        
        synth.triggerAttackRelease("G4", "32n", time, 0.1); // subtle click
        
        if (noteIndex < state.songNotesInMeasure.length) {
            const targetX = state.songNotesInMeasure[noteIndex].x * 1.8;
            Tone.Draw.schedule(() => {
                els.playbackCursor.style.left = `${targetX + 15}px`;
            }, time);
            noteIndex++;
        } else {
            // Measure ended
            Tone.Transport.clear(songEventId);
            Tone.Draw.schedule(() => {
                if (state.songIsPlaying) {
                    renderSongMeasure(state.songCurrentMeasure + 1);
                    if (state.songCurrentMeasure < state.songData.measures.length) {
                        scheduleMeasure();
                    }
                }
            }, time);
        }
    }, "4n");
}

function stopSong() {
    state.songIsPlaying = false;
    Tone.Transport.stop();
    if (songEventId !== null) Tone.Transport.clear(songEventId);
    els.songPlayBtn.disabled = false;
    els.songStopBtn.disabled = true;
    els.playbackCursor.classList.add('hidden');
}

function handleSongHit(note, accidental, octave) {
    if (!state.songIsPlaying || state.songNotesInMeasure.length === 0) return;
    
    // Find the note the cursor is currently near
    const cursorLeft = parseFloat(els.playbackCursor.style.left || 0);
    
    // Find closest note
    let closestNote = null;
    let minDistance = 9999;
    
    for (let i = 0; i < state.songNotesInMeasure.length; i++) {
        if (state.songNotesInMeasure[i].hit) continue;
        const noteX = state.songNotesInMeasure[i].x * 1.8 + 15;
        const dist = Math.abs(cursorLeft - noteX);
        if (dist < minDistance) {
            minDistance = dist;
            closestNote = state.songNotesInMeasure[i];
        }
    }
    
    if (closestNote && minDistance < 50) {
        // Evaluate pitch
        const getAbsolutePitch = (n, acc, oct) => {
            const basePitches = { 'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11 };
            let pitch = basePitches[n.toLowerCase()] + (parseInt(oct) * 12);
            if (acc === '#') pitch += 1;
            if (acc === 'b') pitch -= 1;
            return pitch;
        };
        
        // Key format: "c/4", "c#/4"
        const [keyName, targetOctave] = closestNote.key.split('/');
        let targetNote = keyName[0];
        let targetAcc = keyName.length > 1 ? keyName[1] : 'n';
        
        const correctPitch = getAbsolutePitch(targetNote, targetAcc, targetOctave);
        const selectedPitch = getAbsolutePitch(note, accidental, octave);
        
        if (correctPitch === selectedPitch) {
            closestNote.hit = true;
            state.songCombo++;
            els.songScore.textContent = `Combo: ${state.songCombo}`;
            
            // Visual feedback - color the note green
            closestNote.staveNote.setStyle({fillStyle: "#2ecc71", strokeStyle: "#2ecc71"});
            // Redraw
            const VF = Vex.Flow;
            const context = closestNote.staveNote.getContext();
            closestNote.staveNote.draw();
        } else {
            state.songCombo = 0;
            els.songScore.textContent = `Combo: ${state.songCombo}`;
            // Color red
            closestNote.staveNote.setStyle({fillStyle: "#e74c3c", strokeStyle: "#e74c3c"});
            const context = closestNote.staveNote.getContext();
            closestNote.staveNote.draw();
        }
    }
}
"""

js += song_funcs

with open('app.v26.js', 'w') as f:
    f.write(js)
