import re

with open('app.v32.js', 'r') as f:
    js = f.read()

# Wrap tick and drawTick in try-catch with alerts
old_tick = """    const tick = () => {
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
    };"""

new_tick = """    const tick = () => {
        try {
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
        } catch (e) {
            alert("Error in tick: " + e.message);
        }
    };"""

js = js.replace(old_tick, new_tick)

old_drawTick = """    const drawTick = () => {
        if (!state.songIsPlaying) return;"""

new_drawTick = """    const drawTick = () => {
        try {
        if (!state.songIsPlaying) return;"""

old_drawTick_end = """        
        requestAnimationFrame(drawTick);
    };"""

new_drawTick_end = """        
        requestAnimationFrame(drawTick);
        } catch(e) {
            alert("Error in drawTick: " + e.message);
        }
    };"""

js = js.replace(old_drawTick, new_drawTick)
js = js.replace(old_drawTick_end, new_drawTick_end)

with open('app.v32.js', 'w') as f:
    f.write(js)
