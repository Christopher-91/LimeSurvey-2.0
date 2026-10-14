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
