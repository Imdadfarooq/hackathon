/**
 * Static catalog used by the seed script. Lessons are generated from these
 * definitions with sequential order numbers.
 */

const COURSES = [
  {
    title: 'JavaScript Fundamentals',
    slug: 'javascript-fundamentals',
    category: 'Programming',
    difficulty: 'beginner',
    color: '#f59e0b',
    tags: ['javascript', 'web', 'basics'],
    description:
      'Master the building blocks of JavaScript: variables, functions, arrays, objects, and the DOM.',
    lessons: [
      'Values, Variables & Types',
      'Operators & Expressions',
      'Conditionals & Control Flow',
      'Loops',
      'Functions & Scope',
      'Arrays & Iteration',
      'Objects & Methods',
      'The DOM & Events',
      'Error Handling',
      'Putting It Together: A Mini App',
    ],
  },
  {
    title: 'React from Scratch',
    slug: 'react-from-scratch',
    category: 'Programming',
    difficulty: 'intermediate',
    color: '#06b6d4',
    tags: ['react', 'frontend', 'components'],
    description:
      'Build modern user interfaces with React — components, hooks, state management, and data fetching.',
    lessons: [
      'Why React? Mental Models',
      'JSX & Rendering',
      'Components & Props',
      'State with useState',
      'Handling Events',
      'Lists & Keys',
      'Side Effects with useEffect',
      'Fetching Data',
      'Context & Global State',
      'Custom Hooks',
      'Performance & Memoization',
      'Deploying a React App',
    ],
  },
  {
    title: 'Data Structures & Algorithms',
    slug: 'data-structures-algorithms',
    category: 'Computer Science',
    difficulty: 'advanced',
    color: '#8b5cf6',
    tags: ['algorithms', 'interview', 'cs'],
    description:
      'The core data structures and algorithmic patterns that power efficient software and ace interviews.',
    lessons: [
      'Big-O Notation',
      'Arrays & Strings',
      'Hash Maps',
      'Linked Lists',
      'Stacks & Queues',
      'Trees & Traversals',
      'Graphs & BFS/DFS',
      'Sorting Algorithms',
      'Dynamic Programming',
      'System Design Basics',
    ],
  },
  {
    title: 'UI/UX Design Principles',
    slug: 'ui-ux-design-principles',
    category: 'Design',
    difficulty: 'beginner',
    color: '#ec4899',
    tags: ['design', 'ux', 'ui'],
    description:
      'Learn the principles of great product design — hierarchy, color, typography, and usability.',
    lessons: [
      'Design Thinking',
      'Visual Hierarchy',
      'Color Theory',
      'Typography',
      'Layout & Spacing',
      'Usability Heuristics',
      'Prototyping',
      'Design Systems',
    ],
  },
  {
    title: 'Python for Data Analysis',
    slug: 'python-for-data-analysis',
    category: 'Data Science',
    difficulty: 'intermediate',
    color: '#10b981',
    tags: ['python', 'pandas', 'data'],
    description:
      'Analyze real datasets with Python, pandas, and visualization libraries to extract insights.',
    lessons: [
      'Python Refresher',
      'NumPy Arrays',
      'pandas Series & DataFrames',
      'Loading & Cleaning Data',
      'Filtering & Grouping',
      'Joining Datasets',
      'Visualization with Matplotlib',
      'Exploratory Data Analysis',
      'Time Series Basics',
      'A Full Analysis Project',
    ],
  },
  {
    title: 'Databases & SQL',
    slug: 'databases-and-sql',
    category: 'Data Science',
    difficulty: 'beginner',
    color: '#3b82f6',
    tags: ['sql', 'database', 'data'],
    description:
      'Design relational schemas and query data confidently with SQL — from SELECT to JOINs and indexes.',
    lessons: [
      'Relational Model',
      'SELECT & WHERE',
      'Sorting & Limiting',
      'Aggregations & GROUP BY',
      'JOINs',
      'Subqueries',
      'Indexes & Performance',
      'Transactions',
      'Schema Design',
    ],
  },
];

/**
 * Demo accounts. Password for every seeded account is `Password123`.
 */
const MENTOR = {
  name: 'Morgan Mentor',
  email: 'mentor@demo.io',
  avatarColor: '#0ea5e9',
};

const STUDENTS = [
  { name: 'Ava Student', email: 'student@demo.io', avatarColor: '#6366f1', engagement: 'high' },
  { name: 'Liam Carter', email: 'liam@demo.io', avatarColor: '#f97316', engagement: 'medium' },
  { name: 'Sofia Nguyen', email: 'sofia@demo.io', avatarColor: '#14b8a6', engagement: 'high' },
  { name: 'Noah Patel', email: 'noah@demo.io', avatarColor: '#a855f7', engagement: 'low' },
  { name: 'Emma Rossi', email: 'emma@demo.io', avatarColor: '#ef4444', engagement: 'medium' },
];

const DEMO_PASSWORD = 'Password123';

module.exports = { COURSES, MENTOR, STUDENTS, DEMO_PASSWORD };
