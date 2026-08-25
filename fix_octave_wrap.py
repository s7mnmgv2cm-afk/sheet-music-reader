import re

with open('app.v25.js', 'r') as f:
    js = f.read()

# Fix the octave wrapping logic for chords
old_o2 = "const o2 = (rIdx + 2 < rIdx) ? rootOctave + 1 : rootOctave;"
new_o2 = "const o2 = (rIdx + 2 >= 7) ? rootOctave + 1 : rootOctave;"
js = js.replace(old_o2, new_o2)

old_o3 = "const o3 = (rIdx + 4 < rIdx) ? rootOctave + 1 : rootOctave;"
new_o3 = "const o3 = (rIdx + 4 >= 7) ? rootOctave + 1 : rootOctave;"
js = js.replace(old_o3, new_o3)

with open('app.v25.js', 'w') as f:
    f.write(js)
