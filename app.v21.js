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
            state.selectedAnswer.note = keyEl.dataset.note;
            state.selectedAnswer.accidental = keyEl.dataset.accidental;
            
            // Update UI
            els.pianoKeys.forEach(b => b.classList.remove('selected'));
            keyEl.classList.add('selected');
            // Play the corresponding tone
            if (synth) {
                // Construct the note name for Tone.js (e.g., C5, C#5)
                let toneAccidental = state.selectedAnswer.accidental === 'n' ? '' : state.selectedAnswer.accidental;
                // Play it in octave 5 for brighter feedback
                synth.triggerAttackRelease(`${state.selectedAnswer.note}${toneAccidental}5`, "8n");
            }
            
            // Auto-advance check
            checkAnswer();
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
    
    // Determine clef
    let clef = clefSetting;
    if (clef === 'both') {
        clef = Math.random() > 0.5 ? 'treble' : 'bass';
    }

    // Determine note and octave based on clef
    let noteList, octaveRange;
    if (clef === 'treble') {
        // C4 to G5
        noteList = NOTES;
        octaveRange = [4, 5];
    } else {
        // C2 to G3
        noteList = NOTES;
        octaveRange = [2, 3];
    }

    const length = state.questionLength === 'measure' ? 4 : 1;
    state.notes = [];
    state.activeIndex = 0;
    
    for (let i = 0; i < length; i++) {
        const note = noteList[Math.floor(Math.random() * noteList.length)];
        let octave = octaveRange[Math.floor(Math.random() * octaveRange.length)];
        
        // Slight tweak: prevent very high/low extreme ledger lines for beginners
        if (clef === 'treble' && note === 'A' && octave === 5) octave = 4;
        if (clef === 'treble' && note === 'B' && octave === 5) octave = 4;
        
        // Determine accidental
        let accidental = 'n';
        if (useAccidentals) {
            const rand = Math.random();
            if (rand < 0.25) accidental = 'b';
            else if (rand < 0.5) accidental = '#';
        }
        
        state.notes.push({ key: note, accidental, octave, clef });
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
    const clef = state.notes.length > 0 ? state.notes[0].clef : 'treble';
    stave.addClef(clef);
    
    // Connect it to the rendering context and draw
    stave.setContext(context).draw();

    if (state.notes.length > 0) {
        let vfNotes = [];
        
        state.notes.forEach((noteData, index) => {
            const keyName = `${noteData.key.toLowerCase()}/${noteData.octave}`;
            const accidental = noteData.accidental;
            
            const vfAccidental = accidental === 'n' ? 'n' : accidental;
            
            let staveNote = new VF.StaveNote({
                clef: noteData.clef,
                keys: [keyName],
                duration: "q"
            });

            if (accidental !== 'n') {
                 staveNote.addAccidental(0, new VF.Accidental(vfAccidental));
            }
            
            // Highlight active and passed notes
            if (index === state.activeIndex) {
                staveNote.setStyle({fillStyle: "#3b82f6", strokeStyle: "#3b82f6"}); // Blue for active
            } else if (index < state.activeIndex) {
                staveNote.setStyle({fillStyle: "#10b981", strokeStyle: "#10b981"}); // Green for passed
            }

            vfNotes.push(staveNote);
        });

        const voice = new VF.Voice({num_beats: state.notes.length, beat_value: 4});
        voice.addTickables(vfNotes);
        
        const formatWidth = state.questionLength === 'measure' ? 130 : 80;
        new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
        
        // Render voice
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
    els.pianoKeys.forEach(b => b.classList.remove('selected'));
    
    // Also reset guitar frets
    const frets = document.querySelectorAll('.guitar-fret');
    frets.forEach(f => f.classList.remove('selected'));
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
            state.selectedAnswer.note = el.dataset.note;
            state.selectedAnswer.accidental = el.dataset.accidental;
            
            // Update UI
            document.querySelectorAll('.guitar-fret').forEach(f => f.classList.remove('selected'));
            els.pianoKeys.forEach(p => p.classList.remove('selected'));
            el.classList.add('selected');
            els.submitBtn.disabled = false;
            
            // Play sound with correct guitar octave!
            if (synth) {
                let acc = el.dataset.accidental === 'n' ? '' : el.dataset.accidental;
                synth.triggerAttackRelease(`${el.dataset.note}${acc}${el.dataset.octave}`, "8n");
            }
            
            // Auto-advance check
            checkAnswer();
        });
    });
}

function showFloatingPraise() {
    const text = 'O';
    
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    
    // Position it randomly near the top center of the staff container
    const staffRect = els.staffContainer.getBoundingClientRect();
    const x = staffRect.left + staffRect.width / 2 + (Math.random() * 80 - 40);
    const y = staffRect.top + 50 + (Math.random() * 20 - 10);
    
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
    
    const activeNote = state.notes[state.activeIndex];
    const correctPitch = getPitchClass(activeNote.key, activeNote.accidental);
    const selectedPitch = getPitchClass(state.selectedAnswer.note, state.selectedAnswer.accidental);
    const isCorrect = correctPitch === selectedPitch;
    
    // Helper to format note names for history (e.g. C#, Db)
    const formatNote = (note, acc) => {
        let symbol = '';
        if (acc === '#') symbol = '♯';
        if (acc === 'b') symbol = '♭';
        return `${note}${symbol}`;
    };

    const correctNoteString = formatNote(activeNote.key, activeNote.accidental);
    const userNoteString = formatNote(state.selectedAnswer.note, state.selectedAnswer.accidental);

    // Add to history
    state.history.unshift({
        isCorrect,
        clef: activeNote.clef === 'treble' ? '高音譜' : '低音譜',
        correctNote: correctNoteString,
        userNote: userNoteString,
        rawNote: { ...activeNote } // Save the exact note to re-render
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
            renderStaff(); // Render the last green note
            setTimeout(() => {
                generateNextQuestion();
            }, 300); // small delay to see the last green note
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
            }, 1500); // Wait for feedback overlay to fade
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

    // Render details text
    if (item.isCorrect) {
        els.historyReviewDetails.innerHTML = `<span style="color: var(--success-color);">✅ 答對了 (答案: ${item.correctNote})</span>`;
    } else {
        els.historyReviewDetails.innerHTML = `<span style="color: var(--danger-color);">❌ 答錯了</span><br><span style="font-weight: normal; font-size: 1rem;">正確答案: <b>${item.correctNote}</b> / 你的回答: <span style="text-decoration: line-through;">${item.userNote}</span></span>`;
    }

    // Render VexFlow Staff
    els.historyReviewStaff.innerHTML = '';
    const VF = Vex.Flow;
    const renderer = new VF.Renderer(els.historyReviewStaff, VF.Renderer.Backends.SVG);
    renderer.resize(200, 160);
    const context = renderer.getContext();
    const stave = new VF.Stave(25, 40, 150);
    stave.addClef(item.rawNote.clef).setContext(context).draw();

    // Create the note
    const staveNote = new VF.StaveNote({
        clef: item.rawNote.clef,
        keys: [`${item.rawNote.key}/${item.rawNote.octave}`],
        duration: "q"
    });

    if (item.rawNote.accidental !== 'n') {
        staveNote.addAccidental(0, new VF.Accidental(item.rawNote.accidental));
    }

    const voice = new VF.Voice({ num_beats: 1, beat_value: 4 });
    voice.addTickables([staveNote]);
    new VF.Formatter().joinVoices([voice]).format([voice], 80);
    voice.draw(context, stave);

    // Show modal
    els.historyReviewOverlay.classList.remove('hidden');
}

function generateNextQuestion() {
    generateQuestion();
    renderStaff();
    resetSelection();
}

// Boot
window.addEventListener('DOMContentLoaded', init);
