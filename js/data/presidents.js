/*
 * Presidents #16-33 (AGLOA Group B).
 * Chart facts come from the official AGLOA Presidents Chart & Scratch Sheets
 * (Group B #16-24 and #25-33): https://agloa.org/pres-docs/
 *
 * Grover Cleveland appears twice, as #22 and #24, exactly like the chart.
 * Worksheet facts that apply to Cleveland in general use the answer "C"
 * (accepted as either 22 or 24).
 */
window.PRESIDENTS = [
  { n: 16, name: "Abraham Lincoln", short: "Lincoln", lived: "1809-1865", born: "Kentucky", died: "Washington, D.C.", term: "1861-1865", party: "Republican" },
  { n: 17, name: "Andrew Johnson", short: "A. Johnson", lived: "1808-1875", born: "North Carolina", died: "Tennessee", term: "1865-1869", party: "Democratic" },
  { n: 18, name: "Ulysses S. Grant", short: "Grant", lived: "1822-1885", born: "Ohio", died: "New York", term: "1869-1877", party: "Republican" },
  { n: 19, name: "Rutherford B. Hayes", short: "Hayes", lived: "1822-1893", born: "Ohio", died: "Ohio", term: "1877-1881", party: "Republican" },
  { n: 20, name: "James Garfield", short: "Garfield", lived: "1831-1881", born: "Ohio", died: "New Jersey", term: "1881-1881", party: "Republican" },
  { n: 21, name: "Chester Arthur", short: "Arthur", lived: "1830-1886", born: "Vermont", died: "New York", term: "1881-1885", party: "Republican" },
  { n: 22, name: "Grover Cleveland", short: "Cleveland (1st)", lived: "1837-1908", born: "New Jersey", died: "New Jersey", term: "1885-1889", party: "Democratic" },
  { n: 23, name: "Benjamin Harrison", short: "B. Harrison", lived: "1833-1901", born: "Ohio", died: "Indiana", term: "1889-1893", party: "Republican" },
  { n: 24, name: "Grover Cleveland", short: "Cleveland (2nd)", lived: "1837-1908", born: "New Jersey", died: "New Jersey", term: "1893-1897", party: "Democratic" },
  { n: 25, name: "William McKinley", short: "McKinley", lived: "1843-1901", born: "Ohio", died: "New York", term: "1897-1901", party: "Republican" },
  { n: 26, name: "Theodore Roosevelt", short: "T. Roosevelt", lived: "1858-1919", born: "New York", died: "New York", term: "1901-1909", party: "Republican" },
  { n: 27, name: "William Howard Taft", short: "Taft", lived: "1857-1930", born: "Ohio", died: "Washington, D.C.", term: "1909-1913", party: "Republican" },
  { n: 28, name: "Woodrow Wilson", short: "Wilson", lived: "1856-1924", born: "Virginia", died: "Washington, D.C.", term: "1913-1921", party: "Democratic" },
  { n: 29, name: "Warren Harding", short: "Harding", lived: "1865-1923", born: "Ohio", died: "California", term: "1921-1923", party: "Republican" },
  { n: 30, name: "Calvin Coolidge", short: "Coolidge", lived: "1872-1933", born: "Vermont", died: "Massachusetts", term: "1923-1929", party: "Republican" },
  { n: 31, name: "Herbert Hoover", short: "Hoover", lived: "1874-1964", born: "Iowa", died: "New York", term: "1929-1933", party: "Republican" },
  { n: 32, name: "Franklin D. Roosevelt", short: "F. Roosevelt", lived: "1882-1945", born: "New York", died: "Georgia", term: "1933-1945", party: "Democratic" },
  { n: 33, name: "Harry S. Truman", short: "Truman", lived: "1884-1972", born: "Missouri", died: "Missouri", term: "1945-1953", party: "Democratic" }
];

/* Tournament ranges for 2026-27 Elementary/Middle (rule PZ2). */
window.RANGES = {
  r1: { id: "r1", label: "Round 1: #16-24", lo: 16, hi: 24 },
  r2: { id: "r2", label: "Round 2: #25-33", lo: 25, hi: 33 },
  all: { id: "all", label: "All: #16-33", lo: 16, hi: 33 }
};
