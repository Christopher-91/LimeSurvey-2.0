import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const legacyUrl = process.env.LEGACY_DATABASE_URL || 'postgresql://rohanchristopher:@localhost:5432/limesurvey';
const prisma = new PrismaClient();
const legacyClient = new pg.Client({ connectionString: legacyUrl });

// Helper to map LimeSurvey legacy question type code to modern type
function mapQuestionType(legacyType) {
  switch (legacyType) {
    case 'L': // List radio
    case '!': // List dropdown
      return 'single_choice';
    case 'M': // Multiple choice
    case 'P':
      return 'multiple_choice';
    case 'S': // Short free text
      return 'short_text';
    case 'T': // Long free text
    case 'U': // Huge free text
      return 'long_text';
    case 'N': // Numerical
    case 'K':
      return 'number';
    case 'Y': // Yes / No
      return 'yes_no';
    case 'D': // Date
      return 'date';
    case '5': // 5 point rating
      return 'rating';
    default:
      return 'single_choice';
  }
}

async function runImport() {
  console.log('🚀 Starting LimeSurvey Legacy Database Import...');
  console.log(`Connecting to legacy DB: ${legacyUrl}`);

  await legacyClient.connect();
  console.log('Connected to legacy PostgreSQL database.');

  try {
    // -------------------------------------------------------------
    // 1. Import Users (Admins)
    // -------------------------------------------------------------
    console.log('\n--- 1. Importing Users from lime_users ---');
    const userResult = await legacyClient.query(`
      SELECT uid, users_name, password, full_name, email, last_login, created 
      FROM lime_users
    `).catch((err) => {
      console.warn('Could not query lime_users:', err.message);
      return { rows: [] };
    });

    for (const u of userResult.rows) {
      if (!u.email) {
        u.email = `${u.users_name}@legacy-limesurvey.local`;
      }
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: u.email }, { username: u.users_name }] },
      });

      if (!existing) {
        // Keep the exact password hash (including $2y$ legacy bcrypt hashes)
        await prisma.user.create({
          data: {
            username: u.users_name,
            email: u.email,
            password: u.password,
            fullName: u.full_name || u.users_name,
            role: 'admin',
            isActive: true,
            lastLogin: u.last_login ? new Date(u.last_login) : null,
            createdAt: u.created ? new Date(u.created) : new Date(),
          },
        });
        console.log(` Imported user: ${u.users_name} (${u.email}) with legacy bcrypt hash intact.`);
      } else {
        console.log(` User already exists: ${u.users_name}`);
      }
    }

    // -------------------------------------------------------------
    // 2. Import Surveys
    // -------------------------------------------------------------
    console.log('\n--- 2. Importing Surveys from lime_surveys ---');
    const surveyResult = await legacyClient.query(`
      SELECT s.sid, s.admin, s.adminemail, s.active, s.expires, s.startdate, s.format, s.owner_id,
             COALESCE(l.surveyls_title, 'Imported Survey ' || s.sid) as title,
             l.surveyls_description as description,
             l.surveyls_welcometext as welcome_message,
             l.surveyls_endtext as end_message
      FROM lime_surveys s
      LEFT JOIN lime_surveys_languagesettings l ON s.sid = l.surveyls_survey_id
    `).catch((err) => {
      console.warn('Could not query lime_surveys:', err.message);
      return { rows: [] };
    });

    for (const s of surveyResult.rows) {
      const existing = await prisma.survey.findUnique({ where: { id: s.sid } });
      if (!existing) {
        await prisma.survey.create({
          data: {
            id: s.sid,
            title: s.title || `Survey #${s.sid}`,
            description: s.description || '',
            welcomeMessage: s.welcome_message || '',
            endMessage: s.end_message || '',
            adminEmail: s.adminemail || null,
            adminName: s.admin || null,
            active: s.active === 'Y',
            expires: s.expires ? new Date(s.expires) : null,
            startDate: s.startdate ? new Date(s.startdate) : null,
            format: s.format === 'A' ? 'all_in_one' : s.format === 'G' ? 'group_by_group' : 'question_by_question',
          },
        });
        console.log(` Imported survey #${s.sid}: "${s.title}"`);
      } else {
        console.log(` Survey #${s.sid} already exists.`);
      }
    }

    // -------------------------------------------------------------
    // 3. Import Question Groups
    // -------------------------------------------------------------
    console.log('\n--- 3. Importing Question Groups from lime_groups ---');
    const groupResult = await legacyClient.query(`
      SELECT g.gid, g.sid, g.group_order,
             COALESCE(gl.group_name, 'Group ' || g.gid) as name,
             gl.description
      FROM lime_groups g
      LEFT JOIN lime_group_l10ns gl ON g.gid = gl.gid
    `).catch(() => ({ rows: [] }));

    for (const g of groupResult.rows) {
      const surveyExists = await prisma.survey.findUnique({ where: { id: g.sid } });
      if (surveyExists) {
        const existing = await prisma.questionGroup.findUnique({ where: { id: g.gid } });
        if (!existing) {
          await prisma.questionGroup.create({
            data: {
              id: g.gid,
              surveyId: g.sid,
              name: g.name,
              description: g.description || '',
              sortOrder: parseInt(g.group_order, 10) || 0,
            },
          });
          console.log(` Imported group #${g.gid} for survey #${g.sid}`);
        }
      }
    }

    // -------------------------------------------------------------
    // 4. Import Questions
    // -------------------------------------------------------------
    console.log('\n--- 4. Importing Questions from lime_questions ---');
    const questionResult = await legacyClient.query(`
      SELECT q.qid, q.sid, q.gid, q.type, q.title as code, q.question_order, q.mandatory,
             COALESCE(ql.question, q.title) as text,
             ql.help as help_text
      FROM lime_questions q
      LEFT JOIN lime_question_l10ns ql ON q.qid = ql.qid
      WHERE q.parent_qid = 0
    `).catch(() => ({ rows: [] }));

    for (const q of questionResult.rows) {
      const surveyExists = await prisma.survey.findUnique({ where: { id: q.sid } });
      if (surveyExists) {
        const existing = await prisma.question.findUnique({ where: { id: q.qid } });
        if (!existing) {
          const groupExists = q.gid ? await prisma.questionGroup.findUnique({ where: { id: q.gid } }) : null;
          await prisma.question.create({
            data: {
              id: q.qid,
              surveyId: q.sid,
              groupId: groupExists ? q.gid : null,
              code: q.code || `Q${q.qid}`,
              text: q.text || `Question ${q.qid}`,
              helpText: q.help_text || '',
              type: mapQuestionType(q.type),
              mandatory: q.mandatory === 'Y',
              sortOrder: parseInt(q.question_order, 10) || 0,
            },
          });
          console.log(` Imported question #${q.qid} [${q.code}]: "${q.text.substring(0, 40)}..."`);
        }
      }
    }

    // -------------------------------------------------------------
    // 5. Import Answer Options
    // -------------------------------------------------------------
    console.log('\n--- 5. Importing Answer Options from lime_answers ---');
    const answerResult = await legacyClient.query(`
      SELECT a.aid, a.qid, a.code, a.sortorder, a.assessment_value,
             COALESCE(al.answer, a.code) as text
      FROM lime_answers a
      LEFT JOIN lime_answer_l10ns al ON a.aid = al.aid
    `).catch(() => ({ rows: [] }));

    for (const a of answerResult.rows) {
      const questionExists = await prisma.question.findUnique({ where: { id: a.qid } });
      if (questionExists) {
        const existing = await prisma.answerOption.findUnique({ where: { id: a.aid } });
        if (!existing) {
          await prisma.answerOption.create({
            data: {
              id: a.aid,
              questionId: a.qid,
              code: a.code,
              text: a.text,
              sortOrder: parseInt(a.sortorder, 10) || 0,
              assessmentValue: parseInt(a.assessment_value, 10) || 0,
            },
          });
        }
      }
    }
    console.log(` Processed ${answerResult.rows.length} answer options.`);

    // -------------------------------------------------------------
    // 6. Import Dynamic Response Tables (lime_survey_{sid})
    // -------------------------------------------------------------
    console.log('\n--- 6. Detecting and Importing Dynamic Legacy Response Tables ---');
    const tableResult = await legacyClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'lime_survey_%'
        AND table_name NOT LIKE '%timings%'
    `).catch(() => ({ rows: [] }));

    for (const row of tableResult.rows) {
      const sidMatch = row.table_name.match(/lime_survey_(\d+)$/);
      if (sidMatch) {
        const sid = parseInt(sidMatch[1], 10);
        const survey = await prisma.survey.findUnique({ where: { id: sid } });
        if (survey) {
          console.log(` Reading responses from legacy dynamic table: ${row.table_name} for Survey #${sid}...`);
          const rows = await legacyClient.query(`SELECT * FROM ${row.table_name}`).catch(() => ({ rows: [] }));
          for (const resp of rows.rows) {
            const { id, submitdate, ipaddr, ...answerFields } = resp;
            await prisma.response.create({
              data: {
                surveyId: sid,
                answers: answerFields,
                ipAddress: ipaddr ? String(ipaddr) : null,
                completed: !!submitdate,
                submitDate: submitdate ? new Date(submitdate) : new Date(),
              },
            });
          }
          console.log(` Migrated ${rows.rows.length} responses from ${row.table_name} into unified JSONB table.`);
        }
      }
    }

    console.log('\n🎉 Legacy import finished successfully!');
  } catch (err) {
    console.error('❌ Error during legacy import:', err);
  } finally {
    await legacyClient.end();
    await prisma.$disconnect();
  }
}

runImport();
