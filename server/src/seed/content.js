/**
 * Generates readable, lesson-specific markdown content for the seed data so the
 * in-app lesson reader has real material to display. Content is derived from the
 * lesson title and its course category, with a topically-matched code example.
 */

// --- Topical code/example snippets matched against the lesson title ---
const SNIPPETS = [
  [/big-?o|complexity/i, 'js', `// Big-O describes how work grows with input size n.
function sum(nums) {        // O(n) — one pass
  let total = 0;
  for (const n of nums) total += n;
  return total;
}`],
  [/\bloop|iterat/i, 'js', `const items = ['a', 'b', 'c'];
for (let i = 0; i < items.length; i++) {
  console.log(i, items[i]);
}
items.forEach((item, i) => console.log(i, item));`],
  [/function|scope/i, 'js', `function greet(name = 'world') {
  const message = \`Hello, \${name}!\`; // block-scoped with const
  return message;
}
console.log(greet('Ava')); // "Hello, Ava!"`],
  [/array/i, 'js', `const nums = [5, 2, 8, 1];
const doubled = nums.map((n) => n * 2);   // [10, 4, 16, 2]
const evens = nums.filter((n) => n % 2 === 0); // [2, 8]
const total = nums.reduce((a, b) => a + b, 0); // 16`],
  [/object|method/i, 'js', `const user = {
  name: 'Ava',
  greet() { return \`Hi, I'm \${this.name}\`; },
};
console.log(user.greet());`],
  [/hash|map/i, 'js', `const counts = new Map();
for (const ch of 'banana') {
  counts.set(ch, (counts.get(ch) ?? 0) + 1);
}
console.log(counts); // Map { 'b' => 1, 'a' => 3, 'n' => 2 }`],
  [/linked list/i, 'js', `class Node {
  constructor(value) { this.value = value; this.next = null; }
}
const head = new Node(1);
head.next = new Node(2); // 1 -> 2`],
  [/stack|queue/i, 'js', `const stack = [];
stack.push('a'); stack.push('b');
console.log(stack.pop()); // 'b'  (last in, first out)`],
  [/tree|traversal/i, 'js', `function inorder(node, visit) {
  if (!node) return;
  inorder(node.left, visit);
  visit(node.value);
  inorder(node.right, visit);
}`],
  [/graph|bfs|dfs/i, 'js', `function bfs(graph, start) {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node]) {
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return [...seen];
}`],
  [/sort/i, 'js', `const nums = [5, 2, 8, 1];
nums.sort((a, b) => a - b); // [1, 2, 5, 8] — ascending`],
  [/dynamic programming/i, 'js', `const memo = {};
function fib(n) {
  if (n < 2) return n;
  if (memo[n]) return memo[n];
  return (memo[n] = fib(n - 1) + fib(n - 2));
}`],
  [/jsx|rendering/i, 'jsx', `function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}
// <Welcome name="Ava" /> renders: <h1>Hello, Ava</h1>`],
  [/component|props/i, 'jsx', `function Badge({ label, color }) {
  return <span style={{ color }}>{label}</span>;
}`],
  [/usestate|\bstate\b/i, 'jsx', `import { useState } from 'react';
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`],
  [/useeffect|side effect|fetch/i, 'jsx', `import { useEffect, useState } from 'react';
function Profile({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(\`/api/users/\${id}\`).then((r) => r.json()).then(setUser);
  }, [id]);
  return <div>{user?.name ?? 'Loading…'}</div>;
}`],
  [/hook/i, 'jsx', `function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle];
}`],
  [/group by|aggregat/i, 'sql', `SELECT category, COUNT(*) AS lessons, AVG(minutes) AS avg_minutes
FROM lessons
GROUP BY category
ORDER BY lessons DESC;`],
  [/\bjoin/i, 'sql', `SELECT s.name, c.title
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses  c ON c.id = e.course_id;`],
  [/select|where/i, 'sql', `SELECT title, difficulty
FROM courses
WHERE category = 'Programming'
ORDER BY title;`],
  [/index|performance/i, 'sql', `CREATE INDEX idx_activity_student_time
ON activity_events (student_id, occurred_at DESC);`],
  [/subquer/i, 'sql', `SELECT title FROM courses
WHERE id IN (SELECT course_id FROM enrollments WHERE student_id = 1);`],
  [/transaction/i, 'sql', `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`],
  [/pandas|dataframe|clean|filter|group/i, 'python', `import pandas as pd
df = pd.read_csv('activity.csv')
by_course = df.groupby('course')['minutes'].sum()
print(by_course.sort_values(ascending=False).head())`],
  [/numpy/i, 'python', `import numpy as np
a = np.array([1, 2, 3, 4])
print(a.mean(), a.std())  # 2.5  1.118...`],
  [/matplotlib|visualiz/i, 'python', `import matplotlib.pyplot as plt
plt.plot(dates, minutes)
plt.title('Study minutes per day')
plt.show()`],
  [/time series/i, 'python', `df['date'] = pd.to_datetime(df['date'])
daily = df.set_index('date').resample('D')['minutes'].sum()`],
];

const CATEGORY_DEFAULT = {
  Programming: ['js', `// A small illustrative snippet
const result = [1, 2, 3].map((n) => n * n);
console.log(result); // [1, 4, 9]`],
  'Computer Science': ['js', `// Reason about the approach before you code it
function contains(arr, target) {
  for (const x of arr) if (x === target) return true; // O(n)
  return false;
}`],
};

function tags(course) {
  return (course.tags || []).join(' ').toLowerCase();
}

function pickSnippet(course, title) {
  for (const [re, lang, code] of SNIPPETS) {
    if (re.test(title)) return { lang, code };
  }
  if (course.category === 'Design') return null; // design lessons use a checklist instead
  if (course.category === 'Data Science') {
    if (tags(course).includes('sql')) {
      return { lang: 'sql', code: 'SELECT * FROM courses ORDER BY title;' };
    }
    return { lang: 'python', code: "import pandas as pd\ndf = pd.read_csv('data.csv')\nprint(df.head())" };
  }
  const def = CATEGORY_DEFAULT[course.category] || CATEGORY_DEFAULT.Programming;
  return { lang: def[0], code: def[1] };
}

const OVERVIEWS = {
  Programming: (t) =>
    `In this lesson we dig into **${t}**. You'll build the intuition to recognise it in real code and use it confidently in your own projects.`,
  'Computer Science': (t) =>
    `**${t}** shows up again and again in real systems and technical interviews. We'll cover the core idea, the trade-offs, and how to reason about performance.`,
  Design: (t) =>
    `Great products feel effortless because of details like **${t}**. This lesson breaks down the principle and gives you a checklist you can apply immediately.`,
  'Data Science': (t) =>
    `Working with data means getting comfortable with **${t}**. We'll walk through the concept and a concrete example you can adapt to your own datasets.`,
};

// Design lessons get a practical checklist instead of a code block.
function designChecklist(title) {
  return [
    `Audit an existing screen for **${title.toLowerCase()}** and note what works.`,
    'List three concrete improvements you could make.',
    'Apply the strongest one and compare before/after.',
  ];
}

function lowerTopic(title) {
  return title.replace(/[:].*$/, '').replace(/[.?!]+$/, '').trim();
}

/**
 * Short one-line summary shown in the lesson list.
 */
function buildLessonSummary(course, title) {
  const t = lowerTopic(title);
  const byCat = {
    Programming: `Understand ${t.toLowerCase()} and how to use it in JavaScript.`,
    'Computer Science': `Learn how ${t.toLowerCase()} works and when to reach for it.`,
    Design: `Apply the principle of ${t.toLowerCase()} to real interfaces.`,
    'Data Science': `Work with ${t.toLowerCase()} on a concrete dataset.`,
  };
  return byCat[course.category] || `An introduction to ${t}.`;
}

/**
 * Full markdown body for a lesson.
 * @param {object} course raw course definition (title, category, tags)
 * @param {{title:string, estimatedMinutes:number, difficulty:string}} lesson
 * @param {number} index 0-based position in the course
 */
function buildLessonContent(course, lesson, index) {
  const { title, estimatedMinutes, difficulty } = lesson;
  const t = lowerTopic(title);
  const overview = (OVERVIEWS[course.category] || OVERVIEWS.Programming)(t);
  const snippet = pickSnippet(course, title);

  const objectives = [
    `Explain what ${t.toLowerCase()} is and when to reach for it.`,
    `Recognise common patterns and pitfalls around ${t.toLowerCase()}.`,
    `Apply ${t.toLowerCase()} in a short, hands-on exercise.`,
  ];

  const takeaways = [
    `${t} is a core part of ${course.title}.`,
    'Practise with small examples before using it in a bigger project.',
    index > 0
      ? 'It builds directly on the previous lessons in this course.'
      : 'It sets the foundation for everything that follows in this course.',
  ];

  const lines = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`_${difficulty} · about ${estimatedMinutes} min · Lesson ${index + 1} of ${course.title}_`);
  lines.push('');
  lines.push('## Learning objectives');
  lines.push("By the end of this lesson you'll be able to:");
  lines.push('');
  objectives.forEach((o) => lines.push(`- ${o}`));
  lines.push('');
  lines.push('## Overview');
  lines.push(overview);
  lines.push('');

  if (snippet) {
    lines.push('## Example');
    lines.push('Here is a small example to ground the idea:');
    lines.push('');
    lines.push('```' + snippet.lang);
    lines.push(snippet.code);
    lines.push('```');
    lines.push('');
  } else {
    lines.push('## Try it in practice');
    designChecklist(title).forEach((c) => lines.push(`- ${c}`));
    lines.push('');
  }

  lines.push('## Key takeaways');
  takeaways.forEach((k) => lines.push(`- ${k}`));
  lines.push('');
  lines.push(`> **Practice:** In your own words, explain ${t.toLowerCase()} to a friend, then complete the exercise and mark this lesson done.`);

  return lines.join('\n');
}

module.exports = { buildLessonContent, buildLessonSummary };
