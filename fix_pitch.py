import re

with open('app.v25.js', 'r') as f:
    js = f.read()

old_get_pitch = "const getAbsolutePitch = (n, acc, oct) => getPitchClass(n, acc) + (parseInt(oct) * 12);"

new_get_pitch = """const getAbsolutePitch = (n, acc, oct) => {
        const basePitches = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        let pitch = basePitches[n] + (parseInt(oct) * 12);
        if (acc === '#') pitch += 1;
        if (acc === 'b') pitch -= 1;
        return pitch;
    };"""

js = js.replace(old_get_pitch, new_get_pitch)

with open('app.v25.js', 'w') as f:
    f.write(js)
