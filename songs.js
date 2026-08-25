const SONGS = [
    {
        id: "twinkle",
        title: "小星星 (Twinkle Twinkle Little Star)",
        bpm: 100,
        clef: "treble",
        measures: [
            // Measure 1
            [
                { keys: ["c/4"], duration: "q" },
                { keys: ["c/4"], duration: "q" },
                { keys: ["g/4"], duration: "q" },
                { keys: ["g/4"], duration: "q" }
            ],
            // Measure 2
            [
                { keys: ["a/4"], duration: "q" },
                { keys: ["a/4"], duration: "q" },
                { keys: ["g/4"], duration: "h" }
            ],
            // Measure 3
            [
                { keys: ["f/4"], duration: "q" },
                { keys: ["f/4"], duration: "q" },
                { keys: ["e/4"], duration: "q" },
                { keys: ["e/4"], duration: "q" }
            ],
            // Measure 4
            [
                { keys: ["d/4"], duration: "q" },
                { keys: ["d/4"], duration: "q" },
                { keys: ["c/4"], duration: "h" }
            ]
        ]
    },
    {
        id: "ode_to_joy",
        title: "歡樂頌 (Ode to Joy)",
        bpm: 120,
        clef: "treble",
        measures: [
            [
                { keys: ["e/4"], duration: "q" },
                { keys: ["e/4"], duration: "q" },
                { keys: ["f/4"], duration: "q" },
                { keys: ["g/4"], duration: "q" }
            ],
            [
                { keys: ["g/4"], duration: "q" },
                { keys: ["f/4"], duration: "q" },
                { keys: ["e/4"], duration: "q" },
                { keys: ["d/4"], duration: "q" }
            ],
            [
                { keys: ["c/4"], duration: "q" },
                { keys: ["c/4"], duration: "q" },
                { keys: ["d/4"], duration: "q" },
                { keys: ["e/4"], duration: "q" }
            ],
            [
                { keys: ["e/4"], duration: "q" },
                { keys: ["d/4"], duration: "8" },
                { keys: ["d/4"], duration: "q" } // simplified ending
            ]
        ]
    }
];
