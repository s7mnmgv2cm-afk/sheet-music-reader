import re

with open('app.v31.js', 'r') as f:
    js = f.read()

# Add a fallback for SONGS right after the state initialization
fallback = """
// Fallback if songs.js fails to load (e.g. not committed to Git)
if (typeof SONGS === 'undefined') {
    window.SONGS = [
        {
            id: "twinkle",
            title: "小星星 (Fallback)",
            bpm: 100,
            clef: "treble",
            measures: [
                [
                    { keys: ["c/4"], duration: "q" },
                    { keys: ["c/4"], duration: "q" },
                    { keys: ["g/4"], duration: "q" },
                    { keys: ["g/4"], duration: "q" }
                ],
                [
                    { keys: ["a/4"], duration: "q" },
                    { keys: ["a/4"], duration: "q" },
                    { keys: ["g/4"], duration: "h" }
                ]
            ]
        }
    ];
}
"""

js = js.replace("let state = {", fallback + "\nlet state = {")

# Fix the array index fallback
js = js.replace("state.songData = SONGS[els.songSelect.value || 'twinkle'];", "state.songData = SONGS[parseInt(els.songSelect.value) || 0];")

with open('app.v31.js', 'w') as f:
    f.write(js)
