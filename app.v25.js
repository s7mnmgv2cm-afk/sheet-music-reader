// Constants
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTALS = ['bb', 'b', 'n', '#', '##'];
// For our simple app, we'll limit to single flat/sharp/natural
const SIMPLE_ACCIDENTALS = ['b', 'n', '#'];

window.onerror = function(msg, url, line, col, error) {
    const errDiv = document.createElement('div');
    errDiv.style.position = 'fixed';
    errDiv.style.top = '0';
    errDiv.style.left = '0';
    errDiv.style.background = 'red';
    errDiv.style.color = 'white';
    errDiv.style.zIndex = '9999';
    errDiv.style.padding = '10px';
    errDiv.innerHTML = `Error: ${msg} <br> Line: ${line} <br> ${error ? error.stack : ''}`;
    document.body.appendChild(errDiv);
};

// State
let state = {
    score: {
        correct: 0,
        incorrect: 0
    },
    notes: [], // Array of { key, accidental, octave, clef }
    activeIndex: 0,
    questionLength: 'single', // 'single' or 'measure'
    appMode: 'practice', // 'practice' or 'play'
    questionType: 'single', // 'single' or 'chord'
    currentChordInput: [], // Array of pitches selected for current chord
    selectedAnswer: {
        note: null,
        accidental: 'n'
    },
    history: [],
    isPlaying: false
};

// Tone.js Synth
let synth = null;

// DOM Elements
const els = {
    startOverlay: document.getElementById('start-overlay'),
    startBtn: document.getElementById('start-app-btn'),
    staffContainer: document.getElementById('staff-container'),
    clefSelect: document.getElementById('clef-select'),
    accidentalsCheckbox: document.getElementById('accidentals-checkbox'),
    lengthSelect: document.getElementById('length-select'),
    typeSelect: document.getElementById('type-select'),
    appModeSelect: document.getElementById('app-mode-select'),
    staffCard: document.querySelector('.staff-card'),
    instruction: document.querySelector('.instruction'),
    historyArea: document.getElementById('history-area'),
    pianoWrapper: document.getElementById('piano-wrapper'),
    pianoKeys: document.querySelectorAll('.piano-key'),
    scoreCorrect: document.getElementById('score-correct'),
    scoreIncorrect: document.getElementById('score-incorrect'),
    feedbackOverlay: document.getElementById('feedback-overlay'),
    feedbackText: document.getElementById('feedback-text'),
    cheatSheetBtn: document.getElementById('cheat-sheet-btn'),
    cheatSheetOverlay: document.getElementById('cheat-sheet-overlay'),
    closeCheatSheetBtn: document.getElementById('close-cheat-sheet-btn'),
    cheatSheetClef: document.getElementById('cheat-sheet-clef'),
    cheatSheetAccidental: document.getElementById('cheat-sheet-accidental'),
    cheatSheetStaff: document.getElementById('cheat-sheet-staff'),
    historyList: document.getElementById('history-list'),
    historyReviewOverlay: document.getElementById('history-review-overlay'),
    closeHistoryReviewBtn: document.getElementById('close-history-review-btn'),
    historyReviewStaff: document.getElementById('history-review-staff'),
    historyReviewDetails: document.getElementById('history-review-details'),
    
    // New controls for Guitar
    inputModeSelect: document.getElementById('input-mode-select'),
    showNotesContainer: document.getElementById('show-notes-container'),
    showNotesCheckbox: document.getElementById('show-notes-checkbox'),
    guitarWrapper: document.getElementById('guitar-wrapper'),
    guitarFretboard: document.getElementById('guitar-fretboard'),
    pianoKeyboard: document.querySelector('.piano-keyboard')
};

// Initialize App
function init() {
    setupEventListeners();
    generateGuitarFretboard();
    // Generate and render initial note behind the overlay
    state.questionLength = els.lengthSelect.value;
    generateQuestion();
    renderStaff();
}

function setupEventListeners() {
    els.startBtn.addEventListener('click', async () => {
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
    });

    els.clefSelect.addEventListener('change', generateNextQuestion);
    els.accidentalsCheckbox.addEventListener('change', generateNextQuestion);
    
    els.lengthSelect.addEventListener('change', (e) => {
        state.questionLength = e.target.value;
        generateNextQuestion();
    });

        els.appModeSelect.addEventListener('change', (e) => {
        state.appMode = e.target.value;
        if (state.appMode === 'play') {
            els.staffCard.style.display = 'none';
            els.instruction.style.display = 'none';
            els.historyArea.style.display = 'none';
            els.pianoWrapper.style.maxWidth = '100%';
        } else {
            els.staffCard.style.display = 'flex';
            els.instruction.style.display = 'block';
            els.historyArea.style.display = 'block';
            els.pianoWrapper.style.maxWidth = '900px';
        }
        resetSelection();
    });

    els.typeSelect.addEventListener('change', (e) => {
        state.questionType = e.target.value;
        generateNextQuestion();
    });

    // Input mode toggle
    els.inputModeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (mode === 'piano') {
            els.pianoKeyboard.classList.remove('hidden');
            els.guitarWrapper.classList.add('hidden');
        } else {
            els.pianoKeyboard.classList.add('hidden');
            els.guitarWrapper.classList.remove('hidden');
        }
        resetSelection();
    });

    // Show/Hide notes toggle
    els.showNotesCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.remove('hide-notes');
        } else {
            document.body.classList.add('hide-notes');
        }
    });

    // Piano Interaction events
    els.pianoKeys.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const keyEl = e.currentTarget;
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
            
            if (state.questionType === 'chord') {
                if (keyEl.classList.contains('selected')) {
                    keyEl.classList.remove('selected');
                    state.currentChordInput = state.currentChordInput.filter(n => !(n.note === note && n.accidental === accidental));
                } else {
                    keyEl.classList.add('selected');
                    state.currentChordInput.push({ note, accidental });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;
                els.pianoKeys.forEach(b => b.classList.remove('selected'));
                keyEl.classList.add('selected');
                checkAnswer();
            }
        });
    });

    // Cheat Sheet Events
    els.cheatSheetBtn.addEventListener('click', () => {
        els.cheatSheetOverlay.classList.remove('hidden');
        renderCheatSheet();
    });

    els.closeCheatSheetBtn.addEventListener('click', () => {
        els.cheatSheetOverlay.classList.add('hidden');
    });

    els.cheatSheetClef.addEventListener('change', renderCheatSheet);
    els.cheatSheetAccidental.addEventListener('change', renderCheatSheet);

    // History Review Events
    els.historyList.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.history-item');
        if (!itemEl) return;
        const index = parseInt(itemEl.dataset.index, 10);
        openHistoryReview(index);
    });

    els.closeHistoryReviewBtn.addEventListener('click', () => {
        els.historyReviewOverlay.classList.add('hidden');
    });
}

function renderCheatSheet() {
    els.cheatSheetStaff.innerHTML = '';
    const clef = els.cheatSheetClef.value;
    const accidental = els.cheatSheetAccidental.value;
    const VF = Vex.Flow;
    
    // Create an SVG renderer and attach it to the DIV element
    const renderer = new VF.Renderer(els.cheatSheetStaff, VF.Renderer.Backends.SVG);
    renderer.resize(600, 180);
    const context = renderer.getContext();
    
    // Scale up natively so notes are large
    context.scale(1.2, 1.2);
    
    // Create a stave
    const stave = new VF.Stave(10, 20, 480);
    stave.addClef(clef).setContext(context).draw();

    let notesData = [];
    if (clef === 'treble') {
        notesData = [
            { key: "c/4", text: "C (Do)" },
            { key: "d/4", text: "D (Re)" },
            { key: "e/4", text: "E (Mi)" },
            { key: "f/4", text: "F (Fa)" },
            { key: "g/4", text: "G (Sol)" },
            { key: "a/4", text: "A (La)" },
            { key: "b/4", text: "B (Si)" },
            { key: "c/5", text: "C" }
        ];
    } else {
        notesData = [
            { key: "c/3", text: "C (Do)" },
            { key: "d/3", text: "D (Re)" },
            { key: "e/3", text: "E (Mi)" },
            { key: "f/3", text: "F (Fa)" },
            { key: "g/3", text: "G (Sol)" },
            { key: "a/3", text: "A (La)" },
            { key: "b/3", text: "B (Si)" },
            { key: "c/4", text: "C" }
        ];
    }

    const notes = notesData.map(data => {
        const note = new VF.StaveNote({ clef: clef, keys: [data.key], duration: "q" });
        
        // Add accidental to note and text if selected
        let displayText = data.text;
        if (accidental !== 'n') {
            note.addAccidental(0, new VF.Accidental(accidental));
            // Add symbol to text
            const symbol = accidental === '#' ? '♯' : '♭';
            // Insert symbol after the letter, e.g., "C (Do)" -> "C♯ (Do)"
            displayText = displayText.replace(' ', symbol + ' ');
        }
        
        // Add text annotation below the note
        const annotation = new VF.Annotation(displayText)
            .setFont("Inter", 10, "normal")
            .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
        note.addModifier(0, annotation);
        return note;
    });

    const voice = new VF.Voice({ num_beats: notes.length, beat_value: 4 });
    voice.addTickables(notes);
    
    const formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
    voice.draw(context, stave);
}

function generateQuestion() {
    const clefSetting = els.clefSelect.value;
    const useAccidentals = els.accidentalsCheckbox.checked;
    
    let clef = clefSetting;
    if (clef === 'both') {
        clef = Math.random() > 0.5 ? 'treble' : 'bass';
    }

    let noteList, octaveRange;
    if (clef === 'treble') {
        noteList = NOTES;
        octaveRange = [4, 5];
    } else {
        noteList = NOTES;
        octaveRange = [2, 3];
    }

    const length = state.questionLength === 'measure' ? 4 : 1;
    const isChord = state.questionType === 'chord';
    state.notes = [];
    state.activeIndex = 0;
    
    for (let i = 0; i < length; i++) {
        if (isChord) {
            const rootIndex = Math.floor(Math.random() * noteList.length);
            const rootNote = noteList[rootIndex];
            let rootOctave = octaveRange[Math.floor(Math.random() * octaveRange.length)];
            
            if (clef === 'treble' && rootOctave === 5) rootOctave = 4;
            
            const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            const rIdx = noteNames.indexOf(rootNote);
            
            const n1 = rootNote;
            const o1 = rootOctave;
            
            const n2 = noteNames[(rIdx + 2) % 7];
            const o2 = (rIdx + 2 < rIdx) ? rootOctave + 1 : rootOctave;
            
            const n3 = noteNames[(rIdx + 4) % 7];
            const o3 = (rIdx + 4 < rIdx) ? rootOctave + 1 : rootOctave;
            
            let acc1 = 'n', acc2 = 'n', acc3 = 'n';
            if (useAccidentals) {
                 const rand = Math.random();
                 if (rand < 0.3) { acc1 = '#'; }
                 else if (rand < 0.6) { acc2 = 'b'; }
            }
            
            state.notes.push([
                { key: n1, accidental: acc1, octave: o1, clef },
                { key: n2, accidental: acc2, octave: o2, clef },
                { key: n3, accidental: acc3, octave: o3, clef }
            ]);
        } else {
            const note = noteList[Math.floor(Math.random() * noteList.length)];
            let octave = octaveRange[Math.floor(Math.random() * octaveRange.length)];
            
            if (clef === 'treble' && note === 'A' && octave === 5) octave = 4;
            if (clef === 'treble' && note === 'B' && octave === 5) octave = 4;
            
            let accidental = 'n';
            if (useAccidentals) {
                const rand = Math.random();
                if (rand < 0.25) accidental = 'b';
                else if (rand < 0.5) accidental = '#';
            }
            
            state.notes.push([{ key: note, accidental, octave, clef }]);
        }
    }
}

function renderStaff() {
    els.staffContainer.innerHTML = '';
    
    // Toggle measure mode class for scaling
    if (state.questionLength === 'measure') {
        els.staffContainer.classList.add('measure-mode');
    } else {
        els.staffContainer.classList.remove('measure-mode');
    }
    
    const VF = Vex.Flow;
    
    // Create an SVG renderer and attach it to the DIV element
    const renderer = new VF.Renderer(els.staffContainer, VF.Renderer.Backends.SVG);
    
    const width = state.questionLength === 'measure' ? 220 : 200;
    renderer.resize(width, 160);
    
    const context = renderer.getContext();
    
    const staveWidth = state.questionLength === 'measure' ? 190 : 150;
    const stave = new VF.Stave(15, 40, staveWidth);
    
    // Add a clef (use the clef of the first note)
    const clef = state.notes.length > 0 ? state.notes[0][0].clef : 'treble';
    stave.addClef(clef);
    
    // Connect it to the rendering context and draw
    stave.setContext(context).draw();

    if (state.notes.length > 0) {
        let vfNotes = [];
        
        state.notes.forEach((item, index) => {
            const keys = item.map(n => `${n.key.toLowerCase()}/${n.octave}`);
            const clef = item[0].clef;
            
            let staveNote = new VF.StaveNote({
                clef: clef,
                keys: keys,
                duration: "q"
            });

            item.forEach((n, i) => {
                if (n.accidental !== 'n') {
                     staveNote.addAccidental(i, new VF.Accidental(n.accidental));
                }
            });

            if (index === state.activeIndex) {
                staveNote.setStyle({ fillStyle: "var(--primary-color)", strokeStyle: "var(--primary-color)" });
            } else if (index < state.activeIndex) {
                staveNote.setStyle({ fillStyle: "var(--success-color)", strokeStyle: "var(--success-color)" });
            }
            
            vfNotes.push(staveNote);
        });

        const voice = new VF.Voice({ num_beats: state.notes.length, beat_value: 4 });
        voice.addTickables(vfNotes);
        
        const formatWidth = state.questionLength === 'measure' ? 130 : 80;
        new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
        
        voice.draw(context, stave);
    }
}

function playNote(noteKey, accidental, octave) {
    if (!synth) return;
    
    // Convert accidental format
    let toneAccidental = '';
    if (accidental === '#') toneAccidental = '#';
    if (accidental === 'b') toneAccidental = 'b';
    
    const noteString = `${noteKey}${toneAccidental}${octave}`;
    synth.triggerAttackRelease(noteString, "8n");
}

function showFeedback(isCorrect, correctNoteString) {
    els.feedbackOverlay.className = 'feedback-overlay show';
    els.feedbackText.style.color = isCorrect ? 'var(--success-color)' : 'var(--danger-color)';
    
    if (isCorrect) {
        els.feedbackText.textContent = '✓ 答對了！';
        els.feedbackText.style.fontSize = '3rem';
    } else {
        els.feedbackText.innerHTML = `✗ 答錯了<br><small style="font-size: 1.5rem; color: #333;">正確是: ${correctNoteString}</small>`;
        els.feedbackText.style.fontSize = '2.5rem';
        els.feedbackText.style.textAlign = 'center';
    }
    
    setTimeout(() => {
        els.feedbackOverlay.classList.remove('show');
    }, 1200);
}

function updateScore() {
    els.scoreCorrect.textContent = state.score.correct;
    els.scoreIncorrect.textContent = state.score.incorrect;
}

function resetSelection() {
    state.selectedAnswer.note = null;
    state.selectedAnswer.accidental = 'n';
    state.currentChordInput = [];
    els.pianoKeys.forEach(k => k.classList.remove('selected'));
    document.querySelectorAll('.guitar-fret').forEach(f => f.classList.remove('selected'));
}

// === GUITAR LOGIC ===
function generateGuitarFretboard() {
    // Standard tuning: 1st string (High E) to 6th string (Low E)
    const strings = [
        { openNote: 'E', openAcc: 'n', openOctave: 4 }, // 1st
        { openNote: 'B', openAcc: 'n', openOctave: 3 }, // 2nd
        { openNote: 'G', openAcc: 'n', openOctave: 3 }, // 3rd
        { openNote: 'D', openAcc: 'n', openOctave: 3 }, // 4th
        { openNote: 'A', openAcc: 'n', openOctave: 2 }, // 5th
        { openNote: 'E', openAcc: 'n', openOctave: 2 }  // 6th
    ];

    const markers = [3, 5, 7, 9, 12];
    
    let html = '';
    
    strings.forEach((str, stringIndex) => {
        html += `<div class="guitar-string">`;
        
        let currentPitch = getPitchClass(str.openNote, str.openAcc);
        let currentOctave = str.openOctave;
        
        for (let fret = 0; fret <= 12; fret++) {
            // Calculate note name
            const noteObj = getNoteNameFromPitch(currentPitch);
            const isMarker = markers.includes(fret) && stringIndex === 2; // Put marker visually on the 3rd string area
            
            html += `
                <div class="guitar-fret ${fret === 0 ? 'open-string' : ''}" 
                     data-note="${noteObj.note}" 
                     data-accidental="${noteObj.acc}" 
                     data-octave="${currentOctave}">
                    ${isMarker ? `<div class="fret-marker"></div>` : ''}
                    <div class="fret-note-label">${noteObj.note}${noteObj.acc === '#' ? '♯' : ''}</div>
                </div>
            `;
            
            // Advance pitch for next fret
            currentPitch++;
            if (currentPitch > 11) {
                currentPitch = 0;
            }
            // Increment octave if we cross from B to C
            if (currentPitch === 0) {
                currentOctave++;
            }
        }
        html += `</div>`;
    });
    
    els.guitarFretboard.innerHTML = html;

    // Attach click listeners to new frets
    document.querySelectorAll('.guitar-fret').forEach(fretEl => {
        fretEl.addEventListener('click', (e) => {
            const el = e.currentTarget;
            const note = el.dataset.note;
            const accidental = el.dataset.accidental;
            const octave = el.dataset.octave;
            
            let toneAccidental = accidental === 'n' ? '' : accidental;
            if (synth) synth.triggerAttackRelease(`${note}${toneAccidental}${octave}`, "8n");
            
            if (state.appMode === 'play') {
                el.classList.add('selected');
                setTimeout(() => el.classList.remove('selected'), 150);
                return;
            }
            
            if (state.questionType === 'chord') {
                if (el.classList.contains('selected')) {
                    el.classList.remove('selected');
                    state.currentChordInput = state.currentChordInput.filter(n => !(n.note === note && n.accidental === accidental));
                } else {
                    el.classList.add('selected');
                    state.currentChordInput.push({ note, accidental });
                }
                checkAnswer();
            } else {
                state.selectedAnswer.note = note;
                state.selectedAnswer.accidental = accidental;
                document.querySelectorAll('.guitar-fret').forEach(f => f.classList.remove('selected'));
                els.pianoKeys.forEach(p => p.classList.remove('selected'));
                el.classList.add('selected');
                checkAnswer();
            }
        });
    });
}

function showFloatingPraise() {
    const text = 'O 答對了';
    
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    
    // Position it perfectly centered over the staff container
    const staffRect = els.staffContainer.getBoundingClientRect();
    const x = staffRect.left + staffRect.width / 2;
    const y = staffRect.top + 30;
    
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    document.body.appendChild(el);
    
    // Remove after animation completes
    setTimeout(() => {
        el.remove();
    }, 1000);
}

function getNoteNameFromPitch(pitchClass) {
    // 0:C, 1:C#, 2:D, 3:D#, 4:E, 5:F, 6:F#, 7:G, 8:G#, 9:A, 10:A#, 11:B
    const map = [
        { note: 'C', acc: 'n' },
        { note: 'C', acc: '#' },
        { note: 'D', acc: 'n' },
        { note: 'D', acc: '#' },
        { note: 'E', acc: 'n' },
        { note: 'F', acc: 'n' },
        { note: 'F', acc: '#' },
        { note: 'G', acc: 'n' },
        { note: 'G', acc: '#' },
        { note: 'A', acc: 'n' },
        { note: 'A', acc: '#' },
        { note: 'B', acc: 'n' }
    ];
    return map[pitchClass];
}

function getPitchClass(note, accidental) {
    const basePitches = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    let pitch = basePitches[note];
    if (accidental === '#') pitch += 1;
    if (accidental === 'b') pitch -= 1;
    if (pitch < 0) pitch += 12;
    if (pitch > 11) pitch -= 12;
    return pitch;
}

function checkAnswer() {
    if (state.activeIndex >= state.notes.length) return;
    
    const activeItem = state.notes[state.activeIndex];
    const isChord = state.questionType === 'chord';
    
    let isCorrect = false;
    let formatNote = (n, a) => {
        let sym = ''; if (a === '#') sym = '♯'; if (a === 'b') sym = '♭';
        return `${n}${sym}`;
    };
    
    let correctNoteString = activeItem.map(n => formatNote(n.key, n.accidental)).join(' ');
    let userNoteString = '';
    
    if (isChord) {
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
    }

    state.history.unshift({
        isCorrect,
        clef: activeItem[0].clef === 'treble' ? '高音譜' : '低音譜',
        correctNote: correctNoteString,
        userNote: userNoteString,
        rawNotes: activeItem 
    });

    if (state.history.length > 50) state.history.pop();
    
    renderHistory();
    
    if (isCorrect) {
        state.score.correct++;
        updateScore();
        showFloatingPraise();
        
        state.activeIndex++;
        if (state.activeIndex >= state.notes.length) {
            resetSelection();
            renderStaff();
            setTimeout(() => {
                generateNextQuestion();
            }, 300);
        } else {
            resetSelection();
            renderStaff();
        }
    } else {
        state.score.incorrect++;
        updateScore();
        showFeedback(false, correctNoteString);
        
        state.activeIndex++;
        if (state.activeIndex >= state.notes.length) {
            resetSelection();
            renderStaff();
            setTimeout(() => {
                generateNextQuestion();
            }, 1500);
        } else {
            resetSelection();
            renderStaff();
        }
    }
}

function renderHistory() {
    els.historyList.innerHTML = '';
    
    if (state.history.length === 0) {
        els.historyList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 1rem;">尚無紀錄</div>';
        return;
    }

    state.history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `history-item ${item.isCorrect ? 'correct' : 'incorrect'}`;
        div.dataset.index = index;
        
        let contentHtml = `
            <div class="icon">${item.isCorrect ? '✅' : '❌'}</div>
            <div class="clef-info">${item.clef}</div>
            <div class="result-text">
                <span class="correct-note">答案: ${item.correctNote}</span>
        `;
        
        if (!item.isCorrect) {
            contentHtml += `<span class="user-note">你的回答: ${item.userNote}</span>`;
        }
        
        contentHtml += `</div>`;
        div.innerHTML = contentHtml;
        els.historyList.appendChild(div);
    });
}

function openHistoryReview(index) {
    const item = state.history[index];
    if (!item) return;

    if (item.isCorrect) {
        els.historyReviewDetails.innerHTML = `<span style="color: var(--success-color);">✅ 答對了 (答案: ${item.correctNote})</span>`;
    } else {
        els.historyReviewDetails.innerHTML = `<span style="color: var(--danger-color);">❌ 答錯了</span><br><span style="font-weight: normal; font-size: 1rem;">正確答案: <b>${item.correctNote}</b> / 你的回答: <span style="text-decoration: line-through;">${item.userNote}</span></span>`;
    }

    els.historyReviewStaff.innerHTML = '';
    const VF = Vex.Flow;
    const renderer = new VF.Renderer(els.historyReviewStaff, VF.Renderer.Backends.SVG);
    renderer.resize(200, 160);
    const context = renderer.getContext();
    const stave = new VF.Stave(25, 40, 150);
    stave.addClef(item.rawNotes[0].clef).setContext(context).draw();

    const keys = item.rawNotes.map(n => `${n.key.toLowerCase()}/${n.octave}`);
    const staveNote = new VF.StaveNote({
        clef: item.rawNotes[0].clef,
        keys: keys,
        duration: "q"
    });

    item.rawNotes.forEach((n, i) => {
        if (n.accidental !== 'n') {
            staveNote.addAccidental(i, new VF.Accidental(n.accidental));
        }
    });

    const voice = new VF.Voice({ num_beats: 1, beat_value: 4 });
    voice.addTickables([staveNote]);
    new VF.Formatter().joinVoices([voice]).format([voice], 80);
    voice.draw(context, stave);

    els.historyReviewOverlay.classList.remove('hidden');
}

function generateNextQuestion() {
    generateQuestion();
    renderStaff();
    resetSelection();
}

// Boot
window.addEventListener('DOMContentLoaded', init);
