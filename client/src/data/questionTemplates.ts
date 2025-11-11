import type { QuestionTemplate } from "@/types/questionTemplate";

export const DEFAULT_QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: "fill-single-gap",
    label: "Single sentence gap-fill",
    description: "Learners supply one word to complete the sentence.",
    skills: ["Reading"],
    types: ["fill_blank"],
    content:
      `Complete the sentence with ONE word.\n\n` +
      `"Studying online has completely ___ the way students access information."`,
    correctAnswers: ["changed"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "fill-paragraph",
    label: "Short paragraph with two blanks",
    description: "Two blanks focusing on vocabulary and grammar.",
    skills: ["Reading"],
    types: ["fill_blank"],
    content:
      `Fill in the TWO blanks with the correct words.\n\n` +
      `"During the interview, Minh stayed ___ even when the questions became ___."`,
    correctAnswers: ["calm", "difficult"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "writing-email",
    label: "Writing - informal email",
    description: "Prompt for a friendly email (120-150 words).",
    skills: ["Writing"],
    types: ["writing_prompt"],
    content:
      `You recently spent a weekend at your friend's house in Da Nang.\n` +
      `Write an email to thank them. Include:\n` +
      `- what you enjoyed most\n` +
      `- something funny that happened\n` +
      `- an invitation for them to visit you soon\n\n` +
      `Write 120-150 words.`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "writing-opinion",
    label: "Writing - opinion essay",
    description: "Structured opinion piece with reasons and examples.",
    skills: ["Writing"],
    types: ["writing_prompt"],
    content:
      `Many people believe that teenagers should have a part-time job while studying.\n` +
      `Do you agree or disagree?\n\n` +
      `Write an essay explaining your opinion. Include:\n` +
      `- at least two reasons for your view\n` +
      `- examples or experiences to support each reason\n` +
      `- a short conclusion with a recommendation\n\n` +
      `Write 180-220 words.`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "reading-purpose-single",
    label: "Reading - identify the writer's purpose",
    description: "Short email that checks overall understanding of why it was written.",
    skills: ["Reading"],
    types: ["mcq_single"],
    content:
      `Read the email and choose the best answer.\n\n` +
      `Email:\n` +
      `"Hi team,\n` +
      `Thanks for staying late this week. On Friday we will finish the app demo and I will order dinner for everyone.\n` +
      `Please send me your food preferences by tomorrow afternoon.\n` +
      `- Linh"\n\n` +
      `What is the main purpose of the email?`,
    options: [
      "A. To apologize for a late project",
      "B. To invite the team to a weekend trip",
      "C. To thank the team and collect dinner orders",
      "D. To cancel the demo presentation",
    ],
    correctAnswers: ["C. To thank the team and collect dinner orders"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "reading-supporting-reasons",
    label: "Reading - select two supporting reasons",
    description: "Paragraph about student clubs with multiple correct answers.",
    skills: ["Reading"],
    types: ["mcq_multi"],
    content:
      `Read the paragraph. Choose TWO statements that are supported by the text.\n\n` +
      `Paragraph:\n` +
      `"The new debate club at Horizon College has doubled in size this semester. Members meet twice a week to prepare for national competitions. Because of the club, many shy students say they now feel confident speaking in front of others."\n`,
    options: [
      "A. Membership in the debate club is growing quickly.",
      "B. Meetings happen once a month when competitions are near.",
      "C. Parents organize special training sessions for the team.",
      "D. Joining the club makes travel mandatory for everyone.",
      "E. Students have become more confident due to the club.",
    ],
    correctAnswers: [
      "A. Membership in the debate club is growing quickly.",
      "E. Students have become more confident due to the club.",
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "listening-announcement-single",
    label: "Listening - transport announcement",
    description: "Use with an uploaded audio clip; focuses on gist and key fact.",
    skills: ["Listening"],
    types: ["mcq_single"],
    content:
      `Listen to the station announcement (attach the audio via the media picker).\n` +
      `Question: Why is Train 82 delayed?\n` +
      `Choose ONE answer.`,
    options: [
      "A. The driver has not arrived",
      "B. The weather has damaged the tracks",
      "C. Maintenance crews are checking a signal problem",
      "D. There are too many passengers boarding",
    ],
    correctAnswers: ["C. Maintenance crews are checking a signal problem"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "listening-conversation-details",
    label: "Listening - select two details",
    description: "Conversation between two students planning a group project.",
    skills: ["Listening"],
    types: ["mcq_multi"],
    content:
      `You will hear two classmates discuss their group project schedule.\n` +
      `After listening, choose TWO statements that are correct.`,
    options: [
      "A. They decide to meet online on Tuesday evening.",
      "B. The presentation will cover renewable energy.",
      "C. Khanh is responsible for creating the slides.",
      "D. The meeting place is the library study room.",
      "E. They still need approval from their lecturer.",
    ],
    correctAnswers: [
      "A. They decide to meet online on Tuesday evening.",
      "C. Khanh is responsible for creating the slides.",
    ],
    createdAt: new Date().toISOString(),
  },
];
