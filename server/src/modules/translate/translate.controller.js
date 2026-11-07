import { translateBatchTexts, translateQuestionObject, translateSingleText } from './translate.service.js';

export const handleTranslate = async (req, res, next) => {
  try {
    const { text, texts, question, targetLang, sourceLang = 'en' } = req.body;

    if (!targetLang) {
      return res.status(400).json({
        success: false,
        error: { message: 'targetLang is required.' },
      });
    }

    if (question && typeof question === 'object') {
      const translatedQuestion = await translateQuestionObject(question, targetLang, sourceLang);
      return res.status(200).json({
        success: true,
        data: {
          targetLang,
          question: translatedQuestion,
        },
      });
    }

    if (Array.isArray(texts)) {
      const translatedList = await translateBatchTexts(texts, targetLang, sourceLang);
      return res.status(200).json({
        success: true,
        data: {
          targetLang,
          translations: translatedList,
        },
      });
    }

    const translated = await translateSingleText(text || '', targetLang, sourceLang);
    return res.status(200).json({
      success: true,
      data: {
        targetLang,
        translation: translated,
      },
    });
  } catch (error) {
    next(error);
  }
};

