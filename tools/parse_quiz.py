"""Extract president clues + answers from the AGLOA "Presidents Quiz" archive.

Input: a text dump of the quiz posts (one post per "##### <title> [<date>] <slug>" header),
made from the WordPress API: https://agloa.org/wp-json/wp/v2/posts?search=presidents%20quiz&per_page=100
Output: JSON list of clues whose answer is one of presidents #16-33.

Usage: python3 tools/parse_quiz.py quizzes.txt quiz_items.json
Then:  python3 tools/build_quiz_data.py quiz_items.json js/data/quiz.js
"""
import re, json, sys
src = sys.argv[1]
t = open(src, encoding='utf-8').read()
posts = re.split(r'^##### ', t, flags=re.M)[1:]
items, report = [], []
hdr = re.compile(r'^#(\d+)\s*-\s*#?(\d+)\s*$')
ansl = re.compile(r'^\s*(?://\s*Answers?:\s*)?(?:(\d+)\.\s*)?\(?#\s*(\d+)\)?\b(.*)$')
for p in posts:
    title_line, *lines = p.split('\n')
    if 'Presidents Quiz' not in title_line: continue
    m = re.search(r'\[(\d{4}-\d{2}-\d{2})\] (\S+)', title_line)
    date, slug = m.group(1), m.group(2)
    title = title_line.split(' [')[0]
    # find instruction line preceding blocks
    i = 0; n_kept = 0; n_blocks = 0
    instr = ''
    while i < len(lines):
        L = lines[i].strip()
        if re.match(r'^(Identify|Match|Name|Which|Fill)', L): instr = L
        h = hdr.match(L)
        if h and not re.search(r'Answers?$', L):
            lo, hi = int(h.group(1)), int(h.group(2))
            j = i + 1; clues = []
            while j < len(lines) and not re.search(r'Answers?$', lines[j].strip()):
                if lines[j].strip(): clues.append(lines[j].strip())
                j += 1
            k = j + 1; ans = []
            while k < len(lines):
                a = ansl.match(lines[k])
                if a: ans.append((int(a.group(2)), a.group(3).strip(' ";'))); k += 1; continue
                if re.match(r'^// Answers?:?\s*$', lines[k].strip()): k += 1; continue
                break
            n_blocks += 1
            if len(ans)==1 and len(clues)>1: clues=[' '.join(clues)]
            if clues and len(clues) == len(ans) and instr.lower().startswith('identify') or (clues and len(clues)==len(ans) and not instr):
                for c, (num, nm) in zip(clues, ans):
                    if 16 <= num <= 33:
                        items.append(dict(lo=lo, hi=hi, text=c, president=num, source=f'AGLOA {title}', url=f'https://agloa.org/{slug}/', date=date, instruction=instr))
                        n_kept += 1
            else:
                report.append(f'SKIP {slug} block #{lo}-{hi}: clues={len(clues)} ans={len(ans)} instr={instr[:60]!r}')
            i = k; continue
        i += 1
    report.append(f'{slug}: blocks={n_blocks} kept={n_kept}')
seen=set(); out=[]
for it in items:
    t=it['text'].strip()
    if not ((it['lo']>=16 and it['hi']<=33) or len(t)>=80): continue
    if t in seen: continue
    seen.add(t)
    it['president'] = 'C' if it['president'] in (22,24) else it['president']
    out.append(it)
items=out
json.dump(items, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
print('\n'.join(report)); print('TOTAL kept', len(items))
