import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Replace the entire renderSongMeasure and scheduleMeasure and startSong and handleSongHit functions
# We use regex to wipe out everything from `// --- Song Challenge Logic ---` to the end of the file.
js = js.split("// --- Song Challenge Logic ---")[0]

new_logic = """// --- Song Challenge Logic ---
function renderSong() {
    els.staffContainer.innerHTML = '';
    els.playbackCursor.classList.add('hidden');
    els.staffContainer.classList.add('song-mode');
    // Hide overflow and we will auto-scroll it
    els.staffContainer.style.overflowX = 'hidden'; 
    els.staffContainer.style.justifyContent = 'flex-start'; // Align left for scrolling

    const VF = Vex.Flow;
    const renderer = new VF.Renderer(els.staffContainer, VF.Renderer.Backends.SVG);
    
    const measureWidth = 250;
    const totalWidth = state.songData.measures.length * measureWidth + 50;
    renderer.resize(totalWidth, 180);
    const context = renderer.getContext();
    context.scale(1.5, 1.5);
    
    let currentX = 10;
    state.songNotesTimeline = []; 
    let currentTime = 0; 
    
    state.songData.measures.forEach((measure, mIdx) => {
        const stave = new VF.Stave(currentX, 10, measureWidth);
        if (mIdx === 0) stave.addClef(state.songData.clef);
        stave.setContext(context).draw();
        
        const notes = measure.map(nData => new VF.StaveNote({
            clef: state.songData.clef,
            keys: nData.keys,
            duration: nData.duration
        }));
        
        VF.Formatter.FormatAndDraw(context, stave, notes);
        
        notes.forEach((n, i) => {
            let durationBeats = 1;
            if (measure[i].duration === 'h') durationBeats = 2;
            if (measure[i].duration === 'w') durationBeats = 4;
            if (measure[i].duration === '8') durationBeats = 0.5;
            
            state.songNotesTimeline.push({
                x: n.getAbsoluteX(),
                key: measure[i].keys[0],
                timeInBeats: currentTime,
                durationBeats: durationBeats,
                hit: false,
                staveNote: n
            });
            currentTime += durationBeats;
        });
        
        currentX += measureWidth;
    });
    
    els.staffContainer.appendChild(els.playbackCursor);
    
    // Update piano octaves dynamically
    const baseOctave = state.songData.clef === 'bass' ? 2 : 4;
    const keys = document.querySelectorAll('.piano-key');
    let currentNoteIndex = 0;
    keys.forEach((keyEl) => {
        const isOctave2 = currentNoteIndex >= 12;
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
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear previous schedules
    Tone.Transport.position = 0;
    
    const bpm = parseInt(els.bpmInput.value) || 100;
    Tone.Transport.bpm.value = bpm;
    
    renderSong(); // Render full song
    
    let countIn = 4;
    els.playbackCursor.classList.add('hidden');
    els.staffContainer.scrollLeft = 0; // Reset scroll
    
    const tick = () => {
        if (!state.songIsPlaying) return;
        
        if (countIn > 0) {
            synth.triggerAttackRelease("C5", "32n"); 
            countIn--;
            if (countIn === 0) {
                Tone.Transport.start();
                scheduleSong();
            } else {
                setTimeout(tick, (60 / bpm) * 1000);
            }
        }
    };
    tick();
}

function scheduleSong() {
    els.playbackCursor.classList.remove('hidden');
    els.playbackCursor.style.transition = 'none'; // We animate manually
    
    const bpm = Tone.Transport.bpm.value;
    const bps = bpm / 60;
    
    // Schedule metronome click every beat
    const lastNote = state.songNotesTimeline[state.songNotesTimeline.length-1];
    const totalBeats = lastNote.timeInBeats + lastNote.durationBeats;
    for (let b = 0; b <= totalBeats; b++) {
        Tone.Transport.schedule((time) => {
            synth.triggerAttackRelease("G4", "32n", time, 0.05);
        }, b * (60/bpm));
    }
    
    const drawTick = () => {
        if (!state.songIsPlaying) return;
        
        const currentBeat = Tone.Transport.seconds * bps;
        
        let currentNote = state.songNotesTimeline[0];
        let nextNote = state.songNotesTimeline[1];
        
        for (let i = 0; i < state.songNotesTimeline.length; i++) {
            if (currentBeat >= state.songNotesTimeline[i].timeInBeats) {
                currentNote = state.songNotesTimeline[i];
                nextNote = state.songNotesTimeline[i+1];
            }
        }
        
        if (nextNote) {
            const beatProgress = (currentBeat - currentNote.timeInBeats) / (nextNote.timeInBeats - currentNote.timeInBeats);
            const startX = currentNote.x * 1.5 + 15;
            const endX = nextNote.x * 1.5 + 15;
            const currentX = startX + (endX - startX) * beatProgress;
            
            els.playbackCursor.style.left = `${currentX}px`;
            
            // Auto-scroll
            const scrollTarget = currentX - (els.staffContainer.clientWidth / 2);
            if (scrollTarget > 0) els.staffContainer.scrollLeft = scrollTarget;
            
        } else {
            // Last note
            if (currentBeat >= currentNote.timeInBeats + currentNote.durationBeats) {
                stopSong();
                return;
            }
            const beatProgress = (currentBeat - currentNote.timeInBeats) / currentNote.durationBeats;
            const startX = currentNote.x * 1.5 + 15;
            const currentX = startX + 50 * beatProgress;
            els.playbackCursor.style.left = `${currentX}px`;
        }
        
        requestAnimationFrame(drawTick);
    };
    
    requestAnimationFrame(drawTick);
}

function stopSong() {
    state.songIsPlaying = false;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    els.songPlayBtn.disabled = false;
    els.songStopBtn.disabled = true;
    els.playbackCursor.classList.add('hidden');
}

function handleSongHit(note, accidental, octave) {
    if (!state.songIsPlaying || state.songNotesTimeline.length === 0) return;
    
    const currentBeat = Tone.Transport.seconds * (Tone.Transport.bpm.value / 60);
    
    let closestNote = null;
    let minDiff = 9999;
    
    // Find note closest to current time
    for (let i = 0; i < state.songNotesTimeline.length; i++) {
        if (state.songNotesTimeline[i].hit) continue;
        const diff = Math.abs(currentBeat - state.songNotesTimeline[i].timeInBeats);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = state.songNotesTimeline[i];
        }
    }
    
    // Allow a tolerance of 0.4 beats
    if (closestNote && minDiff < 0.4) {
        const getAbsolutePitch = (n, acc, oct) => {
            const basePitches = { 'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11 };
            let pitch = basePitches[n.toLowerCase()] + (parseInt(oct) * 12);
            if (acc === '#') pitch += 1;
            if (acc === 'b') pitch -= 1;
            return pitch;
        };
        
        const [keyName, targetOctave] = closestNote.key.split('/');
        let targetNote = keyName[0];
        let targetAcc = keyName.length > 1 ? keyName[1] : 'n';
        
        const correctPitch = getAbsolutePitch(targetNote, targetAcc, targetOctave);
        const selectedPitch = getAbsolutePitch(note, accidental, octave);
        
        if (correctPitch === selectedPitch) {
            closestNote.hit = true;
            state.songCombo++;
            els.songScore.textContent = `Combo: ${state.songCombo}`;
            
            closestNote.staveNote.setStyle({fillStyle: "#2ecc71", strokeStyle: "#2ecc71"});
            closestNote.staveNote.draw();
        } else {
            state.songCombo = 0;
            els.songScore.textContent = `Combo: ${state.songCombo}`;
            closestNote.staveNote.setStyle({fillStyle: "#e74c3c", strokeStyle: "#e74c3c"});
            closestNote.staveNote.draw();
        }
    }
}
"""

js += new_logic

# Also replace `renderSongMeasure(0)` with `renderSong()` in the mode switch
js = js.replace("renderSongMeasure(0);", "renderSong();")

with open('app.v26.js', 'w') as f:
    f.write(js)
