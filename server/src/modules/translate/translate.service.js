/**
 * Translation Service for Multilingual Surveys
 * Supports English, Spanish, German, French, Japanese, Korean, Finnish, Dutch, Swedish, Mandarin
 */

const LANG_CODE_MAP = {
  en: 'en',
  es: 'es',
  de: 'de',
  fr: 'fr',
  ja: 'ja',
  ko: 'ko',
  fi: 'fi',
  nl: 'nl',
  sv: 'sv',
  zh: 'zh-CN',
};

// In-memory cache to prevent redundant external API calls
const translationCache = new Map();

/**
 * Normalizes language codes for translation APIs
 */
const resolveLangCode = (code) => {
  if (!code) return 'en';
  const clean = code.toLowerCase().trim();
  return LANG_CODE_MAP[clean] || clean;
};

/**
 * Translates a single string of text
 */
export async function translateSingleText(text, targetLang, sourceLang = 'en') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return text || '';
  }

  const src = resolveLangCode(sourceLang);
  const tgt = resolveLangCode(targetLang);

  if (src === tgt) {
    return text;
  }

  const cacheKey = `${src}:${tgt}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // 1. Primary engine: MyMemory Translation API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${src}|${tgt}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === 'string' && translated.trim()) {
        const result = translated.trim();
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Fall through to secondary engine
  }

  // 2. Secondary engine: Google GTX Translation
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(gtxUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.[0])) {
        const result = data[0].map((s) => s[0]).join('').trim();
        if (result) {
          translationCache.set(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    // Fall through to fallback
  }

  // Fallback: return original text if translation service is unavailable
  return text;
}

/**
 * Translates an array of strings in batch
 */
export async function translateBatchTexts(texts = [], targetLang, sourceLang = 'en') {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  return Promise.all(
    texts.map((t) => translateSingleText(t, targetLang, sourceLang))
  );
}

/**
 * Translates a complete survey question object
 */
export async function translateQuestionObject(question, targetLang, sourceLang = 'en') {
  if (!question) return question;

  const textPromise = translateSingleText(question.text || '', targetLang, sourceLang);
  const helpPromise = question.helpText ? translateSingleText(question.helpText, targetLang, sourceLang) : Promise.resolve('');

  const optionTexts = (question.options || []).map((o) => o.text || '');
  const optionsPromise = translateBatchTexts(optionTexts, targetLang, sourceLang);

  const matrixRows = question.settings?.rows || [];
  const matrixCols = question.settings?.columns || [];
  const rowsPromise = translateBatchTexts(matrixRows, targetLang, sourceLang);
  const colsPromise = translateBatchTexts(matrixCols, targetLang, sourceLang);

  const [translatedText, translatedHelp, translatedOptions, translatedRows, translatedCols] = await Promise.all([
    textPromise,
    helpPromise,
    optionsPromise,
    rowsPromise,
    colsPromise,
  ]);

  const optionTranslations = {};
  (question.options || []).forEach((opt, idx) => {
    optionTranslations[opt.code] = translatedOptions[idx] || opt.text;
  });

  return {
    text: translatedText,
    helpText: translatedHelp,
    options: optionTranslations,
    rows: translatedRows.length > 0 ? translatedRows : undefined,
    columns: translatedCols.length > 0 ? translatedCols : undefined,
  };
}
