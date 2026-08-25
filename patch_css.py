with open('style.css', 'r') as f:
    css = f.read()

new_css = """
/* Song Mode Styles */
.playback-cursor {
    position: absolute;
    top: 50px;
    bottom: 50px;
    width: 4px;
    background-color: rgba(74, 144, 226, 0.5);
    box-shadow: 0 0 8px rgba(74, 144, 226, 0.8);
    border-radius: 2px;
    z-index: 10;
    transition: left 0.1s linear; /* Smooth movement between ticks */
}
.playback-cursor.hidden {
    display: none;
}
"""

css += new_css

with open('style.css', 'w') as f:
    f.write(css)
