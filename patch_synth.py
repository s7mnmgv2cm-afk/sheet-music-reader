import re

with open('app.v25.js', 'r') as f:
    js = f.read()

old_synth = """    els.startBtn.addEventListener('click', async () => {
        // Initialize Audio Context on user gesture
        await Tone.start();
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        // Make it sound a bit like a piano
        synth.set({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        });
        
        els.startOverlay.classList.add('hidden');
        // The first note is already generated and rendered, just let them start answering
    });"""

new_synth = """    els.startBtn.addEventListener('click', async () => {
        els.startBtn.disabled = true;
        els.startBtn.textContent = '載入真實琴音中...';
        
        try {
            await Tone.start();
            synth = new Tone.Sampler({
                urls: {
                    "C3": "C3.mp3",
                    "C4": "C4.mp3",
                    "C5": "C5.mp3",
                    "C6": "C6.mp3"
                },
                release: 1,
                baseUrl: "https://tonejs.github.io/audio/salamander/"
            }).toDestination();
            
            await Tone.loaded();
            els.startOverlay.classList.add('hidden');
        } catch (e) {
            console.error(e);
            // Fallback to basic synth if network fails
            synth = new Tone.PolySynth(Tone.Synth).toDestination();
            synth.set({
                oscillator: { type: "triangle" },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
            });
            els.startOverlay.classList.add('hidden');
        }
    });"""

js = js.replace(old_synth, new_synth)

with open('app.v25.js', 'w') as f:
    f.write(js)

