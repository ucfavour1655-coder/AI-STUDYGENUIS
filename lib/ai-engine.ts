import { QuizQuestion } from './types';

interface KnowledgeEntry {
  keywords: string[];
  topic: string;
  explanation: string;
  examples: string[];
}

const knowledgeBase: KnowledgeEntry[] = [
  {
    keywords: ['photosynthesis', 'photosynth'],
    topic: 'Photosynthesis',
    explanation: 'Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy (usually from the sun) into chemical energy stored in glucose. The general equation is: 6CO2 + 6H2O + light -> C6H12O6 + 6O2. This happens in the chloroplasts, specifically using the green pigment chlorophyll.',
    examples: [
      'A leaf placed in sunlight produces oxygen bubbles in water - that is photosynthesis in action.',
      'Without photosynthesis, the oxygen in our atmosphere would not exist.',
    ],
  },
  {
    keywords: ['pythagoras', 'pythagorean', 'theorem'],
    topic: 'Pythagorean Theorem',
    explanation: 'The Pythagorean Theorem states that in a right-angled triangle, the square of the hypotenuse (the side opposite the right angle) equals the sum of the squares of the other two sides. Formula: a^2 + b^2 = c^2, where c is the hypotenuse.',
    examples: [
      'If a = 3 and b = 4, then c^2 = 9 + 16 = 25, so c = 5.',
      'Used to find the distance between two points on a coordinate plane.',
    ],
  },
  {
    keywords: ['quadratic', 'equation', 'formula'],
    topic: 'Quadratic Equations',
    explanation: 'A quadratic equation has the form ax^2 + bx + c = 0, where a is not 0. The quadratic formula is x = (-b +/- sqrt(b^2 - 4ac)) / 2a. The discriminant (b^2 - 4ac) tells us about the roots: positive = two real roots, zero = one repeated root, negative = two complex roots.',
    examples: [
      'x^2 - 5x + 6 = 0 factors to (x-2)(x-3) = 0, so x = 2 or x = 3.',
      '2x^2 + 4x - 3 = 0: using the formula, x = (-4 +/- sqrt(16+24)) / 4 = (-4 +/- sqrt(40)) / 4.',
    ],
  },
  {
    keywords: ['cell', 'organelle', 'mitochondria', 'nucleus'],
    topic: 'Cell Structure',
    explanation: 'Cells are the basic unit of life. Key organelles include: the nucleus (contains DNA, controls the cell), mitochondria (produce energy via respiration), ribosomes (protein synthesis), endoplasmic reticulum (transport), Golgi apparatus (packaging), and the cell membrane (controls what enters and leaves).',
    examples: [
      'Mitochondria are often called the "powerhouse of the cell" because they generate ATP.',
      'Plant cells have a cell wall and chloroplasts that animal cells lack.',
    ],
  },
  {
    keywords: ['newton', 'force', 'motion', 'inertia'],
    topic: "Newton's Laws of Motion",
    explanation: "Newton's three laws: 1) An object at rest stays at rest, and an object in motion stays in motion unless acted on by an unbalanced force (inertia). 2) Force = mass x acceleration (F = ma). 3) For every action, there is an equal and opposite reaction.",
    examples: [
      'A book on a table stays still because the forces are balanced (1st law).',
      'A heavier object requires more force to accelerate at the same rate (2nd law).',
      'When you jump off a boat, the boat moves backward (3rd law).',
    ],
  },
  {
    keywords: ['grammar', 'noun', 'verb', 'adjective'],
    topic: 'Parts of Speech',
    explanation: 'The main parts of speech in English: nouns (names of people, places, things), verbs (actions or states of being), adjectives (describe nouns), adverbs (describe verbs/adjectives), pronouns (replace nouns), prepositions (show relationships), conjunctions (connect words/clauses), and interjections (express emotions).',
    examples: [
      'In "The quick brown fox jumps", "fox" is a noun, "quick" and "brown" are adjectives, "jumps" is a verb.',
      '"She ran quickly" - "she" is a pronoun, "ran" is a verb, "quickly" is an adverb.',
    ],
  },
  {
    keywords: ['world war', 'ww1', 'ww2', 'hitler'],
    topic: 'World Wars',
    explanation: 'World War I (1914-1918) was triggered by the assassination of Archduke Franz Ferdinand, involving the Allies (UK, France, Russia, later USA) vs the Central Powers (Germany, Austria-Hungary, Ottoman Empire). World War II (1939-1945) was triggered by Germany\'s invasion of Poland, involving the Allies vs the Axis Powers (Germany, Italy, Japan).',
    examples: [
      'WWI ended with the Treaty of Versailles, which heavily penalized Germany.',
      'WWII ended after the atomic bombings of Hiroshima and Nagasaki in 1945.',
    ],
  },
  {
    keywords: ['supply', 'demand', 'market', 'economics'],
    topic: 'Supply and Demand',
    explanation: 'Supply and demand are fundamental economic concepts. The law of demand: as price increases, quantity demanded decreases. The law of supply: as price increases, quantity supplied increases. Market equilibrium occurs where supply equals demand, determining the market price.',
    examples: [
      'If coffee prices rise, consumers may buy less (demand decreases).',
      'If coffee prices rise, producers may grow more (supply increases).',
    ],
  },
  {
    keywords: ['algorithm', 'programming', 'code', 'sorting'],
    topic: 'Algorithms',
    explanation: 'An algorithm is a step-by-step procedure for solving a problem. Common types include sorting algorithms (bubble sort, merge sort, quicksort - which arrange data in order), search algorithms (linear search, binary search - which find elements), and graph algorithms (BFS, DFS - which traverse networks). Efficiency is measured in Big O notation.',
    examples: [
      'Binary search on a sorted array of 1 million items takes only ~20 steps (log2(10^6) is about 20).',
      'Bubble sort has O(n^2) complexity, while merge sort has O(n log n).',
    ],
  },
  {
    keywords: ['water cycle', 'evaporation', 'condensation', 'precipitation'],
    topic: 'The Water Cycle',
    explanation: 'The water cycle describes how water moves through Earth\'s systems: evaporation (water turns to vapor from oceans/lakes), condensation (vapor forms clouds), precipitation (rain/snow falls), collection (water gathers in bodies of water), and the cycle repeats. This process is driven by solar energy.',
    examples: [
      'A puddle drying up on a sunny day is evaporation.',
      'Clouds forming on a humid day are condensation.',
    ],
  },
];

function findRelevantKnowledge(query: string): KnowledgeEntry | null {
  const lower = query.toLowerCase();
  for (const entry of knowledgeBase) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry;
    }
  }
  return null;
}

export function generateTutorResponse(question: string, level: string = 'secondary'): string {
  const entry = findRelevantKnowledge(question);
  if (entry) {
    const levelIntro =
      level === 'primary'
        ? "Let me explain this in a simple way! "
        : level === 'university'
        ? "Here's a rigorous explanation: "
        : "Great question! ";

    const explanation = `${levelIntro}${entry.explanation}\n\nExamples:\n${entry.examples
      .map((e, i) => `${i + 1}. ${e}`)
      .join('\n')}`;

    return explanation;
  }

  if (question.toLowerCase().includes('solve') || question.match(/\d+\s*[+\-*/]\s*\d+/)) {
    return solveMathProblem(question);
  }

  return `That's an interesting question! While I don't have a specific pre-built explanation for that exact topic, here's how I'd approach it:

1. **Break it down**: Identify the key concepts involved.
2. **Find connections**: Relate it to things you already know.
3. **Look for examples**: Real-world examples make abstract concepts concrete.

Could you tell me more about what specific aspect you'd like me to explain? I can help with Mathematics, Science, English, History, Economics, Computer Science, and many other subjects.`;
}

export function solveMathProblem(problem: string): string {
  const match = problem.match(/(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)/);
  if (!match) {
    return "I can help solve math problems! Try asking me something like 'solve 25 + 17' or 'what is 144 divided by 12?'";
  }

  const a = parseFloat(match[1]);
  const op = match[2];
  const b = parseFloat(match[3]);
  let result: number;
  let steps: string;

  switch (op) {
    case '+':
      result = a + b;
      steps = `Step 1: Add ${a} + ${b}\nStep 2: ${a} + ${b} = ${result}`;
      break;
    case '-':
      result = a - b;
      steps = `Step 1: Subtract ${b} from ${a}\nStep 2: ${a} - ${b} = ${result}`;
      break;
    case '*':
      result = a * b;
      steps = `Step 1: Multiply ${a} x ${b}\nStep 2: ${a} x ${b} = ${result}`;
      break;
    case '/':
      if (b === 0) return 'Cannot divide by zero! Division by zero is undefined in mathematics.';
      result = a / b;
      steps = `Step 1: Divide ${a} / ${b}\nStep 2: ${a} / ${b} = ${result}`;
      break;
    default:
      return 'Could not parse the math problem.';
  }

  return `Let me solve this step by step:\n\n${steps}\n\nThe answer is **${result}**.`;
}

export function generateHomeworkHelp(question: string, level: string = 'secondary'): string {
  const entry = findRelevantKnowledge(question);
  if (entry) {
    return `Here's a step-by-step explanation:\n\n**${entry.topic}**\n\n${entry.explanation}\n\nStep-by-step breakdown:\n${entry.examples
      .map((e, i) => `Step ${i + 1}: ${e}`)
      .join('\n')}\n\nWould you like me to explain this more simply, or give you a practice question?`;
  }

  if (question.match(/\d+\s*[+\-*/]\s*\d+/)) {
    return solveMathProblem(question);
  }

  return `I'd be happy to help with your homework! Here's my approach:\n\n1. **Understand the question**: What exactly is being asked?\n2. **Identify key concepts**: What principles or formulas apply?\n3. **Work through it**: Apply the concepts step by step.\n4. **Verify**: Check if your answer makes sense.\n\nCould you share more details about the specific problem? You can also type a math problem like "solve 15 x 24" and I'll work it out for you.`;
}

export function generateQuiz(
  subjectName: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  numQuestions: number = 5
): QuizQuestion[] {
  const subjectLower = subjectName.toLowerCase();

  const quizBank: Record<string, QuizQuestion[]> = {
    mathematics: [
      { type: 'multiple_choice', question: 'What is the value of x in 2x + 6 = 14?', options: ['2', '4', '6', '8'], correct_answer: '4', explanation: '2x + 6 = 14 -> 2x = 8 -> x = 4' },
      { type: 'true_false', question: 'The square root of 144 is 12.', correct_answer: 'True', explanation: '12 x 12 = 144, so sqrt(144) = 12.' },
      { type: 'fill_blank', question: 'The area of a rectangle is length x ____.', correct_answer: 'width', explanation: 'Area of a rectangle = length x width (or breadth).' },
      { type: 'multiple_choice', question: 'What is 15% of 200?', options: ['15', '30', '45', '60'], correct_answer: '30', explanation: '15% of 200 = 0.15 x 200 = 30.' },
      { type: 'short_answer', question: 'Solve: 3(x - 4) = 15. What is x?', correct_answer: '9', explanation: '3x - 12 = 15 -> 3x = 27 -> x = 9.' },
      { type: 'multiple_choice', question: 'What is the Pythagorean theorem?', options: ['a + b = c', 'a^2 + b^2 = c^2', 'a^3 + b^3 = c^3', 'a x b = c'], correct_answer: 'a^2 + b^2 = c^2', explanation: 'In a right triangle, a^2 + b^2 = c^2 where c is the hypotenuse.' },
      { type: 'true_false', question: '0 is a natural number.', correct_answer: 'False', explanation: 'Natural numbers start from 1. Zero is a whole number but not a natural number.' },
    ],
    english: [
      { type: 'multiple_choice', question: 'Which word is a noun in: "The cat sat on the mat"?', options: ['sat', 'on', 'cat', 'the'], correct_answer: 'cat', explanation: '"Cat" is a noun - it names a thing. "Sat" is a verb.' },
      { type: 'true_false', question: '"Quickly" is an adverb.', correct_answer: 'True', explanation: '"Quickly" modifies a verb (describes how an action is done), so it is an adverb.' },
      { type: 'fill_blank', question: 'A word that describes a noun is called a(n) ____.', correct_answer: 'adjective', explanation: 'Adjectives describe or modify nouns, e.g., "beautiful flower".' },
      { type: 'multiple_choice', question: 'What is the past tense of "go"?', options: ['goed', 'went', 'gone', 'going'], correct_answer: 'went', explanation: '"Go" is an irregular verb: go -> went -> gone.' },
      { type: 'short_answer', question: 'What is a simile? Give an example.', correct_answer: 'A comparison using "like" or "as", e.g., "as brave as a lion"', explanation: 'A simile compares two things using "like" or "as".' },
    ],
    science: [
      { type: 'multiple_choice', question: 'What gas do plants absorb for photosynthesis?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correct_answer: 'Carbon dioxide', explanation: 'Plants absorb CO2 and release O2 during photosynthesis.' },
      { type: 'true_false', question: 'The sun is a star.', correct_answer: 'True', explanation: 'The sun is a medium-sized star at the center of our solar system.' },
      { type: 'fill_blank', question: 'Water boils at ____ degrees Celsius at sea level.', correct_answer: '100', explanation: 'Water boils at 100 degrees C (212 F) at standard atmospheric pressure.' },
      { type: 'multiple_choice', question: 'What is the chemical symbol for water?', options: ['CO2', 'H2O', 'O2', 'NaCl'], correct_answer: 'H2O', explanation: 'Water is made of two hydrogen atoms and one oxygen atom: H2O.' },
      { type: 'short_answer', question: 'Name the three states of matter.', correct_answer: 'Solid, liquid, gas', explanation: 'The three primary states of matter are solid, liquid, and gas.' },
    ],
    biology: [
      { type: 'multiple_choice', question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'], correct_answer: 'Mitochondria', explanation: 'Mitochondria produce ATP, the energy currency of the cell.' },
      { type: 'true_false', question: 'DNA stands for Deoxyribonucleic Acid.', correct_answer: 'True', explanation: 'DNA = Deoxyribonucleic Acid, the molecule that carries genetic information.' },
      { type: 'fill_blank', question: 'The process by which plants make food is called ____.', correct_answer: 'photosynthesis', explanation: 'Photosynthesis converts light energy into chemical energy (glucose).' },
      { type: 'multiple_choice', question: 'Which blood cells fight infections?', options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'], correct_answer: 'White blood cells', explanation: 'White blood cells (leukocytes) are part of the immune system.' },
    ],
    chemistry: [
      { type: 'multiple_choice', question: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correct_answer: '6', explanation: 'Carbon has 6 protons, giving it atomic number 6.' },
      { type: 'true_false', question: 'Salt is a compound made of sodium and chlorine.', correct_answer: 'True', explanation: 'NaCl (table salt) is made of sodium (Na) and chlorine (Cl).' },
      { type: 'fill_blank', question: 'The pH of a neutral solution is ____.', correct_answer: '7', explanation: 'pH 7 is neutral. Below 7 is acidic, above 7 is basic.' },
      { type: 'multiple_choice', question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correct_answer: 'Nitrogen', explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere.' },
    ],
    physics: [
      { type: 'multiple_choice', question: 'What is the SI unit of force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], correct_answer: 'Newton', explanation: 'Force is measured in Newtons (N). 1N = 1 kg*m/s^2.' },
      { type: 'true_false', question: 'Light travels faster than sound.', correct_answer: 'True', explanation: 'Light: ~300,000 km/s. Sound: ~343 m/s in air.' },
      { type: 'fill_blank', question: 'Force = mass x ____.', correct_answer: 'acceleration', explanation: "Newton's second law: F = ma." },
      { type: 'multiple_choice', question: 'What type of energy does a moving object have?', options: ['Potential', 'Kinetic', 'Thermal', 'Chemical'], correct_answer: 'Kinetic', explanation: 'Kinetic energy = 1/2 mv^2, the energy of motion.' },
    ],
    history: [
      { type: 'multiple_choice', question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct_answer: '1945', explanation: 'WWII ended in 1945 with Japan\'s surrender in September.' },
      { type: 'true_false', question: 'The Berlin Wall fell in 1989.', correct_answer: 'True', explanation: 'The Berlin Wall fell on November 9, 1989.' },
      { type: 'fill_blank', question: 'The first president of the United States was ____.', correct_answer: 'George Washington', explanation: 'George Washington served as the first U.S. president from 1789-1797.' },
      { type: 'multiple_choice', question: 'Which civilization built the pyramids of Giza?', options: ['Romans', 'Greeks', 'Egyptians', 'Mayans'], correct_answer: 'Egyptians', explanation: 'The ancient Egyptians built the pyramids around 2580-2560 BC.' },
    ],
    geography: [
      { type: 'multiple_choice', question: 'What is the largest continent by area?', options: ['Africa', 'Asia', 'North America', 'Europe'], correct_answer: 'Asia', explanation: 'Asia is the largest continent, covering about 44.6 million km^2.' },
      { type: 'true_false', question: 'The Nile is the longest river in the world.', correct_answer: 'True', explanation: 'The Nile is approximately 6,650 km long.' },
      { type: 'fill_blank', question: 'The capital of Japan is ____.', correct_answer: 'Tokyo', explanation: 'Tokyo is the capital and largest city of Japan.' },
      { type: 'multiple_choice', question: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct_answer: 'Pacific', explanation: 'The Pacific Ocean is the largest and deepest ocean.' },
    ],
    economics: [
      { type: 'multiple_choice', question: 'What happens to demand when price increases (ceteris paribus)?', options: ['Increases', 'Decreases', 'Stays the same', 'Doubles'], correct_answer: 'Decreases', explanation: 'Law of demand: price and quantity demanded are inversely related.' },
      { type: 'true_false', question: 'GDP stands for Gross Domestic Product.', correct_answer: 'True', explanation: 'GDP measures the total value of goods and services produced in a country.' },
      { type: 'fill_blank', question: 'The market price is determined where supply equals ____.', correct_answer: 'demand', explanation: 'Market equilibrium occurs at the intersection of supply and demand.' },
    ],
    'computer science': [
      { type: 'multiple_choice', question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Process Utility', 'Core Processing Unit'], correct_answer: 'Central Processing Unit', explanation: 'The CPU is the "brain" of the computer that executes instructions.' },
      { type: 'true_false', question: 'Binary code uses only 0 and 1.', correct_answer: 'True', explanation: 'Binary is a base-2 number system using only 0 and 1.' },
      { type: 'fill_blank', question: 'A loop that repeats forever is called a(n) ____ loop.', correct_answer: 'infinite', explanation: 'An infinite loop has no terminating condition.' },
      { type: 'multiple_choice', question: 'Which data structure uses LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Array', 'Tree'], correct_answer: 'Stack', explanation: 'A stack adds and removes from the top - last element in is first out.' },
    ],
  };

  let pool = quizBank[subjectLower] || quizBank.mathematics;

  if (difficulty === 'hard') {
    pool = pool.filter((q) => q.type === 'short_answer' || q.type === 'fill_blank');
    if (pool.length < 3) pool = quizBank[subjectLower] || quizBank.mathematics;
  } else if (difficulty === 'easy') {
    pool = pool.filter((q) => q.type === 'multiple_choice' || q.type === 'true_false');
    if (pool.length < 3) pool = quizBank[subjectLower] || quizBank.mathematics;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(numQuestions, shuffled.length));
}

export function generateFlashcards(subjectName: string): { front: string; back: string }[] {
  const subjectLower = subjectName.toLowerCase();

  const cardBank: Record<string, { front: string; back: string }[]> = {
    mathematics: [
      { front: 'What is the formula for the area of a circle?', back: 'A = pi * r^2' },
      { front: 'What is the value of pi?', back: 'Approximately 3.14159' },
      { front: 'What is a prime number?', back: 'A number divisible only by 1 and itself (e.g., 2, 3, 5, 7, 11)' },
      { front: 'What is the quadratic formula?', back: 'x = (-b +/- sqrt(b^2 - 4ac)) / 2a' },
      { front: 'What is the derivative of x^2?', back: '2x' },
    ],
    biology: [
      { front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
      { front: 'What does DNA stand for?', back: 'Deoxyribonucleic Acid' },
      { front: 'What is photosynthesis?', back: 'Process where plants convert light energy into chemical energy (glucose)' },
      { front: 'What are the four blood types?', back: 'A, B, AB, O' },
      { front: 'What is the basic unit of life?', back: 'The cell' },
    ],
    chemistry: [
      { front: 'What is the atomic number of hydrogen?', back: '1' },
      { front: 'What is H2O?', back: 'Water (two hydrogen atoms, one oxygen atom)' },
      { front: 'What is the pH of a neutral solution?', back: '7' },
      { front: 'What is the most abundant gas in the atmosphere?', back: 'Nitrogen (78%)' },
      { front: 'What is an exothermic reaction?', back: 'A reaction that releases energy (heat) to its surroundings' },
    ],
    physics: [
      { front: 'What is Newton\'s second law?', back: 'Force = mass x acceleration (F = ma)' },
      { front: 'What is the speed of light?', back: 'Approximately 300,000 km/s (3 x 10^8 m/s)' },
      { front: 'What is the SI unit of energy?', back: 'Joule (J)' },
      { front: 'What is kinetic energy?', back: 'Energy of motion: KE = 1/2 mv^2' },
      { front: 'What is Ohm\'s law?', back: 'V = IR (Voltage = Current x Resistance)' },
    ],
    english: [
      { front: 'What is a noun?', back: 'A word that names a person, place, thing, or idea' },
      { front: 'What is a verb?', back: 'A word that expresses an action or state of being' },
      { front: 'What is an adjective?', back: 'A word that describes or modifies a noun' },
      { front: 'What is a simile?', back: 'A comparison using "like" or "as" (e.g., "as brave as a lion")' },
      { front: 'What is alliteration?', back: 'Repetition of the same initial consonant sound (e.g., "Peter Piper picked")' },
    ],
    history: [
      { front: 'When did World War II end?', back: '1945' },
      { front: 'Who was the first US president?', back: 'George Washington (1789-1797)' },
      { front: 'When did the Berlin Wall fall?', back: 'November 9, 1989' },
      { front: 'What was the Renaissance?', back: 'A period of cultural rebirth in Europe (14th-17th century)' },
      { front: 'When did Nigeria gain independence?', back: 'October 1, 1960' },
    ],
    geography: [
      { front: 'What is the largest continent?', back: 'Asia' },
      { front: 'What is the longest river in the world?', back: 'The Nile (~6,650 km)' },
      { front: 'What is the capital of Japan?', back: 'Tokyo' },
      { front: 'What is the largest ocean?', back: 'The Pacific Ocean' },
      { front: 'What is the smallest country in the world?', back: 'Vatican City' },
    ],
  };

  return cardBank[subjectLower] || cardBank.mathematics;
}

export function improveWriting(text: string): string {
  const improvements = text
    .replace(/\bi\b/g, 'I')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])(?=[A-Za-z])/g, '$1 ');

  const sentences = improvements.split(/(?<=[.!?])\s+/);
  const polished = sentences
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return polished;
}

export function summarizeText(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  if (sentences.length <= 2) return text;

  const wordFreq: Record<string, number> = {};
  sentences.forEach((s) => {
    s.toLowerCase()
      .split(/\W+/)
      .forEach((w) => {
        if (w.length > 3) wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
  });

  const scored = sentences.map((s, i) => {
    const words = s.toLowerCase().split(/\W+/);
    let score = 0;
    words.forEach((w) => {
      if (wordFreq[w]) score += wordFreq[w];
    });
    return { sentence: s, score: score / Math.sqrt(words.length), index: i };
  });

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, Math.ceil(sentences.length / 2)))
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return top.join(' ');
}

export function generateOutline(topic: string): string {
  return `Outline for: ${topic}

I. Introduction
   A. Definition and importance of ${topic}
   B. Key terms and concepts
   C. Thesis/main argument

II. Background
   A. Historical context
   B. Key developments
   C. Current understanding

III. Main Discussion
   A. Core principles
   B. Key arguments and evidence
   C. Counterarguments and rebuttals

IV. Applications and Examples
   A. Real-world examples
   B. Case studies
   C. Practical implications

V. Conclusion
   A. Summary of key points
   B. Final thoughts
   C. Recommendations for further study`;
}

export function generateStudyGuide(topic: string): string {
  const entry = findRelevantKnowledge(topic);
  const content = entry
    ? `Topic: ${entry.topic}

Key Concepts:
${entry.explanation}

Examples:
${entry.examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    : `Study Guide for: ${topic}

Key Concepts to Review:
1. Core definitions and terminology
2. Fundamental principles
3. Important formulas or rules
4. Common applications
5. Common mistakes to avoid

Practice Tips:
- Create flashcards for key terms
- Work through practice problems
- Explain the topic to someone else
- Review regularly for retention`;

  return content;
}

export const motivationalQuotes = [
  'The expert in anything was once a beginner. Keep studying!',
  'Success is the sum of small efforts repeated day in and day out.',
  'The more that you read, the more things you will know. The more you learn, the more places you\'ll go.',
  'Education is the most powerful weapon you can use to change the world.',
  'Don\'t watch the clock; do what it does. Keep going.',
  'The future belongs to those who prepare for it today.',
  'Knowledge is power. Information is liberating.',
  'Strive for progress, not perfection.',
  'Learning is never done. It continues until the day you die.',
  'The beautiful thing about learning is that no one can take it away from you.',
];

export function getDailyQuote(): string {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return motivationalQuotes[day % motivationalQuotes.length];
}

export const achievementDefinitions = [
  { badge_id: 'first_quiz', badge_name: 'First Quiz Completed', badge_icon: 'Award', condition: (stats: { quizzes: number }) => stats.quizzes >= 1 },
  { badge_id: 'quiz_master', badge_name: 'Quiz Master (10 quizzes)', badge_icon: 'Trophy', condition: (stats: { quizzes: number }) => stats.quizzes >= 10 },
  { badge_id: 'streak_3', badge_name: '3-Day Streak', badge_icon: 'Flame', condition: (stats: { streak: number }) => stats.streak >= 3 },
  { badge_id: 'streak_7', badge_name: '7-Day Streak', badge_icon: 'Flame', condition: (stats: { streak: number }) => stats.streak >= 7 },
  { badge_id: 'streak_30', badge_name: '30-Day Streak', badge_icon: 'Flame', condition: (stats: { streak: number }) => stats.streak >= 30 },
  { badge_id: 'notes_10', badge_name: 'Note Taker (10 notes)', badge_icon: 'BookMarked', condition: (stats: { notes: number }) => stats.notes >= 10 },
  { badge_id: 'flashcards_20', badge_name: 'Flashcard Pro (20 cards)', badge_icon: 'Layers', condition: (stats: { flashcards: number }) => stats.flashcards >= 20 },
  { badge_id: 'xp_100', badge_name: '100 XP Earned', badge_icon: 'Star', condition: (stats: { xp: number }) => stats.xp >= 100 },
  { badge_id: 'xp_500', badge_name: '500 XP Earned', badge_icon: 'Star', condition: (stats: { xp: number }) => stats.xp >= 500 },
  { badge_id: 'xp_1000', badge_name: '1000 XP Master', badge_icon: 'Crown', condition: (stats: { xp: number }) => stats.xp >= 1000 },
];

export function checkAchievements(stats: { quizzes: number; streak: number; notes: number; flashcards: number; xp: number }): string[] {
  return achievementDefinitions
    .filter((a) => a.condition(stats))
    .map((a) => a.badge_id);
}
