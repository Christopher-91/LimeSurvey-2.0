/**
 * Translation Service for Multilingual Surveys
 * Supports English, Spanish, German, French, Japanese, Korean, Finnish, Dutch, Swedish, Mandarin
 */
import https from 'node:https';

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
const resolveLangCode = (code, fallback = 'en') => {
  if (!code) return fallback;
  const clean = code.toLowerCase().trim();
  if (clean === 'auto') return 'auto';
  return LANG_CODE_MAP[clean] || clean;
};

/**
 * Primary engine: Google GTX Translation via HTTPS with IPv4 family to avoid macOS DNS connect timeouts
 */
function translateViaGoogleGTX(text, tgt, src = 'auto') {
  return new Promise((resolve, reject) => {
    const sl = !src || src === 'auto' ? 'auto' : src;
    const tl = tgt === 'zh' ? 'zh-CN' : tgt;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text.trim())}`;

    const req = https.get(url, { family: 4, timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`GTX returned status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed?.[0])) {
            const result = parsed[0].map((s) => s[0]).join('').trim();
            if (result) return resolve(result);
          }
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GTX request timed out'));
    });
  });
}

/**
 * Secondary engine: MyMemory Translation API
 */
async function translateViaMyMemory(text, tgt, src) {
  const fallbackSource = tgt === 'en' ? 'de' : 'en';
  const effectiveSrc = !src || src === 'auto' ? fallbackSource : src;
  const effectiveTgt = tgt === 'zh' ? 'zh-CN' : tgt;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${effectiveSrc}|${effectiveTgt}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
    },
  });
  clearTimeout(timeout);

  if (response.ok) {
    const data = await response.json();
    if (Array.isArray(data?.matches)) {
      const exact = data.matches.find(
        (m) => m.segment && m.segment.toLowerCase().trim() === text.toLowerCase().trim() && m.translation
      );
      if (exact?.translation?.trim()) {
        return exact.translation.trim();
      }
    }
    const translated = data?.responseData?.translatedText;
    if (translated && typeof translated === 'string' && translated.trim()) {
      return translated.trim();
    }
  }
  return text;
}

/**
 * Translates a single string of text
 */
export async function translateSingleText(text, targetLang, sourceLang = 'auto') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return text || '';
  }

  const tgt = resolveLangCode(targetLang, 'en');
  const src = resolveLangCode(sourceLang, 'auto');

  if (src !== 'auto' && src === tgt) {
    return text;
  }

  const cacheKey = `${src}:${tgt}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // 1. Primary engine: Google GTX (fast, supports auto-detection, handles any source language)
  try {
    const gtxResult = await translateViaGoogleGTX(text, tgt, src);
    if (gtxResult && typeof gtxResult === 'string' && gtxResult.trim()) {
      const cleanResult = gtxResult.trim();
      translationCache.set(cacheKey, cleanResult);
      return cleanResult;
    }
  } catch (err) {
    // Fall through to MyMemory
  }

  // 2. Secondary engine: MyMemory Translation API
  try {
    const mmResult = await translateViaMyMemory(text, tgt, src);
    if (mmResult && typeof mmResult === 'string' && mmResult.trim()) {
      const cleanResult = mmResult.trim();
      translationCache.set(cacheKey, cleanResult);
      return cleanResult;
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
export async function translateBatchTexts(texts = [], targetLang, sourceLang = 'auto') {
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
export async function translateQuestionObject(question, targetLang, sourceLang = 'auto') {
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
