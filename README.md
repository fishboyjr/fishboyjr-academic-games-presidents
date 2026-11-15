# Presidents Practice (#16–33)

A study app for the **Academic Games PRESIDENTS** game run by the Academic Games Leagues of America (AGLOA), built for the **2026–27 season**:

- **Elementary and Middle Divisions** (and Michigan's Minor Division) play **Group B: Presidents #16–33**. Round 1 is #16–24 and round 2 is #25–33.
- **Theme: Secretaries of State.** A 4- or 2-point clue may mention a Secretary of State.

It is a plain web app, so it works on iPads, Chromebooks, phones, and computers. Kids can add it to their home screen, and after the first visit it works offline. There's no build step and nothing to install.

## What kids can do

| Mode | What it does |
|---|---|
| **Tournament Round** | 12 questions with 3 clues each. Answering after clue 1 scores 6 points, clue 2 scores 4, clue 3 scores 2, and a wrong answer scores 0, just like the real game. There's an optional 30-second timer per clue and a range picker (#16–24, #25–33, or all). AGLOA's official practice questions are mixed in and marked. |
| **Secretaries of State** | A drill of the theme worksheet (B14). |
| **Worksheet Drills** | All 25 AGLOA Group B worksheets (B1–B25). Kids tap presidents on a chart-style grid; some items have more than one answer. |
| **Quick Mix** | 10 random facts from all the worksheets. |
| **Review My Misses** | Repeats every fact the kid got wrong last time. |
| **Study a President** | Chart facts, Secretaries of State, vice presidents, wives, nicknames, every worksheet fact, and archive clues for each president. |

Progress is saved in the browser on that device (localStorage). Nothing is sent anywhere.

## Content

Everything comes from AGLOA material. See [docs/SOURCES.md](docs/SOURCES.md) for sources and the answer-key corrections.

- 25 Group B worksheets, 527 facts (`js/data/facts.js`)
- 6 official AGLOA practice questions (`js/data/facts.js`, `SAMPLE_QUESTIONS`)
- 157 clues from AGLOA's monthly Presidents Quiz archive (2015–2021) (`js/data/quiz.js`, generated)
- The official Presidents Chart for #16–33 (`js/data/presidents.js`)

Tournament-round questions are put together from these facts: a harder fact for 6 points, a medium fact for 4 (often a Secretary of State), and an easy fact or a chart fact for 2. They are practice questions, not official ones.

## Running it

Open `index.html` in a browser. To test the offline/install features, serve the folder over HTTP:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Publishing with GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, then pick the branch and the `/ (root)` folder. The app will be at `https://<owner>.github.io/<repository>/`.

## Updating content

- **Worksheets:** edit `js/data/facts.js`. Each item is `[text, answers, note]`. Answers are president numbers; `"C"` means Grover Cleveland, either term (22 or 24).
- **Quiz archive:** `tools/parse_quiz.py` reads a text dump of the AGLOA quiz posts and `tools/build_quiz_data.py` writes `js/data/quiz.js`.
- After changing files, bump `CACHE` in `sw.js` so installed copies pick up the update.

## Files

```
index.html              app shell
css/app.css             styles (light and dark)
js/data/presidents.js   Presidents Chart #16-33 and round ranges
js/data/facts.js        AGLOA worksheets B1-B25 and official practice questions
js/data/quiz.js         AGLOA quiz-archive clues (generated)
js/store.js             saved settings and progress
js/engine.js            answer checking, drills, round builder
js/app.js               screens
sw.js, manifest.webmanifest, icons/   offline + home-screen install
tools/                  scripts used to extract the quiz archive
docs/SOURCES.md         sources and answer-key corrections
```

This is an independent study tool and is not produced or endorsed by AGLOA.
