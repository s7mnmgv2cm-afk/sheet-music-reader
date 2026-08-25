import re

with open('app.v27.js', 'r') as f:
    js = f.read()

# Add try-catch to pressKey
old_press = """        const pressKey = (e) => {
             
            if (!state.isStarted || keyEl.dataset.isPressed === 'true') return;
            keyEl.dataset.isPressed = 'true';"""

new_press = """        const pressKey = (e) => {
            try { 
            if (!state.isStarted || keyEl.dataset.isPressed === 'true') return;
            keyEl.dataset.isPressed = 'true';"""

js = js.replace(old_press, new_press)

old_check = """                keyEl.classList.add('selected');
                checkAnswer();
            }
        };"""

new_check = """                keyEl.classList.add('selected');
                checkAnswer();
            }
            } catch (err) {
                alert("Error in pressKey: " + err.message);
            }
        };"""

js = js.replace(old_check, new_check)

with open('app.v27.js', 'w') as f:
    f.write(js)
