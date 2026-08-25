import re

with open('app.v26.js', 'r') as f:
    js = f.read()

js = js.replace("if (e && e.cancelable) e.preventDefault();", "")

with open('app.v26.js', 'w') as f:
    f.write(js)
