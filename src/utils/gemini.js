import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const scoreResume = async (resumeText, jobDescription) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are an expert HR recruiter. Score the following resume against the job description.

Job Description:
${jobDescription}

Resume:
${resumeText}

Respond ONLY with a JSON object in this exact format, no extra text:
{
  "score": <number between 0 and 100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "summary": "2-3 sentence summary of the candidate fit"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

export const generateCoverLetter = async (
  resumeText,
  jobDescription,
  companyName
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Write a professional cover letter for this candidate applying to ${companyName}.

Job Description:
${jobDescription}

Resume:
${resumeText}

Write a concise, professional cover letter in 3 paragraphs. No placeholders.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};
