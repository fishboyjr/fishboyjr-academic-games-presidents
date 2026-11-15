# Sources and corrections

## Where the material comes from

All study content comes from the Academic Games Leagues of America (AGLOA), collected in November 2026.

| Source | Link | Used for |
|---|---|---|
| Presidents Rules and Documents | https://agloa.org/pres-docs/ | Main index for everything below |
| 2026-27 Official Tournament Rules (updated June 14, 2026) | https://agloa.org/wp-content/uploads/PresRules2026-27.pdf | Game format, scoring, ranges, theme |
| Presidents Chart & Scratch Sheets, Group B #16-24 and #25-33 | https://agloa.org/wp-content/uploads/PresChartScratchSheet16-24.pdf, https://agloa.org/wp-content/uploads/PresChartScratchSheet25-33.pdf | `js/data/presidents.js` |
| Presidents Worksheets, Table of Contents (Group B folder, B1-B25) | https://docs.google.com/document/d/1g3Oy_j2FzWx-czpqY83TUtMBar9BCwYgSeUjRil43dk | `js/data/facts.js` |
| Presidents Worksheets, Answer Key | linked from the Table of Contents | Answers in `js/data/facts.js` |
| Sample Presidents Questions #16-#33 (Google Slides) | linked from https://agloa.org/pres-docs/ | `SAMPLE_QUESTIONS` in `js/data/facts.js` |
| AGLOA monthly "Presidents Quiz" archive, 2012-2021 | https://agloa.org/category/pres-quiz/ | `js/data/quiz.js` (clues from 2015-2021; the 2012-2014 posts have no answers in a form that could be extracted) |

### About Brother Neal Golden's training materials

Brother Neal Golden, S.C., wrote AGLOA's PRESIDENTS training materials for many years. AGLOA's [Training Materials page](https://agloa.org/training-materials/) says that as of April 2026 he no longer produces them. AGLOA plans to release updated materials free of charge. As of November 2026, the Group B worksheets and practice questions listed above are the only ones published. When AGLOA releases more, they can be added to `js/data/facts.js`.

## Answer-key corrections

These items differ from the AGLOA answer key. This list is for coaches; the app itself does not mention the answer key or these corrections. Where it helps, the app shows a short history note instead (for example, "Ratified February 27, 1951").

| Item | Answer key | This app | Reason |
|---|---|---|---|
| B6 #6: U.S. forces occupy the Philippines | 24 | 25 | The occupation began under McKinley (1898-99). |
| B6 #10: Albert Fall sentenced to prison | 30 | 31 | Fall was convicted and sentenced in 1929, after Hoover took office. |
| B9 #5: State governor | 19, 22/24 | 17, 19, 22/24 | Andrew Johnson was elected governor of Tennessee (1853-1857). |
| B9 #18: Member of the U.S. House | 16, 19, 20 | 16, 17, 19, 20 | Andrew Johnson served in the U.S. House (1843-1853). |
| B9 #21: Member of his state legislature | 16, 17 | 16, 17, 20 | Garfield served in the Ohio State Senate. |
| B11 #13: Captain in an artillery regiment | "233" | 33 | Typo. |
| B20 #19: 22nd Amendment (term limits) | 29 | 33 | Ratified February 27, 1951, under Truman. |
| B21 #10: Albert Fall, Secretary of the Interior | 29, 30 | 29 | Fall resigned in March 1923, before Coolidge took office. |
| B24 #6: "A Square Deal All Around" | 26, 27, 28 (1912) | 26 | Theodore Roosevelt's 1904 slogan. |
| B25 #14: "My father, a clergyman, died when I was 16." | numbered "21." | 22/24 | Numbering typo in the key. The answer, Cleveland, is unchanged. |

### Cleveland's two terms

The answer key often writes "22/24" for Grover Cleveland. Where the worksheet or key gives a date that settles the term, this app uses that term. Otherwise either 22 or 24 is accepted:

- B1 "Married in the White House": 22 (1886)
- B3 "Mother of the first president's child born in the White House": 24 (Esther, 1893)
- B7 Wilson-Gorman Act: 24 (1894)
- B8 Venezuela boundary arbitration: 24 (1895)
- B13 and B24: 1884 items use 22 and 1892 items use 24, matching the years in the key.

In tournament rounds, if every clue read so far could fit either term, either answer counts; once a clue names the term, only that term counts. The app reminds players that at a real tournament they must circle the right term.

## Other edits

- In practice question 1, the original 2-point clue refers to "the man pictured at the left" (Robert E. Lee). The app names him instead.
- In practice question 4, the source lists the 2-point clue before the 4-point clue. The app puts them in 6-4-2 order.
- Worksheet symbols such as `^` (resigned) and `*` (died in office) are written out as notes.
