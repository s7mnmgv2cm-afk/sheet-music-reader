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
    currentNote: {
        key: 'C',
        accidental: 'n',
        octave: 4,
        clef: 'treble' // 'treble' or 'bass'
    },
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
    pianoKeys: document.querySelectorAll('.piano-key'),
    submitBtn: document.getElementById('submit-btn'),
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
    historyReviewDetails: document.getElementById('history-review-details')
};

// Initialize App
function init() {
    setupEventListeners();
    // Generate and render initial note behind the overlay
    generateRandomNote();
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

    // Interaction events
    els.pianoKeys.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const keyEl = e.currentTarget;
            state.selectedAnswer.note = keyEl.dataset.note;
            state.selectedAnswer.accidental = keyEl.dataset.accidental;
            
            // Update UI
            els.pianoKeys.forEach(b => b.classList.remove('selected'));
            keyEl.classList.add('selected');
            els.submitBtn.disabled = false;
            
            // Play the corresponding tone
            if (synth) {
                // Construct the note name for Tone.js (e.g., C5, C#5)
                let toneAccidental = state.selectedAnswer.accidental === 'n' ? '' : state.selectedAnswer.accidental;
                // Play it in octave 5 for brighter feedback
                synth.triggerAttackRelease(`${state.selectedAnswer.note}${toneAccidental}5`, "8n");
            }
        });
    });

    els.submitBtn.addEventListener('click', checkAnswer);

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
    renderer.resize(500, 150);
    const context = renderer.getContext();
    
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

function generateRandomNote() {
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

    state.currentNote = { key: note, accidental, octave, clef };
}

function renderStaff() {
    els.staffContainer.innerHTML = '';
    
    const VF = Vex.Flow;
    
    // Create an SVG renderer and attach it to the DIV element
    const renderer = new VF.Renderer(els.staffContainer, VF.Renderer.Backends.SVG);
    
    // Create an unscaled, perfectly sized native SVG box
    renderer.resize(200, 160);
    
    // And get a drawing context
    const context = renderer.getContext();
    
    // Create a stave. Width 150, centered horizontally: (200 - 150) / 2 = 25
    // Set y=40, perfectly balancing the treble clef inside 160 height.
    const stave = new VF.Stave(25, 40, 150);
    
    // Add a clef
    stave.addClef(state.currentNote.clef);
    
    // Connect it to the rendering context and draw
    stave.setContext(context).draw();

    // If we have a note to display
    if (state.currentNote.key) {
        const keyName = `${state.currentNote.key.toLowerCase()}/${state.currentNote.octave}`;
        const accidental = state.currentNote.accidental;
        
        // Convert 'n' to nothing for VexFlow, or use natural sign
        // In Vexflow, 'n' is natural.
        const vfAccidental = accidental === 'n' ? 'n' : accidental;
        
        let staveNote = new VF.StaveNote({
            clef: state.currentNote.clef,
            keys: [keyName],
            duration: "q"
        });

        if (accidental !== 'n') {
             staveNote.addAccidental(0, new VF.Accidental(vfAccidental));
        }

        const voice = new VF.Voice({num_beats: 1, beat_value: 4});
        voice.addTickables([staveNote]);
        
        // Format and justify the notes to 80 pixels
        new VF.Formatter().joinVoices([voice]).format([voice], 80);
        
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
    els.submitBtn.disabled = true;
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
    if (!state.selectedAnswer.note) return;

    const selectedPitch = getPitchClass(state.selectedAnswer.note, state.selectedAnswer.accidental);
    const correctPitch = getPitchClass(state.currentNote.key, state.currentNote.accidental);
    
    const isCorrect = selectedPitch === correctPitch;

    // Helper to format note names for history (e.g. C#, Db)
    const formatNote = (note, acc) => {
        let symbol = '';
        if (acc === '#') symbol = '♯';
        if (acc === 'b') symbol = '♭';
        return `${note}${symbol}`;
    };

    const correctNoteString = formatNote(state.currentNote.key, state.currentNote.accidental);
    const userNoteString = formatNote(state.selectedAnswer.note, state.selectedAnswer.accidental);

    if (isCorrect) {
        state.score.correct++;
        playNote(state.currentNote.key, state.currentNote.accidental, state.currentNote.octave);
    } else {
        state.score.incorrect++;
        playNote(state.currentNote.key, state.currentNote.accidental, state.currentNote.octave);
    }

    // Add to history
    state.history.unshift({
        isCorrect,
        clef: state.currentNote.clef === 'treble' ? '高音譜' : '低音譜',
        correctNote: correctNoteString,
        userNote: userNoteString,
        rawNote: { ...state.currentNote } // Save the exact note to re-render
    });

    // Keep history list manageable
    if (state.history.length > 50) state.history.pop();

    updateScore();
    renderHistory();
    showFeedback(isCorrect, correctNoteString);
    
    // Wait for feedback animation then generate next
    setTimeout(() => {
        generateNextQuestion();
    }, 1400);
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
    generateRandomNote();
    renderStaff();
    resetSelection();
}

// Boot
window.addEventListener('DOMContentLoaded', init);
