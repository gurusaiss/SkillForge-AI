import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GeminiService from '../services/GeminiService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class ChallengeEngine {
  constructor() {
    this.challenges = JSON.parse(readFileSync(join(__dirname, '../knowledge/challenges.json'), 'utf-8'));
  }

  // ── Gemini-powered: domain-specific challenge + MCQ warm-up ─────────────
  async generateWithLLM(planDay, session) {
    const goal = session?.goal?.goalText || planDay.skillName;
    const domain = session?.goal?.domainLabel || planDay.skillId;
    const topic = planDay.topic || planDay.skillName;
    const skillName = planDay.skillName || planDay.skillId;
    const sessionType = planDay.sessionType || 'practice';
    const recentWeaknesses = session?.sessions?.slice(-3).flatMap(s => s.weaknesses || []).slice(0, 3) || [];

    const prompt = `You are creating a learning session for someone who wants to: "${goal}"
Domain: ${domain}
Current skill: ${skillName}
Today's topic: ${topic}
Session type: ${sessionType}
${recentWeaknesses.length ? `Recent weak spots to address: ${recentWeaknesses.join(', ')}` : ''}

Return ONLY valid JSON:
{
  "id": "ch_${planDay.skillId}_day${planDay.day}",
  "title": "Specific, engaging challenge title about ${topic}",
  "description": "2-3 sentence real-world scenario. Name actual ${domain} tools/techniques/materials. Example: 'You are working on a client's formal dress and need to apply darts to the bodice...'",
  "type": "${sessionType}",
  "conceptSummary": {
    "title": "Short concept title (2-5 words) for ${topic}",
    "definition": "Clear 1-2 sentence definition of ${topic} in the context of ${domain}",
    "keyPoints": [
      "Key point 1 — a foundational fact about ${topic}",
      "Key point 2 — how it is applied in ${domain}",
      "Key point 3 — a common mistake or misconception",
      "Key point 4 — why mastering this matters"
    ],
    "example": "A concrete real-world example showing ${topic} in action in ${domain}",
    "proTip": "One actionable pro tip that experts use when dealing with ${topic}"
  },
  "hints": [
    "Domain-specific hint 1 about ${topic}",
    "Domain-specific hint 2",
    "Domain-specific hint 3"
  ],
  "evaluation_criteria": [
    "specific criterion 1 for ${topic}",
    "specific criterion 2",
    "specific criterion 3",
    "specific criterion 4"
  ],
  "model_solution": "2-3 sentences describing what an expert ${domain} response looks like for ${topic}.",
  "warmupQuestion": {
    "question": "A specific MCQ question about ${topic} in ${domain}?",
    "options": [
      "A) correct or plausible option",
      "B) plausible but wrong option",
      "C) plausible but wrong option",
      "D) clearly wrong option"
    ],
    "correct": "A) correct or plausible option",
    "explanation": "Why this answer is correct."
  },
  "assessment": {
    "topic": "${topic}",
    "questions": [
      {
        "id": "a1",
        "type": "multiple_choice",
        "question": "Specific MCQ about ${topic}?",
        "options": ["A) correct option", "B) wrong option", "C) wrong option", "D) wrong option"],
        "correct": "A) correct option",
        "explanation": "Why this answer is correct."
      },
      {
        "id": "a8",
        "type": "fill_in_blank",
        "question": "In ${domain}, ________ is the term most directly related to ${topic}.",
        "correct": "${topic}",
        "acceptable_answers": ["${topic}", "${topic.toLowerCase()}"],
        "explanation": "Why this term is correct."
      },
      {
        "id": "a10",
        "type": "subjective",
        "question": "Explain how you would apply ${topic} in a real ${domain} scenario. Include reasoning and one example.",
        "sample_good_answer": "A strong answer explains the concept, applies it to a realistic scenario, and names common mistakes.",
        "score_keywords": ["${topic.toLowerCase()}", "${domain.toLowerCase()}", "example", "reasoning"],
        "explanation": "What a complete answer should include."
      }
    ]
  }
}

IMPORTANT:
- Everything must be 100% specific to "${domain}" — NOT generic
- Use real ${domain} terminology (e.g. for tailoring: seam ripper, grain line, basting stitch, ease)
- The warmupQuestion must have EXACTLY 4 options labeled A) B) C) D)
- No generic phrases like "core concept" or "fundamental principle"
- conceptSummary must be beginner-friendly, clear, and domain-specific`;

    try {
      const result = await GeminiService.generateJSON(prompt,
        `You are an expert ${domain} instructor. Generate domain-specific, practical content. Return only valid JSON.`);

      if (result?.title && result?.description) {
        console.log(`[ChallengeEngine] Gemini challenge for Day ${planDay.day}: "${result.title}"`);
        return { ...result, source: 'llm' };
      }
    } catch (err) {
      console.error('[ChallengeEngine] Gemini error:', err.message);
    }
    return null;
  }

  personalizeChallenge(challenge, planDay, session) {
    const roleContext = session?.goal?.profile?.targetRole ? ` for your ${session.goal.profile.targetRole} path` : '';
    const weakSignal = session?.sessions?.length
      ? session.sessions.slice(-3).flatMap((entry) => entry.weaknesses || []).slice(0, 2).join(' ')
      : '';

    return {
      ...challenge,
      source: 'static',
      title: `${challenge.title}${roleContext}`,
      description: `${challenge.description} Focus especially on ${planDay.topic}.${weakSignal ? ` Recent weak spots: ${weakSignal}.` : ''}`,
      hints: [
        ...(challenge.hints || []),
        `Tie your answer back to ${planDay.topic}.`,
        session?.goal?.profile?.detectedTools?.length
          ? `Use examples with ${session.goal.profile.detectedTools.slice(0, 2).join(' and ')} if relevant.`
          : 'Use one practical, real-world example.',
      ].slice(0, 5),
      evaluation_criteria: [...new Set([...(challenge.evaluation_criteria || []), planDay.topic, (planDay.skillName || '').toLowerCase()])],
      model_solution: `${challenge.model_solution} A strong response should feel relevant to ${session?.goal?.profile?.targetRole || planDay.skillName}.`,
    };
  }

  buildDynamicChallenge(planDay, session) {
    const topic = planDay.topic || planDay.skillName;
    const skillName = planDay.skillName || planDay.skillId;
    const goal = session?.goal?.goalText || skillName;
    const role = session?.goal?.profile?.targetRole;
    const roleContext = role ? ` for your ${role} path` : '';
    const domain = session?.goal?.domainLabel || skillName;
    const sessionType = planDay.sessionType || 'practice';

    const recentWeaknesses = session?.sessions
      ?.slice(-3).flatMap((s) => s.weaknesses || []).slice(0, 2) || [];

    const challengeTemplates = {
      concept: {
        title: `Explain ${topic} — ${skillName}${roleContext}`,
        description: `In your own words, explain "${topic}" and how it is used in ${skillName}. Cover: what it is, why it matters, and a concrete real-world scenario where you would apply it.`,
        hints: [
          `Define "${topic}" clearly before diving into examples.`,
          `Think of a real ${domain} scenario where "${topic}" comes up.`,
          `Connect "${topic}" back to the bigger picture of ${skillName}.`,
        ],
      },
      practice: {
        title: `Apply ${topic} in a ${skillName} project${roleContext}`,
        description: `You are working on a ${domain} project that requires ${skillName}. Specifically, you need to handle "${topic}". Describe your step-by-step approach.`,
        hints: [
          `Start by identifying what "${topic}" requires in this context.`,
          `Walk through your approach step-by-step.`,
          `Mention any common mistakes to avoid.`,
        ],
      },
      review: {
        title: `Review & reinforce ${topic}${roleContext}`,
        description: `Review your understanding of "${topic}" in ${skillName} by explaining it clearly. What are the most common mistakes? How do you avoid them?`,
        hints: [
          `Think about what confused you when first learning "${topic}".`,
          `Give at least one practical do/don't example.`,
          `Explain the mental model that makes "${topic}" click.`,
        ],
      },
    };

    const template = challengeTemplates[sessionType] || challengeTemplates.practice;
    const weaknessHint = recentWeaknesses.length
      ? `Pay special attention to: ${recentWeaknesses.join(', ')}.`
      : null;

    return {
      id: planDay.challengeId || `ch_${planDay.skillId}_day${planDay.day}`,
      day_range: [planDay.day, planDay.day],
      type: sessionType,
      source: 'dynamic',
      title: template.title,
      description: `${template.description}${weaknessHint ? ` ${weaknessHint}` : ''}`,
      hints: [...template.hints, ...(weaknessHint ? [weaknessHint] : [])].slice(0, 4),
      evaluation_criteria: [
        `understanding of ${topic}`,
        `practical application in ${skillName}`,
        'clear reasoning and examples',
        'connection to real use cases',
      ],
      model_solution: `A strong response defines "${topic}", shows how it applies in ${skillName} with a concrete example, and explains the reasoning clearly.`,
      conceptSummary: {
        title: topic,
        definition: `${topic} is an important concept in ${skillName} that involves understanding and applying its core principles within ${domain} contexts.`,
        keyPoints: [
          `${topic} is foundational to mastering ${skillName} — it underpins many advanced techniques.`,
          `In ${domain}, ${topic} is commonly applied when working on real-world tasks and projects.`,
          `A common mistake is treating ${topic} as purely theoretical — hands-on practice is essential.`,
          `Mastering ${topic} will directly improve your confidence and output quality in ${domain}.`,
        ],
        example: `In a real ${domain} scenario, you would encounter ${topic} when building or working on a project that requires ${skillName}. Understanding it lets you make better decisions and avoid common pitfalls.`,
        proTip: `Always connect ${topic} to a concrete use case before diving into theory. Asking "where would I use this today?" makes it stick much faster.`,
      },
    };
  }

  normalizeAssessmentQuestion(question, index, planDay, session) {
    const topic = planDay.topic || planDay.skillName || 'today\'s topic';
    const type = question.type === 'fib' ? 'fill_in_blank' : question.type;
    const options = type === 'multiple_choice'
      ? (question.options || []).map((option, optionIndex) => {
          if (/^[A-D]\)/.test(option)) return option;
          return `${['A', 'B', 'C', 'D'][optionIndex] || optionIndex + 1}) ${option}`;
        })
      : undefined;
    const correct = question.correct || (options?.[0]);
    const acceptableAnswers = type === 'fill_in_blank'
      ? (question.acceptable_answers || [correct, String(correct).toLowerCase()].filter(Boolean))
      : undefined;

    return {
      ...question,
      id: question.id || `a${index + 1}`,
      type,
      skillId: planDay.skillId,
      skillName: planDay.skillName || session?.goal?.domainLabel || 'Skill',
      concept: question.concept || topic,
      difficulty: question.difficulty || (index < 3 ? 'basic' : index < 7 ? 'moderate' : 'advanced'),
      question: question.question,
      options,
      correct,
      acceptable_answers: acceptableAnswers,
      explanation: question.explanation || question.sample_good_answer || '',
      score_keywords: question.score_keywords || [String(topic).toLowerCase(), String(planDay.skillName || '').toLowerCase()],
      source: question.source || 'generated',
    };
  }

  buildAssessmentFallback(planDay, session) {
    const topic = planDay.topic || planDay.skillName || 'today\'s topic';
    const skillName = planDay.skillName || planDay.skillId || 'the skill';
    const domain = session?.goal?.domainLabel || skillName;
    const topicLower = String(topic).toLowerCase();
    const idBase = `assessment_${planDay.skillId}_day${planDay.day}`;

    const mcqTemplates = [
      {
        question: `Which statement best describes "${topic}" in ${skillName}?`,
        options: [
          `A) "${topic}" is the specific practice or concept used to complete relevant ${skillName} work correctly`,
          `B) "${topic}" is unrelated to ${skillName} and only matters in theory`,
          `C) "${topic}" should be skipped until every advanced technique is mastered`,
          `D) "${topic}" has only one meaning and never changes by project context`,
        ],
        correct: `A) "${topic}" is the specific practice or concept used to complete relevant ${skillName} work correctly`,
        explanation: `"${topic}" is the focus of this session, so the correct answer connects it directly to practical ${skillName} work.`,
      },
      {
        question: `In a real ${domain} project, when would you apply "${topic}"?`,
        options: [
          `A) When the task requires decisions, steps, or quality checks connected to ${topic}`,
          `B) Only after the project is finished and no changes can be made`,
          `C) When avoiding documentation and examples is the goal`,
          `D) Only when the client asks for unrelated background information`,
        ],
        correct: `A) When the task requires decisions, steps, or quality checks connected to ${topic}`,
        explanation: `Practitioners apply ${topic} during active work where it affects decisions and outcomes.`,
      },
      {
        question: `What is the most common beginner mistake with "${topic}"?`,
        options: [
          `A) Treating ${topic} as optional instead of applying it systematically`,
          `B) Practising ${topic} too early in the learning journey`,
          `C) Using too many real-world examples`,
          `D) Connecting ${topic} to the current project goal`,
        ],
        correct: `A) Treating ${topic} as optional instead of applying it systematically`,
        explanation: `Beginners often underestimate ${topic} and skip structured application.`,
      },
      {
        question: `Which outcome best proves that a learner understands "${topic}"?`,
        options: [
          `A) They can explain it, apply it to a new scenario, and avoid common mistakes`,
          `B) They can only repeat the word ${topic} from memory`,
          `C) They avoid using examples because examples make answers longer`,
          `D) They complete work without checking whether ${topic} was applied correctly`,
        ],
        correct: `A) They can explain it, apply it to a new scenario, and avoid common mistakes`,
        explanation: `Understanding transfers when the learner can reason and apply ${topic} beyond memorization.`,
      },
      {
        question: `How should "${topic}" be connected to quality in ${skillName}?`,
        options: [
          `A) It should guide choices that improve accuracy, consistency, and usefulness`,
          `B) It should be ignored once the first draft is complete`,
          `C) It should only appear in the final paragraph of a project`,
          `D) It should be replaced with generic advice whenever possible`,
        ],
        correct: `A) It should guide choices that improve accuracy, consistency, and usefulness`,
        explanation: `Quality improves when ${topic} is used deliberately to guide work.`,
      },
      {
        question: `Which sequence is best when using "${topic}" in a project?`,
        options: [
          `A) Understand the requirement, apply ${topic}, check the result, then refine`,
          `B) Guess first, apply randomly, then avoid reviewing the outcome`,
          `C) Skip the requirement, copy a template, and submit without checking`,
          `D) Focus only on formatting and ignore ${topic} completely`,
        ],
        correct: `A) Understand the requirement, apply ${topic}, check the result, then refine`,
        explanation: `A reliable workflow applies ${topic} intentionally and verifies the result.`,
      },
      {
        question: `Why does "${topic}" matter for the specific topic of this session?`,
        options: [
          `A) Because it is the day's focus and directly supports the learning objective`,
          `B) Because it is a decorative label with no effect on performance`,
          `C) Because it should be replaced with a different topic every time`,
          `D) Because it only matters after the entire course is complete`,
        ],
        correct: `A) Because it is the day's focus and directly supports the learning objective`,
        explanation: `Today's assessment is built around ${topic}, so it directly measures the session objective.`,
      },
    ];

    const mcqs = mcqTemplates.map((template, index) => ({
      id: `${idBase}_mcq_${index + 1}`,
      skillId: planDay.skillId,
      skillName,
      concept: topic,
      difficulty: ['basic', 'basic', 'moderate', 'moderate', 'practical', 'application', 'synthesis'][index],
      type: 'multiple_choice',
      ...template,
      key_concepts: [topic],
      score_keywords: [topicLower, skillName.toLowerCase()],
      source: 'fallback',
    }));

    const fibs = [
      {
        id: `${idBase}_fib_1`,
        skillId: planDay.skillId,
        skillName,
        concept: topic,
        difficulty: 'moderate',
        type: 'fill_in_blank',
        question: `In ${skillName}, ________ is the key focus connected to ${topic}.`,
        correct: topic,
        acceptable_answers: [topic, topicLower],
        explanation: `"${topic}" is the exact focus of this session.`,
        key_concepts: [topic],
        score_keywords: [topicLower],
        source: 'fallback',
      },
      {
        id: `${idBase}_fib_2`,
        skillId: planDay.skillId,
        skillName,
        concept: topic,
        difficulty: 'moderate',
        type: 'fill_in_blank',
        question: `A strong answer about ${topic} should include clear reasoning and at least one practical ________.`,
        correct: 'example',
        acceptable_answers: ['example', 'examples', 'scenario', 'scenarios'],
        explanation: `Practical examples show that the learner can apply ${topic}, not just define it.`,
        key_concepts: [topic, 'example'],
        score_keywords: ['example', topicLower],
        source: 'fallback',
      },
    ];

    const subjective = {
      id: `${idBase}_subjective_1`,
      skillId: planDay.skillId,
      skillName,
      concept: topic,
      difficulty: 'advanced',
      type: 'subjective',
      question: `Explain how you would apply "${topic}" in a real ${skillName} project. Include your steps, reasoning, one example, and one common mistake to avoid.`,
      sample_good_answer: `A strong answer defines ${topic}, explains why it matters in ${skillName}, gives a realistic scenario, lists clear steps, and identifies a common mistake such as skipping verification or treating ${topic} as optional.`,
      score_keywords: [topicLower, skillName.toLowerCase(), 'steps', 'reasoning', 'example', 'mistake'],
      key_concepts: [topic, 'application', 'reasoning'],
      explanation: `Subjective answers are scored for definition, practical application, reasoning, example quality, and awareness of mistakes.`,
      source: 'fallback',
    };

    return {
      topic,
      questions: [...mcqs, ...fibs, subjective],
    };
  }

  ensureAssessment(challenge, planDay, session) {
    const sourceQuestions = challenge?.assessment?.questions || [];
    const mcqs = sourceQuestions.filter((q) => q.type === 'multiple_choice' && (q.options || []).length >= 4 && q.correct);
    const fibs = sourceQuestions.filter((q) => q.type === 'fill_in_blank' && q.correct);
    const subjs = sourceQuestions.filter((q) => q.type === 'subjective' && q.question);

    if (mcqs.length >= 7 && fibs.length >= 2 && subjs.length >= 1) {
      const questions = [...mcqs.slice(0, 7), ...fibs.slice(0, 2), ...subjs.slice(0, 1)]
        .map((question, index) => this.normalizeAssessmentQuestion(question, index, planDay, session));
      challenge.assessment = {
        topic: planDay.topic || planDay.skillName || 'today\'s topic',
        questions,
      };
      return challenge;
    }

    challenge.assessment = this.buildAssessmentFallback(planDay, session);
    return challenge;
  }

  // ── Main entry ───────────────────────────────────────────────────────────
  async getChallengeForDay(planDay, session = null) {
    // 1. Try Gemini for domain-specific challenge
    if (GeminiService.isEnabled()) {
      const llmChallenge = await this.generateWithLLM(planDay, session);
      if (llmChallenge) return this.ensureAssessment(llmChallenge, planDay, session);
    }

    // 2. Try static knowledge bank
    const options = this.challenges[planDay.skillId] || [];
    const challenge = options.find((entry) => entry.id === planDay.challengeId)
      || options.find((entry) => {
        const [start, end] = entry.day_range || [planDay.day, planDay.day];
        return planDay.day >= start && planDay.day <= end;
      })
      || options[0];

    if (challenge) {
      return this.ensureAssessment(this.personalizeChallenge(challenge, planDay, session), planDay, session);
    }

    // 3. Dynamic fallback
    return this.ensureAssessment(this.buildDynamicChallenge(planDay, session), planDay, session);
  }
}

export default ChallengeEngine;
