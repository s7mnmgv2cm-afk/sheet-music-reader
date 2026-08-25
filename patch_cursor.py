import re

with open('app.v26.js', 'r') as f:
    js = f.read()

# Modify scheduleMeasure to use smooth sliding
old_schedule = """function scheduleMeasure() {
    els.playbackCursor.classList.remove('hidden');
    
    const bpm = Tone.Transport.bpm.value;
    const beatDuration = 60 / bpm;
    
    const startX = state.songNotesInMeasure[0].x * 1.5; // match native scale
    els.playbackCursor.style.left = `${startX}px`;
    
    let noteIndex = 0;
    
    songEventId = Tone.Transport.scheduleRepeat((time) => {
        if (!state.songIsPlaying) return;
        
        synth.triggerAttackRelease("G4", "32n", time, 0.1); // subtle click
        
        if (noteIndex < state.songNotesInMeasure.length) {
            const targetX = state.songNotesInMeasure[noteIndex].x * 1.5;
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
}"""

new_schedule = """function scheduleMeasure() {
    els.playbackCursor.classList.remove('hidden');
    
    const bpm = Tone.Transport.bpm.value;
    const beatDuration = 60 / bpm;
    
    // Set transition duration to match the beat duration precisely
    els.playbackCursor.style.transition = `left ${beatDuration}s linear`;
    
    // Initial position on the first note
    const startX = state.songNotesInMeasure[0].x * 1.5 + 15; 
    els.playbackCursor.style.left = `${startX}px`;
    
    let noteIndex = 0; // We are at note 0
    
    songEventId = Tone.Transport.scheduleRepeat((time) => {
        if (!state.songIsPlaying) return;
        
        synth.triggerAttackRelease("G4", "32n", time, 0.1); // Metronome click
        
        // At this exact moment, we want to start gliding towards the NEXT note
        Tone.Draw.schedule(() => {
            if (noteIndex + 1 < state.songNotesInMeasure.length) {
                const targetX = state.songNotesInMeasure[noteIndex + 1].x * 1.5 + 15;
                els.playbackCursor.style.left = `${targetX}px`;
            } else {
                // Glide off-screen or to the end of the stave
                const endX = startX + 250;
                els.playbackCursor.style.left = `${endX}px`;
            }
            noteIndex++;
            
            if (noteIndex > state.songNotesInMeasure.length) {
                Tone.Transport.clear(songEventId);
                // Temporarily disable transition for the instant reset
                els.playbackCursor.style.transition = 'none';
                if (state.songIsPlaying) {
                    renderSongMeasure(state.songCurrentMeasure + 1);
                    if (state.songCurrentMeasure < state.songData.measures.length) {
                        scheduleMeasure();
                    }
                }
            }
        }, time);
        
    }, "4n");
}"""

js = js.replace(old_schedule, new_schedule)

with open('app.v26.js', 'w') as f:
    f.write(js)

with open('style.css', 'r') as f:
    css = f.read()

# Remove the hardcoded transition from CSS so JS can control it fully
css = css.replace("transition: left 0.1s linear; /* Smooth movement between ticks */", "/* Transition handled by JS */")
with open('style.css', 'w') as f:
    f.write(css)

