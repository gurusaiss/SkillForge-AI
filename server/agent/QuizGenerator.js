import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GeminiService from '../services/GeminiService.js';
import RuleBase from './RuleBase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TARGET_MCQ        = 7;
const TARGET_FIB        = 2;
const TARGET_SUBJECTIVE = 1;
const TARGET_TOTAL      = TARGET_MCQ + TARGET_FIB + TARGET_SUBJECTIVE; // 10

class QuizGenerator {
  constructor() {
    const questionsPath = join(__dirname, '../knowledge/questions.json');
    this.questions = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  }

  // ── STEP 1: Rule-based quiz (highest priority, no API call) ──────────────
  getRuleBasedQuiz(skillTree) {
    const domainId  = skillTree.domain || 'custom';
    const goalText  = skillTree.profile?.rawGoal || '';
    const questions = RuleBase.getQuiz(domainId, goalText);
    if (!questions || questions.length === 0) return null;

    console.log(`[QuizGenerator] ✅ Rule-base hit for domain "${domainId}" — ${questions.length} base questions`);
    const mcqs = questions.filter(q => q.type === 'multiple_choice' || !q.type)
      .slice(0, TARGET_MCQ)
      .map(q => ({ ...q, concept: q.concept || q.skillName, source: 'rule_base', type: 'multiple_choice' }));

    return mcqs.length >= TARGET_MCQ - 1 ? mcqs : null;
  }

  // ── STEP 2: LLM-powered quiz (7 MCQ + 2 FIB + 1 Subjective) ─────────────
  async generateWithLLM(skillTree) {
    const { profile, skills, domain } = skillTree;
    const domainLabel = skillTree.domainName || domain;
    const goalText    = profile?.rawGoal || domainLabel;
    const skillList   = skills.slice(0, 5).map((s, i) =>
      `${i + 1}. ${s.name} (id: ${s.id}, topics: ${(s.topics || []).slice(0, 3).join(', ')})`
    ).join('\n');

    const prompt = `You are an expert assessment designer. Create a comprehensive diagnostic quiz for someone who wants to: "${goalText}"

Domain: ${domainLabel}
Target skills:
${skillList}

Generate EXACTLY ${TARGET_TOTAL} questions in this exact breakdown:
- ${TARGET_MCQ} multiple-choice questions (type: "multiple_choice")
- ${TARGET_FIB} fill-in-the-blank questions (type: "fill_in_blank")
- ${TARGET_SUBJECTIVE} subjective/open-ended question (type: "subjective")

DOMAIN KNOWLEDGE EXAMPLES (correct style):
- Doctor/Medicine: "A patient presents with crushing chest pain, elevated troponin, and ST elevation in V1-V4. What is the diagnosis?"
- Lawyer/Law: "Under Section 300 IPC, what distinguishes murder from culpable homicide?"
- Chef/Cooking: "At what internal temperature is chicken considered safe to eat?"
- Engineer: "A simply-supported beam of 6m span carries 15 kN/m UDL. What is the maximum bending moment?"

MCQ difficulty order: q1=basic, q2=moderate, q3=advanced, q4=practical, q5=real_world, q6=application, q7=synthesis
FIB: q8=concept recall, q9=technical term
Subjective: q10=analytical reasoning

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "skillId": "exact_skill_id_from_list",
      "skillName": "Exact Skill Name",
      "concept": "Short concept name (≤6 words)",
      "difficulty": "basic",
      "type": "multiple_choice",
      "question": "A specific factual or scenario-based question using REAL ${domainLabel} terminology",
      "options": [
        "A) The correct answer",
        "B) A plausible but wrong answer",
        "C) A plausible but wrong answer",
        "D) A clearly wrong answer"
      ],
      "correct": "A) The correct answer",
      "explanation": "Detailed explanation using ${domainLabel} terminology.",
      "key_concepts": ["concept1", "concept2"],
      "score_keywords": ["keyword1", "keyword2"]
    },
    {
      "id": "q8",
      "skillId": "skill_id",
      "skillName": "Skill Name",
      "concept": "Concept Tested",
      "difficulty": "moderate",
      "type": "fill_in_blank",
      "question": "In ${domainLabel}, ________ refers to [description of the concept being tested].",
      "correct": "exact term or phrase that fills the blank",
      "acceptable_answers": ["exact term", "synonym or alternate phrasing"],
      "explanation": "Why this answer is correct.",
      "key_concepts": ["concept1"],
      "score_keywords": ["keyword1"]
    },
    {
      "id": "q10",
      "skillId": "skill_id",
      "skillName": "Skill Name",
      "concept": "Analytical Reasoning",
      "difficulty": "advanced",
      "type": "subjective",
      "question": "Explain [important concept in ${domainLabel}] and describe a real scenario where you would apply it. What are the key considerations?",
      "sample_good_answer": "A strong answer would cover: [key point 1], [key point 2], and [key point 3]...",
      "score_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "key_concepts": ["concept1", "concept2"],
      "explanation": "What a complete answer should address."
    }
  ]
}

CRITICAL RULES:
- ALL questions must test REAL DOMAIN KNOWLEDGE, not meta-learning ("why is X important to learn")
- Use real terminology from ${domainLabel}
- Wrong MCQ options must be plausible misconceptions
- Fill-in-blank: the blank must be a single specific term or short phrase; "acceptable_answers" should include common synonyms
- Subjective: open-ended, requires multi-sentence explanation; "sample_good_answer" must outline expected key points
- "correct" in MCQ must EXACTLY match one of the four option strings
- Return exactly ${TARGET_TOTAL} questions: ${TARGET_MCQ} MCQ, ${TARGET_FIB} fill_in_blank, ${TARGET_SUBJECTIVE} subjective`;

    try {
      const result = await GeminiService.generateJSON(prompt,
        `Expert quiz designer for ${domainLabel}. Return only valid JSON with exactly ${TARGET_TOTAL} questions.`);

      if (result?.questions?.length >= TARGET_TOTAL - 2) {
        const validated = result.questions
          .filter(q => q.question && q.type)
          .map((q, i) => ({
            ...q,
            id: q.id || `q${i + 1}`,
            concept: q.concept || q.skillName || 'Core Concept',
            source: 'llm',
            options: q.type === 'multiple_choice'
              ? (q.options || []).map(o => {
                  if (/^[A-D]\)/.test(o)) return o;
                  const label = ['A', 'B', 'C', 'D'][(q.options || []).indexOf(o)];
                  return `${label}) ${o}`;
                })
              : undefined,
          }));

        if (validated.length >= TARGET_TOTAL - 2) {
          console.log(`[QuizGenerator] LLM generated ${validated.length} questions for "${domainLabel}"`);
          return validated.slice(0, TARGET_TOTAL);
        }
      }
    } catch (err) {
      console.error('[QuizGenerator] LLM error:', err.message);
    }
    return null;
  }

  // ── STEP 3: Static bank (MCQ only) ────────────────────────────────────────
  getStaticMCQ(skill, profile) {
    const skillQuestions = this.questions[skill.id];
    if (!skillQuestions) return [];
    const levelQuestions = skillQuestions[skill.level] || skillQuestions['beginner'] || [];
    return levelQuestions
      .filter(q => q.type === 'multiple_choice')
      .sort((a, b) => this._scoreRelevance(b, skill, profile) - this._scoreRelevance(a, skill, profile))
      .slice(0, 1)
      .map((q, i) => ({
        ...q,
        id: `${q.id}_${skill.id}_${i + 1}`,
        skillId: skill.id,
        skillName: skill.name,
        concept: q.concept || (q.key_concepts?.[0]) || skill.name,
        source: 'static',
        type: 'multiple_choice',
      }));
  }

  _scoreRelevance(question, skill, profile) {
    const text = [question.question, ...(question.key_concepts || [])].join(' ').toLowerCase();
    let score = 0;
    for (const kw of profile?.focusKeywords || []) {
      if (text.includes(kw)) score += kw.length > 5 ? 3 : 2;
    }
    for (const tool of profile?.detectedTools || []) {
      if (text.includes(tool)) score += 4;
    }
    return score;
  }

  // ── STEP 4: Fallback MCQ generator ───────────────────────────────────────
  buildFallbackMCQ(skill, topicIndex = 0) {
    const topics = skill.topics || [];
    const t  = topics[topicIndex % topics.length] || skill.name;
    const t2 = topics[(topicIndex + 1) % Math.max(topics.length, 1)] || 'practical application';
    const t3 = topics[(topicIndex + 2) % Math.max(topics.length, 1)] || 'core concepts';
    const t4 = topics[(topicIndex + 3) % Math.max(topics.length, 1)] || 'advanced techniques';
    const domain = skill.name;

    const DIFFICULTIES = ['basic', 'moderate', 'advanced', 'practical', 'real_world', 'application', 'synthesis'];
    const templateId = topicIndex % 6;

    const templates = [
      {
        question: `Which description best captures what "${t}" involves in ${domain}?`,
        options: [
          `A) "${t}" covers the core principles and techniques that directly enable practical work in ${domain}`,
          `B) "${t}" is a supplementary concept only relevant after completing ${t4}`,
          `C) "${t}" and "${t3}" are interchangeable terms for the same technique`,
          `D) "${t}" is an outdated approach replaced entirely by ${t2} in modern ${domain}`,
        ],
        correct: `A) "${t}" covers the core principles and techniques that directly enable practical work in ${domain}`,
        explanation: `"${t}" is a key component of ${domain} that practitioners apply regularly. It is distinct from, and often prerequisite to, "${t2}".`,
      },
      {
        question: `In a real ${domain} scenario, when would a practitioner specifically apply "${t}"?`,
        options: [
          `A) When working on tasks that require ${domain} knowledge of "${t}" to get correct, consistent results`,
          `B) Only in academic settings — "${t}" has no practical application outside theory`,
          `C) Only once "${t4}" has been fully mastered`,
          `D) As a last resort when "${t2}" and "${t3}" have both failed`,
        ],
        correct: `A) When working on tasks that require ${domain} knowledge of "${t}" to get correct, consistent results`,
        explanation: `In ${domain}, "${t}" is applied in real-world work. Skipping it leads to errors in tasks that depend on it.`,
      },
      {
        question: `A student learning ${domain} is struggling with "${t2}". What is the most likely root cause?`,
        options: [
          `A) They have not yet mastered "${t}" — it is a prerequisite that "${t2}" builds directly upon`,
          `B) "${t2}" is too advanced for anyone without a degree in ${domain}`,
          `C) They should skip "${t2}" entirely and move directly to "${t4}"`,
          `D) The problem is unrelated to prior knowledge — "${t2}" stands alone`,
        ],
        correct: `A) They have not yet mastered "${t}" — it is a prerequisite that "${t2}" builds directly upon`,
        explanation: `In ${domain}, topics are scaffolded: "${t}" must be solid before "${t2}" makes sense.`,
      },
      {
        question: `What is the most common mistake beginners make regarding "${t}" in ${domain}?`,
        options: [
          `A) Treating "${t}" as optional or theoretical, instead of practising it hands-on in real ${domain} tasks`,
          `B) Spending too much time on "${t}" when they should move straight to ${t4}`,
          `C) Learning "${t}" before understanding "${t3}", which is its direct prerequisite`,
          `D) Applying "${t}" in professional settings before completing academic study`,
        ],
        correct: `A) Treating "${t}" as optional or theoretical, instead of practising it hands-on in real ${domain} tasks`,
        explanation: `Without hands-on practice, "${t}" remains abstract and fails to transfer to real tasks.`,
      },
      {
        question: `A ${domain} practitioner needs to complete a task involving "${t}". Which approach is correct?`,
        options: [
          `A) Apply "${t}" systematically using established ${domain} principles, then verify against "${t2}"`,
          `B) Skip "${t}" and use "${t3}" instead — they produce the same outcome`,
          `C) Delegate any task involving "${t}" until "${t4}" has been studied`,
          `D) Rely on intuition rather than structured knowledge of "${t}"`,
        ],
        correct: `A) Apply "${t}" systematically using established ${domain} principles, then verify against "${t2}"`,
        explanation: `In professional ${domain} work, "${t}" must be applied systematically, not through guesswork.`,
      },
      {
        question: `Which outcome best demonstrates that a ${domain} learner has genuinely mastered "${t}"?`,
        options: [
          `A) They can apply "${t}" correctly in unfamiliar ${domain} scenarios and explain the reasoning behind each step`,
          `B) They can recite the definition of "${t}" from memory`,
          `C) They have completed a course that listed "${t}" in its syllabus`,
          `D) They can identify "${t}" when prompted but cannot yet use it independently`,
        ],
        correct: `A) They can apply "${t}" correctly in unfamiliar ${domain} scenarios and explain the reasoning behind each step`,
        explanation: `True mastery means transfer — applying "${t}" correctly in new, unseen situations.`,
      },
    ];

    const tpl = templates[templateId];
    return {
      id: `q_${skill.id}_mcq_${topicIndex}`,
      skillId: skill.id,
      skillName: skill.name,
      concept: t,
      difficulty: DIFFICULTIES[topicIndex % DIFFICULTIES.length],
      question: tpl.question,
      type: 'multiple_choice',
      options: tpl.options,
      correct: tpl.correct,
      explanation: tpl.explanation,
      key_concepts: [t, skill.name],
      score_keywords: [t],
      source: 'fallback',
    };
  }

  // ── Fallback FIB generator ────────────────────────────────────────────────
  buildFallbackFIB(skill, topicIndex = 0) {
    const topics = skill.topics || [];
    const t = topics[topicIndex % topics.length] || skill.name;
    const domain = skill.name;

    return {
      id: `q_${skill.id}_fib_${topicIndex}`,
      skillId: skill.id,
      skillName: skill.name,
      concept: t,
      difficulty: 'moderate',
      type: 'fill_in_blank',
      question: `In ${domain}, ________ is the term used to describe the foundational concept of "${t}" that practitioners must master before advancing to related topics.`,
      correct: t,
      acceptable_answers: [t.toLowerCase(), t],
      explanation: `"${t}" is a core building block of ${domain}. Understanding it precisely enables correct application in practice.`,
      key_concepts: [t, domain],
      score_keywords: [t.toLowerCase()],
      source: 'fallback',
    };
  }

  // ── Fallback Subjective generator ─────────────────────────────────────────
  buildFallbackSubjective(skill) {
    const topics = skill.topics || [];
    const t  = topics[0] || skill.name;
    const t2 = topics[1] || 'practical application';
    const domain = skill.name;

    return {
      id: `q_${skill.id}_subj_0`,
      skillId: skill.id,
      skillName: skill.name,
      concept: 'Analytical Reasoning',
      difficulty: 'advanced',
      type: 'subjective',
      question: `Explain the role of "${t}" in ${domain} and describe a real-world scenario where you would apply it. What are the key considerations and potential pitfalls a practitioner should be aware of?`,
      sample_good_answer: `A strong answer would cover: (1) a clear definition of "${t}" in the context of ${domain}, (2) a specific realistic scenario demonstrating its application, (3) identification of at least two key considerations such as prerequisites or common errors, and (4) how it relates to "${t2}".`,
      score_keywords: [t.toLowerCase(), domain.toLowerCase(), 'scenario', 'application', 'practitioner'],
      key_concepts: [t, domain],
      explanation: `Subjective questions assess depth of understanding and ability to connect theory to practice in ${domain}.`,
      source: 'fallback',
    };
  }

  // ── Main entry: Rule-base → LLM → Static → Fallback ─────────────────────
  async generate(skillTree) {
    const profile = skillTree.profile || {};

    // Step 1: Rule-base (fast, no API)
    const ruleQuestions = this.getRuleBasedQuiz(skillTree);
    if (ruleQuestions && ruleQuestions.length >= TARGET_MCQ - 1) {
      const mcqs = ruleQuestions.slice(0, TARGET_MCQ);
      const fibs  = this._buildFallbackFIBSet(skillTree);
      const subj  = [this.buildFallbackSubjective(skillTree.skills[0])];
      return [...mcqs, ...fibs, ...subj].slice(0, TARGET_TOTAL);
    }

    // Step 2: LLM for unknown domains
    if (GeminiService.isEnabled()) {
      const llmQuestions = await this.generateWithLLM(skillTree);
      if (llmQuestions && llmQuestions.length >= TARGET_TOTAL - 3) {
        return this._ensureExactlyN(llmQuestions, skillTree);
      }
    }

    // Step 3: Static bank + generated fallback
    const diagnosticQuestions = [];

    // Collect MCQs from static bank
    for (const skill of skillTree.skills) {
      const staticMCQ = this.getStaticMCQ(skill, profile);
      diagnosticQuestions.push(...staticMCQ.slice(0, 1));
      if (diagnosticQuestions.length >= TARGET_MCQ) break;
    }

    // Fill remaining MCQs with fallback
    let skillIndex = 0;
    let topicIndex = 0;
    while (diagnosticQuestions.filter(q => q.type === 'multiple_choice').length < TARGET_MCQ) {
      const skill = skillTree.skills[skillIndex % skillTree.skills.length];
      diagnosticQuestions.push(this.buildFallbackMCQ(skill, topicIndex));
      skillIndex++;
      topicIndex++;
    }

    // Add FIB questions
    const fibs = this._buildFallbackFIBSet(skillTree);
    diagnosticQuestions.push(...fibs);

    // Add subjective question
    const subj = this.buildFallbackSubjective(skillTree.skills[0] || { id: 'general', name: skillTree.domainName || 'the subject', topics: [] });
    diagnosticQuestions.push(subj);

    return diagnosticQuestions.slice(0, TARGET_TOTAL);
  }

  // Builds exactly TARGET_FIB fill-in-blank questions
  _buildFallbackFIBSet(skillTree) {
    const fibs = [];
    for (let i = 0; i < TARGET_FIB; i++) {
      const skill = skillTree.skills[i % skillTree.skills.length];
      fibs.push(this.buildFallbackFIB(skill, i));
    }
    return fibs;
  }

  // ── Knowledge Quiz: exactly 5 MCQ (initial pre-assessment) ──────────────
  async generateKnowledgeQuiz(skillTree) {
    const KQ_COUNT = 5;

    // Step 1: Rule-base
    const ruleQuestions = this.getRuleBasedQuiz(skillTree);
    if (ruleQuestions && ruleQuestions.length >= KQ_COUNT) {
      return ruleQuestions.slice(0, KQ_COUNT);
    }

    // Step 2: LLM — 5 MCQ only
    if (GeminiService.isEnabled()) {
      const { profile, skills, domain } = skillTree;
      const domainLabel = skillTree.domainName || domain;
      const goalText    = profile?.rawGoal || domainLabel;
      const skillList   = skills.slice(0, 5).map((s, i) =>
        `${i + 1}. ${s.name} (topics: ${(s.topics || []).slice(0, 3).join(', ')})`
      ).join('\n');

      const prompt = `You are an expert assessment designer. Create a quick knowledge pre-check for someone who wants to: "${goalText}"

Domain: ${domainLabel}
Target skills:
${skillList}

Generate EXACTLY 5 multiple-choice questions (type: "multiple_choice") covering a range of difficulty.
Difficulty order: q1=basic, q2=basic, q3=moderate, q4=practical, q5=advanced

Rules:
- ALL questions must test REAL DOMAIN KNOWLEDGE using real ${domainLabel} terminology
- Wrong options must be plausible misconceptions
- "correct" must EXACTLY match one of the four option strings

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "skillId": "skill_id",
      "skillName": "Skill Name",
      "concept": "Short concept name (max 6 words)",
      "difficulty": "basic",
      "type": "multiple_choice",
      "question": "A specific factual or scenario-based question",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A) ...",
      "explanation": "Why this answer is correct.",
      "key_concepts": ["concept1"],
      "score_keywords": ["keyword1"]
    }
  ]
}`;

      try {
        const result = await GeminiService.generateJSON(prompt,
          `Expert quiz designer for ${domainLabel}. Return only valid JSON with exactly 5 MCQ questions.`);

        if (result?.questions?.length >= KQ_COUNT - 1) {
          const validated = result.questions
            .filter(q => q.question && q.type === 'multiple_choice')
            .map((q, i) => ({
              ...q,
              id: q.id || `kq${i + 1}`,
              concept: q.concept || q.skillName || 'Core Concept',
              source: 'llm',
              options: (q.options || []).map(o => {
                if (/^[A-D]\)/.test(o)) return o;
                const label = ['A', 'B', 'C', 'D'][(q.options || []).indexOf(o)];
                return `${label}) ${o}`;
              }),
            }));

          if (validated.length >= KQ_COUNT - 1) {
            console.log(`[QuizGenerator] KnowledgeQuiz: LLM generated ${validated.length} MCQ for "${domainLabel}"`);
            return validated.slice(0, KQ_COUNT);
          }
        }
      } catch (err) {
        console.error('[QuizGenerator] KnowledgeQuiz LLM error:', err.message);
      }
    }

    // Step 3: Fallback — generate 5 MCQs from static bank + fallback
    const questions = [];
    for (const skill of skillTree.skills) {
      const staticMCQ = this.getStaticMCQ(skill, skillTree.profile || {});
      questions.push(...staticMCQ.slice(0, 1));
      if (questions.length >= KQ_COUNT) break;
    }
    let idx = 0;
    while (questions.length < KQ_COUNT) {
      const skill = skillTree.skills[idx % skillTree.skills.length];
      questions.push(this.buildFallbackMCQ(skill, idx));
      idx++;
    }
    console.log(`[QuizGenerator] KnowledgeQuiz: fallback generated ${questions.length} MCQ`);
    return questions.slice(0, KQ_COUNT);
  }

  // Ensures exactly TARGET_TOTAL questions with correct type distribution
  _ensureExactlyN(questions, skillTree) {
    const mcqs  = questions.filter(q => q.type === 'multiple_choice').slice(0, TARGET_MCQ);
    const fibs  = questions.filter(q => q.type === 'fill_in_blank').slice(0, TARGET_FIB);
    const subjs = questions.filter(q => q.type === 'subjective').slice(0, TARGET_SUBJECTIVE);

    // Pad MCQs if short
    let idx = 0;
    while (mcqs.length < TARGET_MCQ) {
      const skill = skillTree.skills[idx % skillTree.skills.length];
      mcqs.push(this.buildFallbackMCQ(skill, mcqs.length + idx));
      idx++;
    }

    // Pad FIBs if short
    idx = 0;
    while (fibs.length < TARGET_FIB) {
      const skill = skillTree.skills[idx % skillTree.skills.length];
      fibs.push(this.buildFallbackFIB(skill, fibs.length + idx));
      idx++;
    }

    // Pad Subjective if missing
    if (subjs.length < TARGET_SUBJECTIVE) {
      subjs.push(this.buildFallbackSubjective(skillTree.skills[0]));
    }

    return [...mcqs, ...fibs, ...subjs];
  }
}

export default QuizGenerator;
