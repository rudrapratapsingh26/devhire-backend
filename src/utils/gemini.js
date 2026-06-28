import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const scoreResume = async (resumeText, jobDescription) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `You are an expert HR recruiter. Score the following resume against the job description.

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
}`,
      },
    ],
    temperature: 0.3,
  });

  const text = completion.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

export const generateCoverLetter = async (
  resumeText,
  jobDescription,
  companyName
) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `Write a professional cover letter for this candidate applying to ${companyName}.

Job Description:
${jobDescription}

Resume:
${resumeText}

Write a concise, professional cover letter in 3 paragraphs. No placeholders.`,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
};
