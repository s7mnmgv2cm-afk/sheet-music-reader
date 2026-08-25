import re

with open('index.html', 'r') as f:
    html = f.read()

# Add <script src="songs.js"></script>
html = html.replace('<script src="app.v25.js"></script>', '<script src="songs.js"></script>\n    <script src="app.v26.js"></script>')

# Add 'song' mode to app-mode-select
old_mode = """                        <option value="practice">練習模式 (Practice)</option>
                        <option value="play">自由彈奏 (Play)</option>"""
new_mode = """                        <option value="practice">練習模式 (Practice)</option>
                        <option value="play">自由彈奏 (Play)</option>
                        <option value="song">樂曲挑戰 (Song Challenge)</option>"""
html = html.replace(old_mode, new_mode)

# Add song controls UI
song_controls = """                <!-- Song Controls (hidden by default) -->
                <div id="song-controls" style="display: none; width: 100%; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: center; background: #eef5fc; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <label class="control-label">
                        <span>選擇樂曲：</span>
                        <select id="song-select"></select>
                    </label>
                    <label class="control-label">
                        <span>速度 (BPM)：</span>
                        <input type="number" id="bpm-input" style="width: 60px;" value="100">
                    </label>
                    <button id="song-play-btn" class="primary-btn" style="padding: 0.5rem 1rem;">▶️ 開始挑戰</button>
                    <button id="song-stop-btn" class="secondary-btn" style="padding: 0.5rem 1rem;" disabled>⏹ 停止</button>
                    <div id="song-score" style="font-weight: bold; color: var(--primary-color);">Combo: 0</div>
                </div>"""

# Insert song controls after <div class="controls">
html = html.replace('                <label class="control-label">\n                    <span>App 模式：</span>', song_controls + '\n                <label class="control-label">\n                    <span>App 模式：</span>')

# Add playback cursor
html = html.replace('<!-- VexFlow will render here -->', '<!-- VexFlow will render here -->\n                    <div id="playback-cursor" class="playback-cursor hidden"></div>')

# Wrap practice controls in a div so they can be easily hidden
html = html.replace('                <label class="control-label">\n                    <span>譜號：</span>', '<div id="practice-controls" style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center;">\n                <label class="control-label">\n                    <span>譜號：</span>')
html = html.replace('                <label class="control-label">\n                    <span>作答介面：</span>', '                </div>\n                <label class="control-label">\n                    <span>作答介面：</span>')

with open('index.html', 'w') as f:
    f.write(html)
