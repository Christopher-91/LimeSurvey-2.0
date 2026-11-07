import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { translateBatchTexts, translateQuestionObject, translateSingleText } from '../src/modules/translate/translate.service.js';

describe('Multilingual Translation Service & API Tests', () => {
  it('translates a single English sentence to German', async () => {
    const german = await translateSingleText('How satisfied are you with our service?', 'de', 'en');
    expect(german).toBeDefined();
    expect(typeof german).toBe('string');
    expect(german.toLowerCase()).toContain('zufrieden');
  });

  it('translates a sentence into other supported languages', async () => {
    const spanish = await translateSingleText('How satisfied are you with our service?', 'es', 'en');
    expect(spanish).toBeDefined();
    expect(spanish.toLowerCase()).toContain('satisfech');

    const french = await translateSingleText('How satisfied are you with our service?', 'fr', 'en');
    expect(french).toBeDefined();
    expect(french.toLowerCase()).toContain('satisfait');
  });

  it('translates multiple text elements in batch', async () => {
    const batch = ['Good', 'Bad', 'Neutral'];
    const translated = await translateBatchTexts(batch, 'de', 'en');
    expect(translated).toHaveLength(3);
    expect(translated[0].toLowerCase()).toContain('gut');
  });

  it('translates a complete question object with options', async () => {
    const question = {
      text: 'What is your primary feedback?',
      helpText: 'Please select one option below.',
      options: [
        { code: 'AO1', text: 'Excellent' },
        { code: 'AO2', text: 'Needs Improvement' },
      ],
    };

    const translatedQ = await translateQuestionObject(question, 'de', 'en');
    expect(translatedQ.text).toBeDefined();
    expect(translatedQ.options.AO1).toBeDefined();
    expect(translatedQ.options.AO2).toBeDefined();
  });

  it('calls POST /api/v1/translate successfully', async () => {
    const res = await request(app)
      .post('/api/v1/translate')
      .send({
        text: 'What do you think of our product?',
        targetLang: 'de',
        sourceLang: 'en',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.targetLang).toBe('de');
    expect(res.body.data.translation).toBeDefined();
    expect(res.body.data.translation.length).toBeGreaterThan(0);
  });
});
