import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ExtractedTopic {
  mainTopic: string;
  subtopics: string[];
  description: string;
}

export interface ExtractedQuestion {
  questionText: string;
  questionNumber: string;
  topicMatch: string;
  subtopicMatch?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks?: number;
  hasVectorDiagram: boolean;
}

export async function extractTopicsFromSyllabus(
  syllabusContent: string,
  subject: string
): Promise<ExtractedTopic[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in O-Level ${subject} curriculum analysis. Extract main topics and subtopics from the provided syllabus content. Return a JSON array of topics with mainTopic, subtopics (array), and description fields.`
        },
        {
          role: "user",
          content: `Extract all main topics and their subtopics from this O-Level ${subject} syllabus:\n\n${syllabusContent}\n\nReturn as JSON array with format: [{"mainTopic": "string", "subtopics": ["string"], "description": "string"}]`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.topics || [];
  } catch (error) {
    throw new Error(`Failed to extract topics from syllabus: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function categorizeQuestions(
  questionContent: string,
  availableTopics: ExtractedTopic[],
  subject: string
): Promise<ExtractedQuestion[]> {
  try {
    const topicsContext = availableTopics.map(t => 
      `${t.mainTopic}: ${t.subtopics.join(', ')}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in O-Level ${subject} question analysis. Categorize questions from past papers according to the provided topics. For each question, determine the topic match, difficulty level, and whether it contains vector diagrams.`
        },
        {
          role: "user",
          content: `Analyze these O-Level ${subject} questions and categorize them according to these topics:\n\n${topicsContext}\n\nQuestions to analyze:\n${questionContent}\n\nReturn JSON array with format: [{"questionText": "string", "questionNumber": "string", "topicMatch": "string", "subtopicMatch": "string", "difficulty": "easy|medium|hard", "marks": number, "hasVectorDiagram": boolean}]`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    throw new Error(`Failed to categorize questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeImageForDiagrams(base64Image: string): Promise<{
  hasVectorDiagram: boolean;
  diagramType?: string;
  description?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image to determine if it contains vector diagrams commonly found in O-Level science papers (physics force diagrams, electric field diagrams, etc.). Return JSON with hasVectorDiagram (boolean), diagramType (string), and description (string)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      hasVectorDiagram: result.hasVectorDiagram || false,
      diagramType: result.diagramType,
      description: result.description
    };
  } catch (error) {
    throw new Error(`Failed to analyze image for diagrams: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractQuestionMetadata(
  questionText: string
): Promise<{
  paperYear?: string;
  paperSession?: string;
  questionNumber?: string;
  marks?: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Extract metadata from O-Level past paper questions including year, session (June/November), question number, and marks allocation."
        },
        {
          role: "user",
          content: `Extract metadata from this question text: "${questionText}"\n\nReturn JSON with paperYear, paperSession, questionNumber, and marks fields.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      paperYear: result.paperYear,
      paperSession: result.paperSession?.toLowerCase(),
      questionNumber: result.questionNumber,
      marks: result.marks ? parseInt(result.marks) : undefined
    };
  } catch (error) {
    console.error(`Failed to extract question metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}
