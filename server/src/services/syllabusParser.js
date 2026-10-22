/**
 * Intelligently parses raw syllabus document text into structured units,
 * topics, difficulty heuristics, estimated study hours, and summaries.
 */

const ROMAN_MAP = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5,
  vi: 6, vii: 7, viii: 8, ix: 9, x: 10
};

function parseUnitNumber(str) {
  const clean = str.trim().toLowerCase();
  if (ROMAN_MAP[clean]) return ROMAN_MAP[clean];
  const num = parseInt(clean, 10);
  return isNaN(num) ? null : num;
}

function cleanLine(l) {
  return l.replace(/^[\s•\-\*\d+\.\)\:]+/, '').trim();
}

function assessDifficulty(text) {
  const lower = text.toLowerCase();
  const hardKeywords = [
    'advanced', 'distributed', 'concurrency', 'optimization', 'asymptotic',
    'trees', 'graphs', 'np-complete', 'cryptography', 'compiler', 'deadlock',
    'calculus', 'dynamic programming', 'pointer', 'memory management', 'pipeline'
  ];
  const easyKeywords = [
    'introduction', 'basics', 'overview', 'fundamentals', 'preliminaries',
    'definitions', 'history', 'setup', 'syntax', 'hello world', 'components'
  ];

  let hardScore = 0;
  let easyScore = 0;

  hardKeywords.forEach(k => { if (lower.includes(k)) hardScore++; });
  easyKeywords.forEach(k => { if (lower.includes(k)) easyScore++; });

  if (hardScore > 0 && hardScore >= easyScore) return 'Hard';
  if (easyScore > 0 && easyScore > hardScore) return 'Easy';
  return 'Medium';
}

function extractKeyTerms(topics, text) {
  const words = text
    .replace(/[^\w\s\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !/^(about|their|these|which|where|under|using|between|course|syllabus|topics|module|chapter)$/i.test(w));

  const freq = new Map();
  words.forEach(w => {
    const capitalized = w[0].toUpperCase() + w.slice(1).toLowerCase();
    freq.set(capitalized, (freq.get(capitalized) || 0) + 1);
  });

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

export function parseSyllabusText(rawText, subjectName = '') {
  if (!rawText || !rawText.trim()) {
    throw new Error('Syllabus text cannot be empty.');
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const units = [];

  // Regex pattern for Unit headers
  const unitHeaderRegex = /^(?:unit|module|chapter|part|section)\s*[-:–—\s]*([0-9ivxlcdm]+)\s*[:\-–—\.]*\s*(.*)$/i;

  let currentUnit = null;
  let currentBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(unitHeaderRegex);

    if (match) {
      if (currentUnit) {
        currentUnit.rawContent = currentBuffer.join('\n');
        units.push(currentUnit);
      }
      const unitNum = parseUnitNumber(match[1]) || (units.length + 1);
      const title = match[2]?.trim() || `Unit ${unitNum}: Core Topics`;
      currentUnit = {
        unitNumber: unitNum,
        title: title.length > 1 ? title : `Unit ${unitNum}`,
        rawContent: ''
      };
      currentBuffer = [];
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentUnit) {
    currentUnit.rawContent = currentBuffer.join('\n');
    units.push(currentUnit);
  }

  // Fallback: If no explicit Unit headers found, partition by headings or sections
  if (units.length === 0) {
    const totalLines = lines.length;
    const numPartitions = Math.min(5, Math.max(2, Math.ceil(totalLines / 8)));
    const chunkSize = Math.ceil(totalLines / numPartitions);

    const defaultUnitTitles = [
      'Foundations & Core Principles',
      'Structural Mechanisms & Models',
      'Algorithms & Applied Processes',
      'Advanced Concepts & Optimization',
      'System Integration & Case Studies'
    ];

    for (let p = 0; p < numPartitions; p++) {
      const chunk = lines.slice(p * chunkSize, (p + 1) * chunkSize);
      if (chunk.length === 0) continue;
      const firstLineClean = cleanLine(chunk[0]);
      const title = (firstLineClean.length > 5 && firstLineClean.length < 80)
        ? firstLineClean
        : defaultUnitTitles[p] || `Unit ${p + 1}`;

      units.push({
        unitNumber: p + 1,
        title,
        rawContent: chunk.join('\n')
      });
    }
  }

  // Refine each unit: extract topics, estimate hours, generate summary
  let totalTopics = 0;

  const refinedUnits = units.map((u, index) => {
    const contentLines = u.rawContent
      .split(/\r?\n/)
      .map(cleanLine)
      .filter(l => l.length > 2 && !/^unit\s+\d+/i.test(l));

    // Extract topics: from lines, or comma/semicolon splits
    let topics = [];
    contentLines.forEach(l => {
      if (l.includes(';') || (l.includes(',') && l.length > 60)) {
        const parts = l.split(/[;,]/).map(cleanLine).filter(p => p.length > 3);
        topics.push(...parts);
      } else {
        topics.push(l);
      }
    });

    // Deduplicate topics and limit
    topics = Array.from(new Set(topics)).filter(t => t.length > 3 && t.length < 150);
    if (topics.length === 0) {
      topics = [`Fundamental concepts of ${u.title}`, `Practical applications of ${u.title}`];
    }

    totalTopics += topics.length;

    // Estimate hours: approx 1.5 - 2 hours per topic (between 4h and 20h)
    const estimatedHours = Math.max(4, Math.min(24, Math.round(topics.length * 1.8)));
    const difficulty = assessDifficulty(u.title + ' ' + topics.join(' '));
    const keyTerms = extractKeyTerms(topics, u.title + ' ' + u.rawContent);

    // Summary generator
    const summary = `Covers ${topics.length} key topics focusing on ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? `, and related ${subjectName || 'course'} principles` : ''}. Recommended study effort: ~${estimatedHours} hours.`;

    return {
      unitNumber: u.unitNumber || (index + 1),
      title: u.title,
      estimatedHours,
      difficulty,
      topics,
      summary,
      keyTerms
    };
  });

  return {
    units: refinedUnits,
    totalUnits: refinedUnits.length,
    totalTopics
  };
}
