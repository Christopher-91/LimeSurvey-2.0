import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root or server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LimeSurvey Database Seeding...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@limesurvey.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminFullName = process.env.ADMIN_FULL_NAME || 'LimeSurvey Administrator';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // 1. Seed or update the initial Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      fullName: adminFullName,
      role: 'admin',
      isActive: true,
    },
    create: {
      username: adminUsername,
      email: adminEmail,
      fullName: adminFullName,
      password: passwordHash,
      role: 'admin',
      isActive: true,
    },
  });

  console.log(`✅ Admin user seeded: ${adminUser.email} (Username: ${adminUser.username})`);

  // 2. Global Platform Settings
  const defaultSettings = [
    { key: 'sitename', value: 'LimeSurvey Modern', description: 'Application title displayed on navigation' },
    { key: 'defaulttheme', value: 'Sea_Green', description: 'Default administrative theme' },
    { key: 'defaultlang', value: 'en', description: 'Default system language' },
    { key: 'show_survey_list', value: 'show', description: 'Display active surveys on landing page' },
    { key: 'allow_registration', value: 'yes', description: 'Allow participants to self-register' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log(`✅ Default system settings verified (${defaultSettings.length} keys).`);

  // 3. Seed an initial sample survey if no surveys exist yet
  const surveyCount = await prisma.survey.count();
  if (surveyCount === 0) {
    console.log('Creating initial demonstration survey...');

    const demoSurvey = await prisma.survey.create({
      data: {
        title: 'Customer Satisfaction & Platform Feedback',
        description: 'Thank you for participating in our survey. Your answers help us enhance your experience.',
        welcomeMessage: 'Welcome! Please take a few moments to provide your candid feedback.',
        endMessage: 'Thank you for completing the survey! Your responses have been securely recorded.',
        adminEmail: adminUser.email,
        adminName: adminUser.fullName,
        active: true,
        format: 'all_in_one',
        ownerId: adminUser.id,
      },
    });

    const demoGroup = await prisma.questionGroup.create({
      data: {
        surveyId: demoSurvey.id,
        name: 'General Information & Experience',
        description: 'Questions regarding your initial experience and satisfaction.',
        sortOrder: 1,
      },
    });

    await prisma.question.create({
      data: {
        surveyId: demoSurvey.id,
        groupId: demoGroup.id,
        code: 'SATISFACTION',
        text: 'How satisfied are you overall with the platform performance and usability?',
        type: 'single_choice',
        mandatory: true,
        sortOrder: 1,
        options: {
          create: [
            { code: 'A1', text: 'Very Satisfied', sortOrder: 1, assessmentValue: 5 },
            { code: 'A2', text: 'Somewhat Satisfied', sortOrder: 2, assessmentValue: 4 },
            { code: 'A3', text: 'Neutral', sortOrder: 3, assessmentValue: 3 },
            { code: 'A4', text: 'Somewhat Dissatisfied', sortOrder: 4, assessmentValue: 2 },
            { code: 'A5', text: 'Very Dissatisfied', sortOrder: 5, assessmentValue: 1 },
          ],
        },
      },
    });

    await prisma.question.create({
      data: {
        surveyId: demoSurvey.id,
        groupId: demoGroup.id,
        code: 'FEATURES_USED',
        text: 'Which primary features do you use on a daily basis?',
        type: 'multiple_choice',
        mandatory: false,
        sortOrder: 2,
        options: {
          create: [
            { code: 'OPT1', text: 'Survey Builder & Question Types', sortOrder: 1 },
            { code: 'OPT2', text: 'Participant & Voter Management', sortOrder: 2 },
            { code: 'OPT3', text: 'Real-time Response Analytics', sortOrder: 3 },
            { code: 'OPT4', text: 'Excel and CSV Data Exports', sortOrder: 4 },
          ],
        },
      },
    });

    await prisma.question.create({
      data: {
        surveyId: demoSurvey.id,
        groupId: demoGroup.id,
        code: 'RATING_NPS',
        text: 'How likely are you to recommend LimeSurvey to a friend or colleague? (1 to 5 Stars)',
        type: 'rating',
        mandatory: true,
        sortOrder: 3,
      },
    });

    await prisma.question.create({
      data: {
        surveyId: demoSurvey.id,
        groupId: demoGroup.id,
        code: 'WOULD_RECOMMEND',
        text: 'Would you like to participate in future product interviews?',
        type: 'yes_no',
        mandatory: false,
        sortOrder: 4,
      },
    });

    await prisma.question.create({
      data: {
        surveyId: demoSurvey.id,
        groupId: demoGroup.id,
        code: 'FEEDBACK_TEXT',
        text: 'What is one thing we could do to make this platform even better for you?',
        type: 'long_text',
        mandatory: false,
        sortOrder: 5,
      },
    });

    // Seed a sample voter with access token
    const sampleVoter = await prisma.voter.create({
      data: {
        surveyId: demoSurvey.id,
        voterId: 'VOTER-1001',
        token: 'VOTE-DEMO-2026',
        email: 'voter.demo@example.com',
        firstName: 'Alex',
        lastName: 'Taylor',
        usesLeft: 1,
        completed: false,
      },
    });

    console.log(`✅ Demo survey created (ID: ${demoSurvey.id}) with voter token: "${sampleVoter.token}"`);
  }

  // 4. Seed an official Zero Knowledge Protocol survey if none exists yet
  const zkSurveyCount = await prisma.survey.count({
    where: { zeroKnowledgeEnabled: true },
  });

  if (zkSurveyCount === 0) {
    console.log('🔒 Creating Zero Knowledge Protocol demonstration survey...');

    const zkSurvey = await prisma.survey.create({
      data: {
        title: 'Executive 360 & Leadership Review (Secret Ballot)',
        description: 'Annual anonymous executive review. Enforces strict secret-ballot privacy decoupling voter profiles from comments.',
        welcomeMessage: 'Welcome to the confidential 360 review. Zero Knowledge Protocol is active on this questionnaire.',
        endMessage: 'Thank you for your candid feedback. Your secret ballot has been decoupled from your voter token.',
        adminEmail: adminUser.email,
        adminName: adminUser.fullName,
        active: true,
        zeroKnowledgeEnabled: true,
        format: 'all_in_one',
        ownerId: adminUser.id,
      },
    });

    const zkGroup = await prisma.questionGroup.create({
      data: {
        surveyId: zkSurvey.id,
        name: 'Confidential Leadership Feedback',
        description: 'Anonymous evaluations and feedback.',
        sortOrder: 1,
      },
    });

    await prisma.question.create({
      data: {
        surveyId: zkSurvey.id,
        groupId: zkGroup.id,
        code: 'LEADERSHIP_ALIGNMENT',
        text: 'How effectively does executive leadership communicate company strategy?',
        type: 'single_choice',
        mandatory: true,
        sortOrder: 1,
        options: {
          create: [
            { code: 'STRONGLY_ALIGNED', text: 'Strongly Aligned & Clear', sortOrder: 1 },
            { code: 'SOMEWHAT_ALIGNED', text: 'Somewhat Aligned', sortOrder: 2 },
            { code: 'NEUTRAL', text: 'Neutral / Adequate', sortOrder: 3 },
            { code: 'MISALIGNED', text: 'Needs Significant Improvement', sortOrder: 4 },
          ],
        },
      },
    });

    await prisma.question.create({
      data: {
        surveyId: zkSurvey.id,
        groupId: zkGroup.id,
        code: 'TRUST_RATING',
        text: 'Rate your overall trust in organizational integrity and psychological safety (1 to 5 Stars)',
        type: 'rating',
        mandatory: true,
        sortOrder: 2,
      },
    });

    await prisma.question.create({
      data: {
        surveyId: zkSurvey.id,
        groupId: zkGroup.id,
        code: 'UNFILTERED_COMMENTS',
        text: 'Provide your candid, unfiltered feedback or suggestions for executive leadership:',
        type: 'long_text',
        mandatory: false,
        sortOrder: 3,
      },
    });

    // Create assigned voters with mixed completed status
    const votersData = [
      { firstName: 'Eleanor', lastName: 'Vance', email: 'eleanor.vance@company.org', token: 'ZK-EL-7821', completed: true, completedAt: new Date(Date.now() - 3600000 * 5) },
      { firstName: 'Marcus', lastName: 'Brody', email: 'marcus.brody@company.org', token: 'ZK-MB-4190', completed: true, completedAt: new Date(Date.now() - 3600000 * 3) },
      { firstName: 'Sophia', lastName: 'Patel', email: 'sophia.patel@company.org', token: 'ZK-SP-9923', completed: true, completedAt: new Date(Date.now() - 3600000 * 1) },
      { firstName: 'David', lastName: 'Kim', email: 'david.kim@company.org', token: 'ZK-DK-1102', completed: false },
      { firstName: 'Beatrice', lastName: 'Thorne', email: 'beatrice.thorne@company.org', token: 'ZK-BT-5544', completed: false },
    ];

    for (let i = 0; i < votersData.length; i++) {
      const v = votersData[i];
      await prisma.voter.create({
        data: {
          surveyId: zkSurvey.id,
          voterId: `VOTER-ZK-${1000 + i}`,
          token: v.token,
          email: v.email,
          firstName: v.firstName,
          lastName: v.lastName,
          completed: v.completed,
          completedAt: v.completedAt || null,
          usesLeft: v.completed ? 0 : 1,
        },
      });
    }

    // Create 3 responses completely decoupled from voter identities (voterId: null)
    const anonymousComments = [
      {
        answers: {
          LEADERSHIP_ALIGNMENT: 'STRONGLY_ALIGNED',
          TRUST_RATING: 5,
          UNFILTERED_COMMENTS: 'The transparency during town halls has significantly boosted trust across the teams. Keep prioritizing open Q&A sessions.',
        },
      },
      {
        answers: {
          LEADERSHIP_ALIGNMENT: 'SOMEWHAT_ALIGNED',
          TRUST_RATING: 4,
          UNFILTERED_COMMENTS: 'We need clearer cross-functional roadmaps between product development and go-to-market teams to avoid last-minute pivots.',
        },
      },
      {
        answers: {
          LEADERSHIP_ALIGNMENT: 'NEUTRAL',
          TRUST_RATING: 4,
          UNFILTERED_COMMENTS: 'Encourage middle management to empower individual contributors more. High-level vision is solid.',
        },
      },
    ];

    for (const resp of anonymousComments) {
      await prisma.response.create({
        data: {
          surveyId: zkSurvey.id,
          voterId: null, // Decoupled secret ballot
          ipAddress: null,
          answers: resp.answers,
          completed: true,
          submitDate: new Date(),
        },
      });
    }

    console.log(`✅ Zero Knowledge Protocol demonstration survey seeded (ID: ${zkSurvey.id}) with 5 voters and 3 secret ballots.`);
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
