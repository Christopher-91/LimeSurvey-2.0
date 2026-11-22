import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatFileSize, getFileIcon, isImageFile } from '../utils/fileUtils.js';
import {
  SUPPORTED_LANGUAGES,
  autoTranslateQuestion,
  autoTranslateText,
  getLocalizedQuestion,
  getLocalizedSurvey,
  getUiText,
} from '../utils/i18n.js';
import { LeafletMapPicker } from '../components/LeafletMapPicker.jsx';

export const ACCENT_COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10b981', label: 'Emerald Green (Default)' },
  { name: 'Blue', hex: '#2563eb', label: 'Corporate Blue' },
  { name: 'Indigo', hex: '#6366f1', label: 'Indigo' },
  { name: 'Purple', hex: '#8b5cf6', label: 'Royal Purple' },
  { name: 'Rose', hex: '#f43f5e', label: 'Rose' },
  { name: 'Orange', hex: '#f97316', label: 'Warm Orange' },
  { name: 'Amber', hex: '#f59e0b', label: 'Golden Amber' },
  { name: 'Teal', hex: '#0d9488', label: 'Teal' },
  { name: 'Cyan', hex: '#06b6d4', label: 'Electric Cyan' },
  { name: 'Slate', hex: '#475569', label: 'Modern Slate' },
];

export const QUESTION_TYPE_CATEGORIES = [
  {
    id: 'single_choice',
    title: 'Single choice',
    icon: 'ri-list-radio',
    items: [
      {
        id: 'list_radio',
        label: 'List (radio)',
        type: 'single_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
        settings: { allowMultiple: false, displayType: 'radio' },
      },
      {
        id: 'list_with_comment',
        label: 'List with comment (Radio)',
        type: 'single_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
        settings: { allowMultiple: false, hasOtherComment: true, displayType: 'radio_comment' },
      },
      {
        id: 'list_image_select',
        label: 'List image select (Radio)',
        type: 'single_choice',
        options: [
          { code: 'AO1', text: 'Option 1', imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&q=80' },
          { code: 'AO2', text: 'Option 2', imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&q=80' },
          { code: 'AO3', text: 'Option 3', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=80' },
        ],
        settings: { allowMultiple: false, displayType: 'image_select' },
      },
      {
        id: 'five_point_choice',
        label: '5 point choice',
        type: 'rating',
        settings: { minRating: 1, maxRating: 5, minLabel: 'Strongly Disagree', maxLabel: 'Strongly Agree' },
      },
      {
        id: 'dropdown',
        label: 'Dropdown',
        type: 'single_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
        settings: { allowMultiple: false, displayType: 'dropdown' },
      },
      {
        id: 'single_choice_buttons',
        label: 'Single choice buttons',
        type: 'single_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
        settings: { allowMultiple: false, displayType: 'button_group' },
      },
    ],
  },
  {
    id: 'multiple_choice',
    title: 'Multiple choice',
    icon: 'ri-checkbox-multiple-line',
    items: [
      {
        id: 'multiple_choice',
        label: 'Multiple choice',
        type: 'multiple_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
        settings: { allowMultiple: true, displayType: 'checkbox' },
      },
      {
        id: 'multiple_choice_comments',
        label: 'Multiple choice with comments',
        type: 'multiple_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
        ],
        settings: { allowMultiple: true, hasOtherComment: true, displayType: 'checkbox_comment' },
      },
      {
        id: 'multiple_choice_buttons',
        label: 'Multiple choice buttons',
        type: 'multiple_choice',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
        settings: { allowMultiple: true, displayType: 'button_group' },
      },
      {
        id: 'image_select_multiple_choice',
        label: 'Image select multiple choice',
        type: 'multiple_choice',
        options: [
          { code: 'AO1', text: 'Option 1', imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&q=80' },
          { code: 'AO2', text: 'Option 2', imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&q=80' },
          { code: 'AO3', text: 'Option 3', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=80' },
        ],
        settings: { allowMultiple: true, displayType: 'image_select' },
      },
    ],
  },
  {
    id: 'ranking_rating',
    title: 'Ranking & rating',
    icon: 'ri-list-ordered',
    items: [
      {
        id: 'ranking_advanced',
        label: 'Ranking advanced',
        type: 'ranking',
        options: [
          { code: 'AO1', text: 'Option 1' },
          { code: 'AO2', text: 'Option 2' },
          { code: 'AO3', text: 'Option 3' },
        ],
      },
      {
        id: 'gender',
        label: 'Gender',
        type: 'single_choice',
        options: [
          { code: 'F', text: 'Female' },
          { code: 'M', text: 'Male' },
          { code: 'NB', text: 'Non-binary / Diverse' },
          { code: 'O', text: 'Prefer not to say' },
        ],
        settings: { allowMultiple: false, displayType: 'gender_cards' },
      },
      {
        id: 'yes_no',
        label: 'Yes/No',
        type: 'yes_no',
        options: [
          { code: 'Y', text: 'Yes' },
          { code: 'N', text: 'No' },
        ],
        settings: { allowMultiple: false },
      },
    ],
  },
  {
    id: 'dates_data',
    title: '{ } Dates & data',
    icon: 'ri-code-line',
    items: [
      {
        id: 'map_browser_detection',
        label: 'Map/browser detection',
        type: 'map_browser',
        helpText: 'Map location and browser environment detection',
        settings: {
          latitude: 53.5511,
          longitude: 9.9937,
          zoom: 10,
          locationName: 'Hamburg, Germany',
          allowUserSelect: false,
          showLocationInfo: true,
          captureGps: true,
        },
      },
      {
        id: 'date_time',
        label: 'Date/time',
        type: 'date_time',
        settings: { inputType: 'datetime', format: 'YYYY-MM-DD HH:mm' },
      },
      {
        id: 'file_upload',
        label: 'File upload',
        type: 'file_upload',
        settings: { allowedTypes: 'all', maxFileSize: 10, maxFiles: 3 },
      },
    ],
  },
  {
    id: 'text',
    title: 'Text',
    icon: 'ri-align-left',
    items: [
      {
        id: 'short_text',
        label: 'Short text',
        type: 'short_text',
      },
      {
        id: 'long_text',
        label: 'Long text',
        type: 'long_text',
      },
      {
        id: 'multiple_short_text',
        label: 'Multiple short text',
        type: 'multiple_short_text',
        settings: {
          fields: ['First Name', 'Last Name', 'Email Address', 'Organization'],
        },
      },
    ],
  },
  {
    id: 'number',
    title: '123 Number',
    icon: 'ri-hashtag',
    items: [
      {
        id: 'numerical_input',
        label: 'Numerical input',
        type: 'numerical_input',
        settings: { min: 0, max: 1000000, step: 1, prefix: '', suffix: '' },
      },
      {
        id: 'multiple_numerical_input',
        label: 'Multiple numerical input',
        type: 'multiple_numerical_input',
        settings: {
          rows: ['Budget Item 1', 'Budget Item 2', 'Budget Item 3'],
          showSum: true,
          prefix: '$',
        },
      },
      {
        id: 'equation',
        label: 'Equation',
        type: 'equation',
        settings: { formula: '{Q1 + Q2}', label: 'Calculated Score' },
      },
    ],
  },
];

export const FONT_PRESETS = [
  // --- SANS-SERIF (29 FONTS) ---
  { name: 'IBM Plex Sans', fontFamily: "'IBM Plex Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'LimeSurvey default corporate typeface' },
  { name: 'Inter', fontFamily: "'Inter', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Highly legible screen UI font' },
  { name: 'Roboto', fontFamily: "'Roboto', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Modern, geometric and friendly' },
  { name: 'Open Sans', fontFamily: "'Open Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Humanist sans with open letterforms' },
  { name: 'Lato', fontFamily: "'Lato', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Warm and corporate harmony' },
  { name: 'Poppins', fontFamily: "'Poppins', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Geometric, stylish and bold' },
  { name: 'Montserrat', fontFamily: "'Montserrat', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Contemporary urban modernist style' },
  { name: 'Nunito', fontFamily: "'Nunito', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Well-balanced rounded terminal sans' },
  { name: 'Raleway', fontFamily: "'Raleway', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Elegant and refined geometric sans' },
  { name: 'Work Sans', fontFamily: "'Work Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Optimized for screen readability' },
  { name: 'Rubik', fontFamily: "'Rubik', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Slightly rounded corners, friendly feel' },
  { name: 'Plus Jakarta Sans', fontFamily: "'Plus Jakarta Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Fresh, modern neo-grotesque sans' },
  { name: 'Source Sans 3', fontFamily: "'Source Sans 3', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Adobe open-source UI standard' },
  { name: 'Quicksand', fontFamily: "'Quicksand', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Approachable rounded display sans' },
  { name: 'Manrope', fontFamily: "'Manrope', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Modern crossover geometric grotesque' },
  { name: 'DM Sans', fontFamily: "'DM Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Low-contrast geometric sans' },
  { name: 'Ubuntu', fontFamily: "'Ubuntu', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Distinctive contemporary character' },
  { name: 'Outfit', fontFamily: "'Outfit', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Branded geometric neo-grotesque' },
  { name: 'Fira Sans', fontFamily: "'Fira Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Designed for Mozilla OS ecosystem' },
  { name: 'Cabin', fontFamily: "'Cabin', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Humanist sans with modern proportions' },
  { name: 'PT Sans', fontFamily: "'PT Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Universal pan-European sans' },
  { name: 'Barlow', fontFamily: "'Barlow', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'California highway inspired grotesque' },
  { name: 'Mulish', fontFamily: "'Mulish', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Minimalist versatile text sans' },
  { name: 'Josefin Sans', fontFamily: "'Josefin Sans', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Vintage 1920s geometric look' },
  { name: 'Oxygen', fontFamily: "'Oxygen', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'KDE desktop clean interface font' },
  { name: 'Heebo', fontFamily: "'Heebo', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Sturdy structured typeface' },
  { name: 'Titillium Web', fontFamily: "'Titillium Web', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Architectural industrial sans' },
  { name: 'Karla', fontFamily: "'Karla', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Quirky grotesque sans-serif' },
  { name: 'Lexend', fontFamily: "'Lexend', sans-serif", category: 'Sans-serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Engineered for reading fluency' },

  // --- SERIF (14 FONTS) ---
  { name: 'Playfair Display', fontFamily: "'Playfair Display', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'High-contrast luxury editorial serif' },
  { name: 'Merriweather', fontFamily: "'Merriweather', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Pleasant reading serif on digital displays' },
  { name: 'Lora', fontFamily: "'Lora', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Contemporary calligraphic serif' },
  { name: 'PT Serif', fontFamily: "'PT Serif', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Universal classical text serif' },
  { name: 'Noto Serif', fontFamily: "'Noto Serif', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Global linguistic harmonious serif' },
  { name: 'Cinzel', fontFamily: "'Cinzel', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Roman inscription inspired classical' },
  { name: 'Cormorant Garamond', fontFamily: "'Cormorant Garamond', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Fine traditional French Garamond' },
  { name: 'EB Garamond', fontFamily: "'EB Garamond', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Revival of 16th-century Claude Garamont' },
  { name: 'Libre Baskerville', fontFamily: "'Libre Baskerville', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Optimized 1950s Baskerville revival' },
  { name: 'Bitter', fontFamily: "'Bitter', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Slab-serif designed for comfortable reading' },
  { name: 'Bodoni Moda', fontFamily: "'Bodoni Moda', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'High-fashion dramatic Italian serif' },
  { name: 'Frank Ruhl Libre', fontFamily: "'Frank Ruhl Libre', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Classic proportioned Hebrew/Latin serif' },
  { name: 'Spectral', fontFamily: "'Spectral', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Design-first editorial serif by Production Type' },
  { name: 'Crimson Pro', fontFamily: "'Crimson Pro', serif", category: 'Serif', sample: 'The quick brown fox jumps over the lazy dog', description: 'Bookish elegant renaissance text serif' },

  // --- MONOSPACE (7 FONTS) ---
  { name: 'Fira Code', fontFamily: "'Fira Code', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Monospaced with programmatic clarity' },
  { name: 'IBM Plex Mono', fontFamily: "'IBM Plex Mono', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Industrial technical monospace' },
  { name: 'JetBrains Mono', fontFamily: "'JetBrains Mono', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Developer-crafted monospaced font' },
  { name: 'Source Code Pro', fontFamily: "'Source Code Pro', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Adobe coding monospace typeface' },
  { name: 'Space Mono', fontFamily: "'Space Mono', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Retro-futuristic fixed-width font' },
  { name: 'Inconsolata', fontFamily: "'Inconsolata', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Clean humanist monospaced font' },
  { name: 'Roboto Mono', fontFamily: "'Roboto Mono', monospace", category: 'Monospace', sample: 'The quick brown fox jumps over the lazy dog', description: 'Geometric fixed-width companion to Roboto' },

  // --- DISPLAY & SCRIPT (6 FONTS) ---
  { name: 'Caveat', fontFamily: "'Caveat', cursive", category: 'Display', sample: 'The quick brown fox jumps over the lazy dog', description: 'Playful and warm handwriting style' },
  { name: 'Pacifico', fontFamily: "'Pacifico', cursive", category: 'Display', sample: 'The quick brown fox jumps over the lazy dog', description: '1950s American surf culture brush script' },
  { name: 'Comfortaa', fontFamily: "'Comfortaa', cursive", category: 'Display', sample: 'The quick brown fox jumps over the lazy dog', description: 'Geometric rounded display font' },
  { name: 'Righteous', fontFamily: "'Righteous', cursive", category: 'Display', sample: 'The quick brown fox jumps over the lazy dog', description: 'Retro Art Deco musical poster font' },
  { name: 'Lobster', fontFamily: "'Lobster', cursive", category: 'Display', sample: 'The quick brown fox jumps over the lazy dog', description: 'Bold lively cursive script' },
  { name: 'Dancing Script', fontFamily: "'Dancing Script', cursive", category: 'Display', sample: 'The quick brown fox jumps over the lazy dog', description: 'Spontaneous casual bouncing script' },
];

export const getQuestionTypeBadgeLabel = (type, settings = {}) => {
  if (type === 'rating') return '5 Point Choice / Rating';
  if (type === 'ranking') return 'Ranking Advanced';
  if (type === 'file_upload') return 'File Upload';
  if (type === 'map_browser') return 'Map / Browser Detection';
  if (type === 'date_time') return 'Date / Time';
  if (type === 'numerical_input') return 'Numerical Input';
  if (type === 'multiple_numerical_input') return 'Multiple Numerical Input';
  if (type === 'multiple_short_text') return 'Multiple Short Text';
  if (type === 'equation') return 'Equation (Calculated)';
  if (type === 'yes_no') return 'Yes / No';
  if (type === 'long_text') return 'Long Text / Comment';
  if (type === 'matrix') return 'Matrix / Grid';
  if (type === 'multiple_choice') {
    if (settings?.displayType === 'image_select') return 'Image Select Multiple Choice';
    if (settings?.displayType === 'button_group') return 'Multiple Choice Buttons';
    if (settings?.hasOtherComment) return 'Multiple Choice with Comments';
    return 'Multiple Choice';
  }
  if (type === 'single_choice') {
    if (settings?.displayType === 'gender_cards') return 'Gender';
    if (settings?.displayType === 'image_select') return 'List Image Select (Radio)';
    if (settings?.displayType === 'dropdown') return 'Dropdown (Single)';
    if (settings?.displayType === 'button_group') return 'Single Choice Buttons';
    if (settings?.hasOtherComment) return 'List with Comment (Radio)';
    return 'List (Radio)';
  }
  if (settings?.isGroupHeader) return 'Question Group Header';
  return 'Short Text';
};

export const toDatetimeLocalValue = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatVoterDateDisplay = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getVoterScheduleStatus = (voter) => {
  const now = new Date();
  if (voter.validFrom && now < new Date(voter.validFrom)) {
    return {
      status: 'scheduled',
      label: 'Scheduled',
      detail: `Starts ${formatVoterDateDisplay(voter.validFrom)}`,
      badgeClass: 'ls-badge-warning',
      icon: 'ri-time-line',
    };
  }
  if (voter.validUntil && now > new Date(voter.validUntil)) {
    return {
      status: 'expired',
      label: 'Expired',
      detail: `Closed ${formatVoterDateDisplay(voter.validUntil)}`,
      badgeClass: 'ls-badge-danger',
      icon: 'ri-close-circle-line',
    };
  }
  if (voter.validFrom || voter.validUntil) {
    return {
      status: 'active',
      label: 'Active',
      detail: voter.validUntil
        ? `Until ${formatVoterDateDisplay(voter.validUntil)}`
        : `Since ${formatVoterDateDisplay(voter.validFrom)}`,
      badgeClass: 'ls-badge-success',
      icon: 'ri-checkbox-circle-line',
    };
  }
  return {
    status: 'open',
    label: 'Open',
    detail: 'No deadline set',
    badgeClass: 'ls-badge-secondary',
    icon: 'ri-calendar-check-line',
  };
};

const PreviewRankingQuestion = ({ question, value, onChange }) => {
  const options = question.options || [];

  const [items, setItems] = useState(() => {
    if (Array.isArray(value) && value.length === options.length) {
      return value.map((code) => options.find((o) => o.code === code) || { code, text: code });
    }
    return [...options];
  });

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => {
    if (Array.isArray(value) && value.length === options.length) {
      const mapped = value.map((code) => options.find((o) => o.code === code) || { code, text: code });
      setItems(mapped);
    } else if (!value || value.length === 0) {
      onChange(options.map((o) => o.code));
    }
  }, [value, options]);

  const updateOrder = (newItems) => {
    setItems(newItems);
    onChange(newItems.map((o) => o.code));
  };

  const moveItem = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    updateOrder(updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) setDragOverIdx(index);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    moveItem(draggedIdx, targetIdx);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleRankSelect = (currentIdx, newRank1Based) => {
    const targetIdx = newRank1Based - 1;
    if (targetIdx === currentIdx || targetIdx < 0 || targetIdx >= items.length) return;
    moveItem(currentIdx, targetIdx);
  };

  const getRankSuffix = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '2px' }}>
        <i className="ri-arrow-up-down-line" /> Drag items or select rank dropdowns to reorder (1st to {items.length}):
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, idx) => {
          const rank = idx + 1;
          const isDragging = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx;

          return (
            <div
              key={item.code}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                backgroundColor: isDragOver ? '#ecfdf5' : '#ffffff',
                border: isDragOver ? '2px dashed #10b981' : isDragging ? '1px dashed #94a3b8' : '1px solid #e2e8f0',
                borderRadius: '6px',
                opacity: isDragging ? 0.45 : 1,
                cursor: 'grab',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
            >
              <i className="ri-draggable" style={{ color: '#94a3b8', fontSize: '18px' }} />
              <div
                style={{
                  minWidth: '40px',
                  height: '26px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: rank === 1 ? '#10b981' : rank === 2 ? '#0284c7' : rank === 3 ? '#6366f1' : '#f1f5f9',
                  color: rank <= 3 ? '#ffffff' : '#475569',
                  border: rank === 1 ? '1px solid #059669' : '1px solid #cbd5e1',
                }}
              >
                {getRankSuffix(rank)}
              </div>
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                {item.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Rank:</span>
                <select
                  value={rank}
                  onChange={(e) => handleRankSelect(idx, parseInt(e.target.value, 10))}
                  style={{
                    padding: '3px 6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {items.map((_, rIdx) => (
                    <option key={rIdx + 1} value={rIdx + 1}>
                      {rIdx + 1} ({getRankSuffix(rIdx + 1)})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'inline-flex', gap: '2px' }}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, idx - 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    backgroundColor: idx === 0 ? '#f8fafc' : '#ffffff',
                    color: idx === 0 ? '#cbd5e1' : '#475569',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  <i className="ri-arrow-up-s-line" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => moveItem(idx, idx + 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    backgroundColor: idx === items.length - 1 ? '#f8fafc' : '#ffffff',
                    color: idx === items.length - 1 ? '#cbd5e1' : '#475569',
                    cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  <i className="ri-arrow-down-s-line" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PreviewFileUploadQuestion = ({ question, value, onChange }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const settings = question.settings || {};
  const maxFiles = settings.maxFiles || 3;
  const maxFileSize = settings.maxFileSize || 10;
  const allowedTypes = settings.allowedTypes || 'all';

  const filesList = Array.isArray(value) ? value : [];

  const handleFiles = (incoming) => {
    const files = Array.from(incoming);
    const maxBytes = maxFileSize * 1024 * 1024;
    const remainingSlots = maxFiles - filesList.length;

    if (remainingSlots <= 0) {
      alert(`Maximum file limit of ${maxFiles} reached.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.size > maxBytes) {
        alert(`File "${file.name}" exceeds the ${maxFileSize}MB limit.`);
        return;
      }
      if (allowedTypes === 'images' && !file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not an image.`);
        return;
      }
      if (allowedTypes === 'media' && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        alert(`File "${file.name}" is not an audio or video file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: e.target.result,
        };
        onChange([...(Array.isArray(value) ? value : []), newFileObj]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx) => {
    const updated = filesList.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? '#10b981' : '#cbd5e1'}`,
          borderRadius: '8px',
          padding: '22px 16px',
          textAlign: 'center',
          backgroundColor: isDragOver ? '#ecfdf5' : '#f8fafc',
          cursor: filesList.length >= maxFiles ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          style={{ display: 'none' }}
          disabled={filesList.length >= maxFiles}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: isDragOver ? '#d1fae5' : '#e2e8f0',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            margin: '0 auto 8px auto',
          }}
        >
          <i className="ri-upload-cloud-2-line" />
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
          {filesList.length >= maxFiles
            ? `Limit of ${maxFiles} files reached`
            : 'Click to browse or drag and drop files here'}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          {allowedTypes === 'images' && 'Images only (PNG, JPG, WebP, SVG)'}
          {allowedTypes === 'documents' && 'Documents (PDF, Word, Excel, Text)'}
          {allowedTypes === 'media' && 'Media (Audio & Video files)'}
          {allowedTypes === 'all' && 'All standard file types supported'}
          {` • Up to ${maxFileSize} MB per file • Max ${maxFiles} file${maxFiles > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Uploaded Files Preview Cards */}
      {filesList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
            <span>Attached Files ({filesList.length}/{maxFiles}):</span>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0 }}
            >
              Clear all
            </button>
          </div>
          {filesList.map((file, fIdx) => (
            <div
              key={fIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {isImageFile(file.type, file.name) && file.dataUrl ? (
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '1px solid #cbd5e1',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '4px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <i className={getFileIcon(file.type, file.name)} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(fIdx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '16px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                title="Remove file"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SurveyBuilder = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'voters'
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});

  const handlePreviewAnswerChange = (qKey, value) => {
    setPreviewAnswers((prev) => ({
      ...prev,
      [qKey]: value,
    }));
  };

  const handleTestSubmitPreview = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.mandatory) {
        const val = previewAnswers[q.code || `Q_${i}`];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === 'object' && Object.keys(val).length === 0)
        ) {
          showToast(`Mandatory question #${i + 1} ("${q.text || `Question ${i + 1}`}") is required before submitting.`, 'warning');
          return;
        }
      }
    }
    if (theme.completion?.redirectEnabled && theme.completion?.redirectUrl) {
      showToast(
        `Preview submission successful! (Redirect configured to ${theme.completion.redirectUrl} in ${theme.completion.redirectDelay ?? 3}s)`,
        'success'
      );
    } else {
      showToast('Preview test submission successful! All required fields are validated.', 'success');
    }
  };

  const handleResetPreviewAnswers = () => {
    setPreviewAnswers({});
    showToast('Preview responses reset.', 'info');
  };

  // Survey Header Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [endMessage, setEndMessage] = useState('');
  const [showWelcomeCompletion, setShowWelcomeCompletion] = useState(false);

  // Deployment & Privacy Settings
  const [active, setActive] = useState(false);
  const [zeroKnowledgeEnabled, setZeroKnowledgeEnabled] = useState(false);

  // Multilingual Configuration State
  const [supportedLanguages, setSupportedLanguages] = useState(['en']);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [surveyTranslations, setSurveyTranslations] = useState({});
  const [editingLanguage, setEditingLanguage] = useState('en');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingQIdx, setTranslatingQIdx] = useState(null);

  // Custom White-Labeling, Brand Logo, Accent Color & Completion State
  const [theme, setTheme] = useState({
    logoUrl: '',
    showLogo: true,
    accentColor: '#10b981',
    fontFamily: '',
    fontName: 'IBM Plex Sans',
    completion: {
      redirectEnabled: false,
      redirectUrl: '',
      redirectDelay: 3,
      buttonText: 'Continue to Website',
      customTitle: '',
      customMessage: '',
    },
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Question Type Selection Modal & Typography State
  const [isQuestionTypeModalOpen, setIsQuestionTypeModalOpen] = useState(false);
  const [questionModalMode, setQuestionModalMode] = useState('change'); // 'change' (modify active question) or 'add' (append new question)
  const [questionTypeSearchQuery, setQuestionTypeSearchQuery] = useState('');
  const [targetAddIndex, setTargetAddIndex] = useState(null);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [selectedFontCategory, setSelectedFontCategory] = useState('All');

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be under 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setTheme((prev) => ({
        ...prev,
        logoUrl: uploadEvent.target.result,
        showLogo: true,
      }));
      showToast('Brand logo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please drop a valid image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be under 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setTheme((prev) => ({
        ...prev,
        logoUrl: uploadEvent.target.result,
        showLogo: true,
      }));
      showToast('Brand logo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Multilingual Field Getters and Setters
  const getQuestionTextForEdit = (q) => {
    if (editingLanguage === defaultLanguage) return q.text;
    return q.settings?.translations?.[editingLanguage]?.text ?? '';
  };

  const setQuestionTextForEdit = (idx, value) => {
    const q = questions[idx];
    if (editingLanguage === defaultLanguage) {
      const curTrans = q?.settings?.translations;
      if (curTrans) {
        updateQuestion(idx, {
          text: value,
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [defaultLanguage]: {
                ...(curTrans[defaultLanguage] || {}),
                text: value,
              },
              ...(defaultLanguage === 'en' ? { en: { ...(curTrans.en || {}), text: value } } : {}),
            },
          },
        });
      } else {
        updateQuestion(idx, { text: value });
      }
    } else {
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      updateQuestion(idx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              text: value,
            },
          },
        },
      });
    }
  };

  const getQuestionHelpForEdit = (q) => {
    if (editingLanguage === defaultLanguage) return q.helpText;
    return q.settings?.translations?.[editingLanguage]?.helpText ?? '';
  };

  const setQuestionHelpForEdit = (idx, value) => {
    const q = questions[idx];
    if (editingLanguage === defaultLanguage) {
      const curTrans = q?.settings?.translations;
      if (curTrans) {
        updateQuestion(idx, {
          helpText: value,
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [defaultLanguage]: {
                ...(curTrans[defaultLanguage] || {}),
                helpText: value,
              },
              ...(defaultLanguage === 'en' ? { en: { ...(curTrans.en || {}), helpText: value } } : {}),
            },
          },
        });
      } else {
        updateQuestion(idx, { helpText: value });
      }
    } else {
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      updateQuestion(idx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              helpText: value,
            },
          },
        },
      });
    }
  };

  const getOptionTextForEdit = (q, opt) => {
    if (editingLanguage === defaultLanguage) return opt.text;
    return q.settings?.translations?.[editingLanguage]?.options?.[opt.code] ?? '';
  };

  const setOptionTextForEdit = (qIdx, optIdx, value) => {
    const q = questions[qIdx];
    const opt = q?.options?.[optIdx];
    if (editingLanguage === defaultLanguage) {
      handleUpdateOption(qIdx, optIdx, value);
      const curTrans = q?.settings?.translations;
      if (curTrans && opt) {
        const langTrans = curTrans[defaultLanguage] || {};
        const optTrans = langTrans.options || {};
        updateQuestion(qIdx, {
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [defaultLanguage]: {
                ...langTrans,
                options: {
                  ...optTrans,
                  [opt.code]: value,
                },
              },
              ...(defaultLanguage === 'en'
                ? {
                    en: {
                      ...(curTrans.en || {}),
                      options: {
                        ...((curTrans.en && curTrans.en.options) || {}),
                        [opt.code]: value,
                      },
                    },
                  }
                : {}),
            },
          },
        });
      }
    } else {
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      const optTrans = langTrans.options || {};
      updateQuestion(qIdx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              options: {
                ...optTrans,
                [opt.code]: value,
              },
            },
          },
        },
      });
    }
  };

  const getMatrixItemForEdit = (q, kind, itemIdx, defaultVal) => {
    if (editingLanguage === defaultLanguage) return defaultVal;
    const transList = q.settings?.translations?.[editingLanguage]?.[kind];
    if (Array.isArray(transList) && transList[itemIdx] !== undefined) {
      return transList[itemIdx];
    }
    return '';
  };

  const setMatrixItemForEdit = (qIdx, kind, itemIdx, value) => {
    if (editingLanguage === defaultLanguage) {
      handleUpdateMatrixSettings(qIdx, kind, itemIdx, value);
    } else {
      const q = questions[qIdx];
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      const baseList = q.settings?.[kind] || (kind === 'rows' ? ['Row 1', 'Row 2'] : ['Column 1', 'Column 2', 'Column 3']);
      const currentList = Array.isArray(langTrans[kind]) ? [...langTrans[kind]] : [...baseList];
      currentList[itemIdx] = value;
      updateQuestion(qIdx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              [kind]: currentList,
            },
          },
        },
      });
    }
  };

  const getSurveyTitleForEdit = () => {
    if (editingLanguage === defaultLanguage) return title;
    return surveyTranslations[editingLanguage]?.title ?? '';
  };

  const setSurveyTitleForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setTitle(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          title: value,
        },
      }));
    }
  };

  const getSurveyDescForEdit = () => {
    if (editingLanguage === defaultLanguage) return description;
    return surveyTranslations[editingLanguage]?.description ?? '';
  };

  const setSurveyDescForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setDescription(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          description: value,
        },
      }));
    }
  };

  const getSurveyWelcomeForEdit = () => {
    if (editingLanguage === defaultLanguage) return welcomeMessage;
    return surveyTranslations[editingLanguage]?.welcomeMessage ?? '';
  };

  const setSurveyWelcomeForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setWelcomeMessage(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          welcomeMessage: value,
        },
      }));
    }
  };

  const getSurveyEndForEdit = () => {
    if (editingLanguage === defaultLanguage) return endMessage;
    return surveyTranslations[editingLanguage]?.endMessage ?? '';
  };

  const setSurveyEndForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setEndMessage(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          endMessage: value,
        },
      }));
    }
  };

  const handleCopyAllFromEnglish = () => {
    if (editingLanguage === defaultLanguage) return;
    setSurveyTranslations((prev) => ({
      ...prev,
      [editingLanguage]: {
        ...(prev[editingLanguage] || {}),
        title,
        description,
        welcomeMessage,
        endMessage,
      },
    }));

    setQuestions((prev) =>
      prev.map((q) => {
        const curTrans = q.settings?.translations || {};
        const langTrans = curTrans[editingLanguage] || {};
        const optMap = {};
        (q.options || []).forEach((o) => {
          optMap[o.code] = o.text;
        });
        return {
          ...q,
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [editingLanguage]: {
                ...langTrans,
                text: q.text,
                helpText: q.helpText,
                options: optMap,
                rows: q.settings?.rows ? [...q.settings.rows] : undefined,
                columns: q.settings?.columns ? [...q.settings.columns] : undefined,
              },
            },
          },
        };
      })
    );
    showToast(`Copied base language text into ${SUPPORTED_LANGUAGES.find((l) => l.code === editingLanguage)?.name}`, 'info');
  };

  // Automatic Machine Translation Handlers
  const handleChooseSurveyLanguage = async (newLang) => {
    setIsTranslating(true);
    const prevLang = defaultLanguage;

    try {
      const sourceLang = 'auto';

      // 1. Survey Title and Messages
      const baseTitle = (title || '').trim();
      const baseDesc = (description || '').trim();
      const baseWelcome = (welcomeMessage || '').trim();
      const baseEnd = (endMessage || '').trim();

      if (baseTitle) {
        const transTitle = await autoTranslateText(baseTitle, newLang, sourceLang);
        const transDesc = baseDesc ? await autoTranslateText(baseDesc, newLang, sourceLang) : '';
        const transWelcome = baseWelcome ? await autoTranslateText(baseWelcome, newLang, sourceLang) : '';
        const transEnd = baseEnd ? await autoTranslateText(baseEnd, newLang, sourceLang) : '';

        setTitle(transTitle);
        setDescription(transDesc);
        setWelcomeMessage(transWelcome);
        setEndMessage(transEnd);

        setSurveyTranslations((prev) => ({
          ...prev,
          [prevLang]: {
            title: baseTitle,
            description: baseDesc,
            welcomeMessage: baseWelcome,
            endMessage: baseEnd,
          },
          [newLang]: {
            title: transTitle,
            description: transDesc,
            welcomeMessage: transWelcome,
            endMessage: transEnd,
          },
        }));
      }

      // 2. All Survey Questions
      const updatedQuestions = await Promise.all(
        questions.map(async (q) => {
          const currentQText = (q.text || '').trim();
          if (!currentQText) return q;

          const currentHelpText = (q.helpText || '').trim();
          const currentOptions = (q.options || []).map((o) => ({ ...o, text: (o.text || '').trim() }));

          const prevOptMap = {};
          currentOptions.forEach((o) => {
            prevOptMap[o.code] = o.text;
          });

          const qToTranslate = {
            ...q,
            text: currentQText,
            helpText: currentHelpText,
            options: currentOptions,
          };

          const translatedQ = await autoTranslateQuestion(qToTranslate, newLang, sourceLang);
          if (translatedQ) {
            const updatedOpts = (q.options || []).map((o) => ({
              ...o,
              text: translatedQ.options?.[o.code] !== undefined ? translatedQ.options[o.code] : o.text,
            }));

            const curTrans = q.settings?.translations || {};

            return {
              ...q,
              text: translatedQ.text || currentQText,
              helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
              options: updatedOpts,
              settings: {
                ...(q.settings || {}),
                translations: {
                  ...curTrans,
                  [prevLang]: {
                    text: currentQText,
                    helpText: currentHelpText,
                    options: prevOptMap,
                    rows: q.settings?.rows,
                    columns: q.settings?.columns,
                  },
                  [newLang]: {
                    text: translatedQ.text || currentQText,
                    helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
                    options: translatedQ.options || {},
                    rows: translatedQ.rows || q.settings?.rows,
                    columns: translatedQ.columns || q.settings?.columns,
                  },
                },
              },
            };
          }
          return q;
        })
      );

      setQuestions(updatedQuestions);
      setDefaultLanguage(newLang);
      setSupportedLanguages([newLang]);
      setEditingLanguage(newLang);
      setPreviewLang(newLang);

      const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === newLang)?.name || newLang;
      showToast(`Survey language set to ${targetLangName}! Questions translated.`, 'success');
    } catch (err) {
      console.error('Error changing survey language:', err);
      showToast('Could not translate all questions.', 'warning');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateSingleQuestion = async (qIndex, targetLang = defaultLanguage) => {
    const q = questions[qIndex];
    if (!q || !q.text?.trim()) {
      showToast('Please enter question text before translating.', 'info');
      return;
    }

    setTranslatingQIdx(qIndex);
    try {
      const curTrans = q.settings?.translations || {};
      const currentQText = (q.text || '').trim();
      const currentHelpText = (q.helpText || '').trim();
      const currentOptions = (q.options || []).map((o) => ({ ...o, text: (o.text || '').trim() }));

      const prevOptMap = {};
      currentOptions.forEach((o) => {
        prevOptMap[o.code] = o.text;
      });

      const qToTranslate = {
        ...q,
        text: currentQText,
        helpText: currentHelpText,
        options: currentOptions,
      };

      const translatedQ = await autoTranslateQuestion(qToTranslate, targetLang, 'auto');
      if (translatedQ) {
        const updatedOpts = (q.options || []).map((o) => ({
          ...o,
          text: translatedQ.options?.[o.code] !== undefined ? translatedQ.options[o.code] : o.text,
        }));

        updateQuestion(qIndex, {
          text: translatedQ.text || currentQText,
          helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
          options: updatedOpts,
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [defaultLanguage]: {
                text: translatedQ.text || currentQText,
                helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
                options: translatedQ.options || {},
                rows: translatedQ.rows || q.settings?.rows,
                columns: translatedQ.columns || q.settings?.columns,
              },
              [targetLang]: {
                text: translatedQ.text || currentQText,
                helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
                options: translatedQ.options || {},
                rows: translatedQ.rows || q.settings?.rows,
                columns: translatedQ.columns || q.settings?.columns,
              },
            },
          },
        });

        const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
        showToast(`Question #${qIndex + 1} translated to ${targetLangName}!`, 'success');
      }
    } catch (err) {
      console.error('Single translation error:', err);
      showToast('Translation service unavailable.', 'error');
    } finally {
      setTranslatingQIdx(null);
    }
  };

  const handleForceTranslateAll = async (targetLang = defaultLanguage) => {
    setIsTranslating(true);
    try {
      const baseTitle = (title || '').trim();
      const baseDesc = (description || '').trim();
      const baseWelcome = (welcomeMessage || '').trim();
      const baseEnd = (endMessage || '').trim();

      if (baseTitle) {
        const transTitle = await autoTranslateText(baseTitle, targetLang, 'auto');
        const transDesc = baseDesc ? await autoTranslateText(baseDesc, targetLang, 'auto') : '';
        const transWelcome = baseWelcome ? await autoTranslateText(baseWelcome, targetLang, 'auto') : '';
        const transEnd = baseEnd ? await autoTranslateText(baseEnd, targetLang, 'auto') : '';

        setTitle(transTitle);
        setDescription(transDesc);
        setWelcomeMessage(transWelcome);
        setEndMessage(transEnd);

        setSurveyTranslations((prev) => ({
          ...prev,
          [targetLang]: {
            title: transTitle,
            description: transDesc,
            welcomeMessage: transWelcome,
            endMessage: transEnd,
          },
        }));
      }

      const updatedQuestions = await Promise.all(
        questions.map(async (q) => {
          const currentQText = (q.text || '').trim();
          if (!currentQText) return q;

          const currentHelpText = (q.helpText || '').trim();
          const currentOptions = (q.options || []).map((o) => ({ ...o, text: (o.text || '').trim() }));

          const qToTranslate = {
            ...q,
            text: currentQText,
            helpText: currentHelpText,
            options: currentOptions,
          };

          const translatedQ = await autoTranslateQuestion(qToTranslate, targetLang, 'auto');
          if (translatedQ) {
            const updatedOpts = (q.options || []).map((o) => ({
              ...o,
              text: translatedQ.options?.[o.code] !== undefined ? translatedQ.options[o.code] : o.text,
            }));

            const curTrans = q.settings?.translations || {};
            return {
              ...q,
              text: translatedQ.text || currentQText,
              helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
              options: updatedOpts,
              settings: {
                ...(q.settings || {}),
                translations: {
                  ...curTrans,
                  [targetLang]: {
                    text: translatedQ.text || currentQText,
                    helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : currentHelpText,
                    options: translatedQ.options || {},
                    rows: translatedQ.rows || q.settings?.rows,
                    columns: translatedQ.columns || q.settings?.columns,
                  },
                },
              },
            };
          }
          return q;
        })
      );

      setQuestions(updatedQuestions);
      const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
      showToast(`All survey questions translated to ${targetLangName}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Translation error occurred.', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePreviewLangChange = async (newLang) => {
    setPreviewLang(newLang);
    if (newLang === defaultLanguage) return;

    // Auto-translate questions missing newLang translation for preview
    const missing = questions.filter(
      (q) => q.text?.trim() && !q.settings?.translations?.[newLang]?.text?.trim()
    );

    if (missing.length > 0) {
      try {
        const updatedQuestions = await Promise.all(
          questions.map(async (q) => {
            const curTrans = q.settings?.translations || {};
            if (curTrans[newLang]?.text?.trim() || !q.text?.trim()) {
              return q;
            }
            const translatedQ = await autoTranslateQuestion(q, newLang, defaultLanguage);
            if (translatedQ) {
              return {
                ...q,
                settings: {
                  ...(q.settings || {}),
                  translations: {
                    ...curTrans,
                    [newLang]: {
                      ...(curTrans[newLang] || {}),
                      text: translatedQ.text || q.text,
                      helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : q.helpText,
                      options: translatedQ.options || {},
                      rows: translatedQ.rows || q.settings?.rows,
                      columns: translatedQ.columns || q.settings?.columns,
                    },
                  },
                },
              };
            }
            return q;
          })
        );
        setQuestions(updatedQuestions);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Dynamic Questions List
  const [questions, setQuestions] = useState([
    {
      id: 'temp-1',
      code: 'Q1',
      text: '',
      type: 'single_choice',
      mandatory: false,
      helpText: '',
      options: [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
      ],
      settings: null,
    },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Floating Toolbar Position Tracking
  const questionCardRefs = useRef([]);
  const questionsContainerRef = useRef(null);
  const [toolbarOffsetTop, setToolbarOffsetTop] = useState(0);

  const updateToolbarPosition = () => {
    const cardEl = questionCardRefs.current[activeQuestionIndex];
    const containerEl = questionsContainerRef.current;
    if (cardEl && containerEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      const relativeTop = cardRect.top - containerRect.top;
      setToolbarOffsetTop(Math.max(0, relativeTop));
    } else if (cardEl) {
      setToolbarOffsetTop(cardEl.offsetTop || 0);
    }
  };

  useEffect(() => {
    updateToolbarPosition();
    const frameId = requestAnimationFrame(updateToolbarPosition);
    const timer = setTimeout(updateToolbarPosition, 60);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [activeQuestionIndex, questions]);

  useEffect(() => {
    const handleResize = () => updateToolbarPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeQuestionIndex]);

  // Voters / Token Management (for existing surveys)
  const [voters, setVoters] = useState([]);
  const [newVoterEmail, setNewVoterEmail] = useState('');
  const [newVoterToken, setNewVoterToken] = useState('');
  const [isUniversalCode, setIsUniversalCode] = useState(false);
  const [newVoterValidFrom, setNewVoterValidFrom] = useState('');
  const [newVoterValidUntil, setNewVoterValidUntil] = useState('');

  // Universal Code Modal
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [universalCustomToken, setUniversalCustomToken] = useState('');
  const [universalValidFrom, setUniversalValidFrom] = useState('');
  const [universalValidUntil, setUniversalValidUntil] = useState('');
  const [isGeneratingUniversal, setIsGeneratingUniversal] = useState(false);

  // Batch Member Generation Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchMemberCount, setBatchMemberCount] = useState(10);
  const [batchValidFrom, setBatchValidFrom] = useState('');
  const [batchValidUntil, setBatchValidUntil] = useState('');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // Edit Schedule Modal for existing voter
  const [isEditVoterModalOpen, setIsEditVoterModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState(null);
  const [editValidFrom, setEditValidFrom] = useState('');
  const [editValidUntil, setEditValidUntil] = useState('');
  const [isSavingEditVoter, setIsSavingEditVoter] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isBatchModalOpen && !isGeneratingBatch) setIsBatchModalOpen(false);
        if (isUniversalModalOpen && !isGeneratingUniversal) setIsUniversalModalOpen(false);
        if (isEditVoterModalOpen && !isSavingEditVoter) setIsEditVoterModalOpen(false);
        if (isQuestionTypeModalOpen) setIsQuestionTypeModalOpen(false);
        if (isFontModalOpen) setIsFontModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBatchModalOpen, isGeneratingBatch, isUniversalModalOpen, isGeneratingUniversal, isEditVoterModalOpen, isSavingEditVoter, isQuestionTypeModalOpen, isFontModalOpen]);

  // Fetch Existing Survey Data
  const fetchSurvey = async () => {
    try {
      const res = await apiClient.get(`/surveys/${id}`);
      if (res.success && res.data.survey) {
        const s = res.data.survey;
        setTitle(s.title || '');
        setDescription(s.description || '');
        setWelcomeMessage(s.welcomeMessage || '');
        setEndMessage(s.endMessage || '');
        setActive(Boolean(s.active));
        setZeroKnowledgeEnabled(
          Boolean(s.zeroKnowledgeEnabled ?? s.zero_knowledge_enabled ?? false)
        );

        if (s.welcomeMessage || s.endMessage) {
          setShowWelcomeCompletion(true);
        }

        const sSettings = s.settings || {};
        if (Array.isArray(sSettings.supportedLanguages) && sSettings.supportedLanguages.length > 0) {
          setSupportedLanguages(sSettings.supportedLanguages);
        }
        if (sSettings.defaultLanguage) {
          setDefaultLanguage(sSettings.defaultLanguage);
        }
        if (sSettings.translations) {
          setSurveyTranslations(sSettings.translations);
        }
        if (sSettings.theme) {
          setTheme((prev) => ({
            ...prev,
            ...sSettings.theme,
            completion: {
              ...prev.completion,
              ...(sSettings.theme.completion || {}),
            },
          }));
        }

        const allQ = [
          ...(s.questions || []),
          ...((s.groups || []).flatMap((g) => g.questions || [])),
        ];

        if (allQ.length > 0) {
          setQuestions(
            allQ.map((q, idx) => ({
              id: q.id,
              code: q.code || `Q${idx + 1}`,
              text: q.text || '',
              type: q.type || 'single_choice',
              mandatory: Boolean(q.mandatory),
              helpText: q.helpText || '',
              options:
                q.options && q.options.length > 0
                  ? q.options.map((o, oIdx) => ({
                      code: o.code || `AO${oIdx + 1}`,
                      text: o.text || '',
                    }))
                  : [
                      { code: 'AO1', text: 'Option 1' },
                      { code: 'AO2', text: 'Option 2' },
                    ],
              settings: q.settings || null,
            }))
          );
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load survey', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoters = async () => {
    if (isNew) return;
    try {
      const res = await apiClient.get(`/surveys/${id}/voters`);
      if (res.success) {
        setVoters(res.data.voters || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isNew) {
      fetchSurvey();
      fetchVoters();
    }
  }, [id, isNew]);

  // Question manipulation helpers
  const updateQuestion = (index, updates) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleAddQuestion = (afterIndex = null, type = 'single_choice') => {
    const newIdx = questions.length + 1;
    let initialOptions = null;
    let initialSettings = null;

    if (['single_choice', 'multiple_choice'].includes(type)) {
      initialOptions = [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
      ];
      initialSettings = { allowMultiple: type === 'multiple_choice' };
    } else if (type === 'ranking') {
      initialOptions = [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
        { code: 'AO3', text: 'Option 3' },
      ];
    } else if (type === 'rating') {
      initialSettings = { minRating: 1, maxRating: 5, minLabel: 'Poor', maxLabel: 'Excellent' };
    }

    const newQ = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `Q${newIdx}`,
      text: '',
      type,
      mandatory: false,
      helpText: '',
      options: initialOptions,
      settings: initialSettings,
    };

    setQuestions((prev) => {
      const insertAt =
        afterIndex !== null && afterIndex >= 0 ? afterIndex + 1 : prev.length;
      const copy = [...prev];
      copy.splice(insertAt, 0, newQ);
      return copy;
    });

    const targetIndex =
      afterIndex !== null && afterIndex >= 0
        ? afterIndex + 1
        : questions.length;
    setActiveQuestionIndex(targetIndex);
  };

  const handleSelectQuestionType = (item, targetIndex = null) => {
    const isChange = questionModalMode === 'change';
    const qIdx = targetIndex !== null ? targetIndex : (isChange ? activeQuestionIndex : null);

    if (isChange && qIdx !== null && qIdx >= 0 && qIdx < questions.length) {
      // Modify the EXISTING question in place (do not add a new question)
      const existingQ = questions[qIdx];
      let newOptions = existingQ.options;
      let newSettings = {
        ...(existingQ.settings || {}),
        ...(item.settings ? JSON.parse(JSON.stringify(item.settings)) : {}),
      };

      // Type-specific option adaptation
      if (item.id === 'gender' || item.id === 'yes_no') {
        newOptions = item.options ? item.options.map((o) => ({ ...o })) : null;
      } else if (['single_choice', 'multiple_choice', 'ranking'].includes(item.type)) {
        if (!newOptions || newOptions.length === 0) {
          if (item.options && item.options.length > 0) {
            newOptions = item.options.map((o) => ({ ...o }));
          } else if (item.type === 'ranking') {
            newOptions = [
              { code: 'AO1', text: 'Option 1' },
              { code: 'AO2', text: 'Option 2' },
              { code: 'AO3', text: 'Option 3' },
            ];
          } else {
            newOptions = [
              { code: 'AO1', text: 'Option 1' },
              { code: 'AO2', text: 'Option 2' },
            ];
          }
        }
      } else if (['short_text', 'long_text', 'numerical_input', 'multiple_numerical_input', 'equation', 'file_upload', 'date_time', 'map_browser'].includes(item.type)) {
        newOptions = null;
      }

      const updatedQ = {
        ...existingQ,
        type: item.type,
        options: newOptions,
        settings: newSettings,
        helpText: existingQ.helpText || item.helpText || '',
      };

      setQuestions((prev) => {
        const copy = [...prev];
        copy[qIdx] = updatedQ;
        return copy;
      });

      setActiveQuestionIndex(qIdx);
      setIsQuestionTypeModalOpen(false);
      setQuestionTypeSearchQuery('');
      showToast(`Question #${qIdx + 1} type changed to ${item.label}!`, 'success');
      return;
    }

    // Add a NEW question
    let initialOptions = item.options ? item.options.map((o) => ({ ...o })) : null;
    let initialSettings = item.settings ? JSON.parse(JSON.stringify(item.settings)) : null;

    if (['single_choice', 'multiple_choice'].includes(item.type) && (!initialOptions || initialOptions.length === 0)) {
      initialOptions = [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
      ];
    } else if (item.type === 'ranking' && (!initialOptions || initialOptions.length === 0)) {
      initialOptions = [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
        { code: 'AO3', text: 'Option 3' },
      ];
    }

    const newIdx = questions.length + 1;
    const newQ = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `Q${newIdx}`,
      text: '',
      type: item.type,
      mandatory: false,
      helpText: item.helpText || '',
      options: initialOptions,
      settings: initialSettings,
    };

    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionIndex(questions.length);
    setIsQuestionTypeModalOpen(false);
    setQuestionTypeSearchQuery('');
    showToast(`Added new question: ${item.label}!`, 'success');
  };

  const handleAddQuestionGroup = (afterIndex = null) => {
    const insertAfter = afterIndex !== null ? afterIndex : targetAddIndex;
    const newIdx = questions.length + 1;
    const groupQ = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `G${newIdx}`,
      text: 'New Question Group',
      type: 'short_text',
      mandatory: false,
      helpText: 'Group description and instructions for this section...',
      options: null,
      settings: { isGroupHeader: true },
    };

    setQuestions((prev) => {
      const insertAt =
        insertAfter !== null && insertAfter >= 0 ? insertAfter + 1 : prev.length;
      const copy = [...prev];
      copy.splice(insertAt, 0, groupQ);
      return copy;
    });

    const targetIndex =
      insertAfter !== null && insertAfter >= 0
        ? insertAfter + 1
        : questions.length;
    setActiveQuestionIndex(targetIndex);
    setIsQuestionTypeModalOpen(false);
    setQuestionTypeSearchQuery('');
    showToast('Question group added successfully!', 'success');
  };

  const filteredQuestionCategories = QUESTION_TYPE_CATEGORIES.map((cat) => {
    if (!questionTypeSearchQuery.trim()) return cat;
    const q = questionTypeSearchQuery.trim().toLowerCase();
    const catMatches = cat.title.toLowerCase().includes(q);
    const matchingItems = cat.items.filter(
      (item) => item.label.toLowerCase().includes(q) || catMatches
    );
    return {
      ...cat,
      items: matchingItems,
    };
  }).filter((cat) => cat.items.length > 0);

  const handleDuplicateQuestion = (index) => {
    const source = questions[index];
    const duplicated = {
      ...source,
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `${source.code}_copy`,
      text: source.text ? `${source.text} (Copy)` : '',
      options: source.options ? source.options.map((o) => ({ ...o })) : [],
      settings: source.settings ? JSON.parse(JSON.stringify(source.settings)) : null,
    };

    setQuestions((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    setActiveQuestionIndex(index + 1);
    showToast('Question duplicated', 'success');
  };

  const handleDeleteQuestion = (index) => {
    if (questions.length <= 1) {
      showToast('A survey must have at least one question.', 'info');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setActiveQuestionIndex((prev) => Math.max(0, Math.min(prev, questions.length - 2)));
    showToast('Question removed', 'info');
  };

  const handleMoveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
    setActiveQuestionIndex(target);
  };

  // Option manipulation helpers for choice questions
  const handleUpdateOption = (qIndex, optIndex, newText) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    if (currentOptions[optIndex]) {
      currentOptions[optIndex] = { ...currentOptions[optIndex], text: newText };
      updateQuestion(qIndex, { options: currentOptions });
    }
  };

  const handleAddOption = (qIndex) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    const nextNum = currentOptions.length + 1;
    currentOptions.push({
      code: `AO${nextNum}`,
      text: `Option ${nextNum}`,
    });
    updateQuestion(qIndex, { options: currentOptions });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    if (currentOptions.length <= 1) {
      showToast('Choice questions require at least one option.', 'info');
      return;
    }
    currentOptions.splice(optIndex, 1);
    updateQuestion(qIndex, { options: currentOptions });
  };

  const handleMoveOption = (qIndex, optIndex, direction) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    const target = optIndex + direction;
    if (target < 0 || target >= currentOptions.length) return;
    const temp = currentOptions[optIndex];
    currentOptions[optIndex] = currentOptions[target];
    currentOptions[target] = temp;
    updateQuestion(qIndex, { options: currentOptions });
  };

  const handleOptionImageChange = (qIndex, optIndex, imageUrl) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    if (currentOptions[optIndex]) {
      currentOptions[optIndex] = { ...currentOptions[optIndex], imageUrl };
      updateQuestion(qIndex, { options: currentOptions });
    }
  };

  const handleAddMultipleShortTextField = (qIndex) => {
    const q = questions[qIndex];
    const currentFields = q.settings?.fields || ['Field 1', 'Field 2'];
    const updated = [...currentFields, `Field ${currentFields.length + 1}`];
    updateQuestion(qIndex, {
      settings: { ...(q.settings || {}), fields: updated },
    });
  };

  const handleRemoveMultipleShortTextField = (qIndex, fieldIdx) => {
    const q = questions[qIndex];
    const currentFields = q.settings?.fields || ['Field 1', 'Field 2'];
    if (currentFields.length <= 1) {
      showToast('Must have at least one text field.', 'info');
      return;
    }
    const updated = currentFields.filter((_, i) => i !== fieldIdx);
    updateQuestion(qIndex, {
      settings: { ...(q.settings || {}), fields: updated },
    });
  };

  const handleUpdateMultipleShortTextField = (qIndex, fieldIdx, value) => {
    const q = questions[qIndex];
    const currentFields = [...(q.settings?.fields || ['Field 1', 'Field 2'])];
    currentFields[fieldIdx] = value;
    updateQuestion(qIndex, {
      settings: { ...(q.settings || {}), fields: currentFields },
    });
  };

  const handleAddMultipleNumericalRow = (qIndex) => {
    const q = questions[qIndex];
    const currentRows = q.settings?.rows || ['Item 1', 'Item 2'];
    const updated = [...currentRows, `Item ${currentRows.length + 1}`];
    updateQuestion(qIndex, {
      settings: { ...(q.settings || {}), rows: updated },
    });
  };

  const handleRemoveMultipleNumericalRow = (qIndex, rowIdx) => {
    const q = questions[qIndex];
    const currentRows = q.settings?.rows || ['Item 1', 'Item 2'];
    if (currentRows.length <= 1) {
      showToast('Must have at least one numerical row.', 'info');
      return;
    }
    const updated = currentRows.filter((_, i) => i !== rowIdx);
    updateQuestion(qIndex, {
      settings: { ...(q.settings || {}), rows: updated },
    });
  };

  const handleUpdateMultipleNumericalRow = (qIndex, rowIdx, value) => {
    const q = questions[qIndex];
    const currentRows = [...(q.settings?.rows || ['Item 1', 'Item 2'])];
    currentRows[rowIdx] = value;
    updateQuestion(qIndex, {
      settings: { ...(q.settings || {}), rows: currentRows },
    });
  };

  // Matrix helpers
  const handleUpdateMatrixSettings = (qIndex, rowOrCol, index, value) => {
    const q = questions[qIndex];
    const currentSettings = q.settings || {
      rows: ['Row 1', 'Row 2'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    };
    const list = [...(currentSettings[rowOrCol] || [])];
    list[index] = value;
    updateQuestion(qIndex, {
      settings: { ...currentSettings, [rowOrCol]: list },
    });
  };

  const handleAddMatrixItem = (qIndex, rowOrCol) => {
    const q = questions[qIndex];
    const currentSettings = q.settings || {
      rows: ['Row 1', 'Row 2'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    };
    const list = [...(currentSettings[rowOrCol] || [])];
    const label = rowOrCol === 'rows' ? `Row ${list.length + 1}` : `Column ${list.length + 1}`;
    list.push(label);
    updateQuestion(qIndex, {
      settings: { ...currentSettings, [rowOrCol]: list },
    });
  };

  const handleRemoveMatrixItem = (qIndex, rowOrCol, index) => {
    const q = questions[qIndex];
    const currentSettings = q.settings || {
      rows: ['Row 1', 'Row 2'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    };
    const list = [...(currentSettings[rowOrCol] || [])];
    if (list.length <= 1) {
      showToast(`Matrix must have at least one ${rowOrCol.slice(0, -1)}.`, 'info');
      return;
    }
    list.splice(index, 1);
    updateQuestion(qIndex, {
      settings: { ...currentSettings, [rowOrCol]: list },
    });
  };

  // Single-Step Unified Save
  const handleSaveSurvey = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!title.trim()) {
      showToast('Survey Title is required before saving.', 'error');
      return;
    }

    // Validate that questions have non-empty text
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        showToast(`Question #${i + 1} is missing question text.`, 'error');
        setActiveQuestionIndex(i);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        welcomeMessage: welcomeMessage.trim(),
        endMessage: endMessage.trim(),
        active,
        zeroKnowledgeEnabled,
        zero_knowledge_enabled: zeroKnowledgeEnabled,
        settings: {
          supportedLanguages,
          defaultLanguage,
          translations: surveyTranslations,
          theme,
        },
        questions: questions.map((q, idx) => ({
          id: q.id && !String(q.id).startsWith('temp-') ? q.id : undefined,
          code: q.code ? q.code.trim() : `Q${idx + 1}`,
          text: q.text.trim(),
          type: q.type,
          mandatory: Boolean(q.mandatory),
          helpText: q.helpText ? q.helpText.trim() : '',
          sortOrder: idx + 1,
          options: Array.isArray(q.options) && q.options.length > 0
            ? q.options.map((opt, oIdx) => ({
                code: opt.code || `AO${oIdx + 1}`,
                text: (opt.text || '').trim(),
                sortOrder: oIdx + 1,
              }))
            : [],
          settings: q.settings || null,
        })),
      };

      if (isNew) {
        const res = await apiClient.post('/surveys', payload);
        showToast('Survey and questions created successfully!', 'success');
        navigate(`/admin/surveys/${res.data.survey.id}/edit`);
      } else {
        await apiClient.put(`/surveys/${id}`, payload);
        showToast('Survey and questions successfully updated!', 'success');
        fetchSurvey();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save survey', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Voter management handlers
  const handleAddVoter = async (e) => {
    e.preventDefault();
    if (newVoterValidFrom && newVoterValidUntil && new Date(newVoterValidFrom) >= new Date(newVoterValidUntil)) {
      showToast('The start time must be before the deadline.', 'error');
      return;
    }
    try {
      await apiClient.post(`/surveys/${id}/voters`, {
        email: newVoterEmail.trim() || undefined,
        token: newVoterToken.trim() || undefined,
        isUniversal: isUniversalCode,
        validFrom: newVoterValidFrom ? new Date(newVoterValidFrom).toISOString() : undefined,
        validUntil: newVoterValidUntil ? new Date(newVoterValidUntil).toISOString() : undefined,
      });
      showToast(
        isUniversalCode
          ? 'Universal access code created for all participants!'
          : 'Voter access code created!',
        'success'
      );
      setNewVoterEmail('');
      setNewVoterToken('');
      setNewVoterValidFrom('');
      setNewVoterValidUntil('');
      setIsUniversalCode(false);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to add access code', 'error');
    }
  };

  const handleOpenUniversalModal = () => {
    setUniversalCustomToken('');
    setUniversalValidFrom('');
    setUniversalValidUntil('');
    setIsUniversalModalOpen(true);
  };

  const handleCloseUniversalModal = () => {
    if (!isGeneratingUniversal) {
      setIsUniversalModalOpen(false);
    }
  };

  const handleConfirmGenerateUniversal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (universalValidFrom && universalValidUntil && new Date(universalValidFrom) >= new Date(universalValidUntil)) {
      showToast('The start time must be before the deadline.', 'error');
      return;
    }
    setIsGeneratingUniversal(true);
    try {
      await apiClient.post(`/surveys/${id}/voters/universal`, {
        token: universalCustomToken.trim() || undefined,
        validFrom: universalValidFrom ? new Date(universalValidFrom).toISOString() : undefined,
        validUntil: universalValidUntil ? new Date(universalValidUntil).toISOString() : undefined,
      });
      showToast('Universal access code generated with schedule!', 'success');
      setIsUniversalModalOpen(false);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to generate universal access code', 'error');
    } finally {
      setIsGeneratingUniversal(false);
    }
  };

  const handleOpenBatchModal = () => {
    setBatchMemberCount(10);
    setBatchValidFrom('');
    setBatchValidUntil('');
    setIsBatchModalOpen(true);
  };

  const handleCloseBatchModal = () => {
    if (!isGeneratingBatch) {
      setIsBatchModalOpen(false);
    }
  };

  const handleConfirmBatchGenerate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const count = parseInt(batchMemberCount, 10);
    if (isNaN(count) || count < 1) {
      showToast('Please enter a valid number of members (at least 1).', 'error');
      return;
    }
    if (count > 500) {
      showToast('Please specify 500 or fewer members per batch.', 'error');
      return;
    }
    if (batchValidFrom && batchValidUntil && new Date(batchValidFrom) >= new Date(batchValidUntil)) {
      showToast('The start time must be before the deadline.', 'error');
      return;
    }

    setIsGeneratingBatch(true);
    try {
      await apiClient.post(`/surveys/${id}/voters/batch`, {
        count,
        validFrom: batchValidFrom ? new Date(batchValidFrom).toISOString() : undefined,
        validUntil: batchValidUntil ? new Date(batchValidUntil).toISOString() : undefined,
      });
      showToast(
        `Generated ${count} single-use access code${count === 1 ? '' : 's'} with schedule!`,
        'success'
      );
      setIsBatchModalOpen(false);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to generate batch codes', 'error');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleOpenEditVoterModal = (voter) => {
    setEditingVoter(voter);
    setEditValidFrom(toDatetimeLocalValue(voter.validFrom));
    setEditValidUntil(toDatetimeLocalValue(voter.validUntil));
    setIsEditVoterModalOpen(true);
  };

  const handleCloseEditVoterModal = () => {
    if (!isSavingEditVoter) {
      setIsEditVoterModalOpen(false);
      setEditingVoter(null);
    }
  };

  const handleSaveEditVoter = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingVoter) return;

    if (editValidFrom && editValidUntil && new Date(editValidFrom) >= new Date(editValidUntil)) {
      showToast('The start time must be before the deadline.', 'error');
      return;
    }

    setIsSavingEditVoter(true);
    try {
      await apiClient.patch(`/voters/${editingVoter.id || editingVoter.voterId}`, {
        validFrom: editValidFrom ? new Date(editValidFrom).toISOString() : null,
        validUntil: editValidUntil ? new Date(editValidUntil).toISOString() : null,
      });
      showToast('Access code start time and deadline updated!', 'success');
      setIsEditVoterModalOpen(false);
      setEditingVoter(null);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to update access code schedule', 'error');
    } finally {
      setIsSavingEditVoter(false);
    }
  };

  const handleDeleteVoter = async (voterId) => {
    try {
      setVoters((prev) => prev.filter((v) => v.id !== voterId && v.voterId !== voterId));
      await apiClient.delete(`/voters/${voterId}`);
      showToast('Access code removed successfully', 'info');
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to delete access code', 'error');
      fetchVoters();
    }
  };

  const handleCopyText = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`Copied ${label} to clipboard!`, 'success');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 16px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="ls-card" style={{ padding: '32px' }}>
            <div className="ls-skeleton" style={{ width: '40%', marginBottom: '20px' }} />
            <div className="ls-skeleton" style={{ width: '90%', marginBottom: '14px' }} />
            <div className="ls-skeleton" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '32px 16px 90px 16px',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
        {/* Sticky Action Bar */}
        <div
          style={{
            position: 'sticky',
            top: '0px',
            zIndex: 40,
            backgroundColor: 'rgba(248, 250, 252, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '12px 0 16px 0',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/admin/surveys"
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{ color: '#475569', borderColor: '#cbd5e1' }}
              title="Return to Surveys Management"
            >
              <i className="ri-arrow-left-line" /> Surveys
            </Link>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isNew ? 'Create New Survey' : 'Edit Survey'}
            </h1>
            <span
              className="ls-badge"
              style={{
                backgroundColor: '#e2e8f0',
                color: '#334155',
                fontWeight: 600,
                fontSize: '12px',
                padding: '3px 8px',
              }}
            >
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isNew && (
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#e2e8f0',
                  padding: '2px',
                  borderRadius: '6px',
                  marginRight: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'builder' ? '#ffffff' : 'transparent',
                    color: activeTab === 'builder' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'builder' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className="ri-survey-line" /> Form Builder
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('voters')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'voters' ? '#ffffff' : 'transparent',
                    color: activeTab === 'voters' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'voters' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className="ri-group-line" /> Access Codes ({voters.length})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="ls-btn ls-btn-outline ls-btn-sm"
              title="Customize Organization Branding, Logo, Accent Color & Completion Redirection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#334155',
                borderColor: '#cbd5e1',
              }}
            >
              <i className="ri-palette-line" style={{ color: theme.accentColor || '#10b981', fontSize: '15px' }} />
              Theme & Branding
              {theme.logoUrl && (
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: theme.accentColor || '#10b981' }} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="ls-btn ls-btn-outline ls-btn-sm"
              title="Preview Questionnaire"
              style={{ color: '#334155', borderColor: '#cbd5e1' }}
            >
              <i className="ri-eye-line" /> Preview
            </button>

            <Link
              to="/admin/surveys"
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{ color: '#64748b', borderColor: '#cbd5e1' }}
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSaveSurvey}
              disabled={isSaving}
              className="ls-btn ls-btn-primary ls-btn-sm"
              style={{
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                color: '#ffffff',
                fontWeight: 600,
                minWidth: '150px',
              }}
            >
              {isSaving ? (
                <>
                  <i className="ri-loader-4-line ri-spin" /> Saving...
                </>
              ) : (
                <>
                  <i className="ri-check-line" /> {active ? 'Save & Deploy Survey' : 'Save Survey'}
                </>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'builder' ? (
          <>
            {/* Multilingual Translation Bar */}
            <div
              className="ls-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ri-translate-2" style={{ color: '#10b981', fontSize: '17px' }} />
                  Survey Language:
                </span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    padding: '5px 12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <i className="ri-global-line" style={{ fontSize: '14px' }} />
                  <span>
                    {(SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage) || { name: 'English', nativeName: 'English' }).name} ({ (SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage) || { name: 'English', nativeName: 'English' }).nativeName })
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                    borderColor: '#cbd5e1',
                  }}
                >
                  <i className="ri-settings-3-line" /> Manage Languages
                </button>
              </div>
            </div>

            {/* Translation Mode Banner */}
            {defaultLanguage !== 'en' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 16px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#1e40af',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ri-translate-2" style={{ fontSize: '16px' }} />
                  <span>
                    Survey language is <strong>{SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name} ({SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.nativeName})</strong>. Questions and options are translated into this language.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isTranslating ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
                      <i className="ri-loader-4-line ri-spin" /> Translating...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleForceTranslateAll(defaultLanguage)}
                      className="ls-btn ls-btn-outline ls-btn-sm"
                      style={{ fontSize: '12px', padding: '3px 8px', borderColor: '#93c5fd', color: '#1e40af' }}
                      title="Re-translate all questions and options"
                    >
                      <i className="ri-sparkling-fill" style={{ marginRight: '4px', color: '#3b82f6' }} /> Re-translate All
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Google Forms Header Card */}
            <div
              className="ls-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderTop: `5px solid ${theme.accentColor || '#10b981'}`,
                borderRadius: '8px',
                padding: '28px 32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                marginBottom: '20px',
                transition: 'all 0.2s ease',
              }}
            >
              {theme.showLogo && theme.logoUrl && (
                <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <img
                    src={theme.logoUrl}
                    alt="Brand Logo"
                    style={{ maxHeight: '48px', maxWidth: '180px', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsThemeModalOpen(true)}
                    className="ls-btn ls-btn-outline ls-btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', color: '#64748b' }}
                  >
                    <i className="ri-pencil-line" /> Edit Branding
                  </button>
                </div>
              )}
              <input
                type="text"
                placeholder={
                  editingLanguage === defaultLanguage
                    ? 'Survey Title (e.g. Employee Engagement Q3 2026)'
                    : (title ? `Translate: ${title}` : 'Translated Survey Title')
                }
                value={getSurveyTitleForEdit()}
                onChange={(e) => setSurveyTitleForEdit(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#0f172a',
                  border: 'none',
                  borderBottom: '2px solid #e2e8f0',
                  padding: '6px 0',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderBottomColor = '#e2e8f0')}
              />

              <textarea
                placeholder={
                  editingLanguage === defaultLanguage
                    ? 'Survey description or instructions for participants...'
                    : (description ? `Translate: ${description}` : 'Translated survey description...')
                }
                rows={2}
                value={getSurveyDescForEdit()}
                onChange={(e) => setSurveyDescForEdit(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  color: '#475569',
                  border: 'none',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '10px 0',
                  outline: 'none',
                  marginTop: '12px',
                  resize: 'vertical',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderBottomColor = '#e2e8f0')}
              />

              {/* Collapsible Accordion Toggle for Welcome & Completion Messages */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWelcomeCompletion(!showWelcomeCompletion)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.accentColor || '#10b981',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0',
                  }}
                >
                  <i className={showWelcomeCompletion ? 'ri-subtract-line' : 'ri-add-line'} />
                  {showWelcomeCompletion
                    ? 'Hide Welcome & Completion Messages'
                    : '+ Configure Welcome & Completion Messages'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.accentColor || '#10b981',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0',
                  }}
                >
                  <i className="ri-palette-line" />
                  Customize Theme, Logo & Redirect
                </button>
              </div>

                {showWelcomeCompletion && (
                  <div
                    style={{
                      marginTop: '16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#334155',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        Welcome Message
                      </label>
                      <textarea
                        rows={2}
                        className="ls-textarea"
                        placeholder={
                          editingLanguage === defaultLanguage
                            ? 'Displayed before participants start answering...'
                            : (welcomeMessage ? `Translate: ${welcomeMessage}` : 'Translated welcome message...')
                        }
                        value={getSurveyWelcomeForEdit()}
                        onChange={(e) => setSurveyWelcomeForEdit(e.target.value)}
                        style={{ fontSize: '13px', backgroundColor: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#334155',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        End / Completion Message
                      </label>
                      <textarea
                        rows={2}
                        className="ls-textarea"
                        placeholder={
                          editingLanguage === defaultLanguage
                            ? 'Thank you message upon questionnaire submission...'
                            : (endMessage ? `Translate: ${endMessage}` : 'Translated end message...')
                        }
                        value={getSurveyEndForEdit()}
                        onChange={(e) => setSurveyEndForEdit(e.target.value)}
                        style={{ fontSize: '13px', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>
                )}
              </div>

            {/* Questions Canvas & Floating Toolbar */}
            <div ref={questionsContainerRef} style={{ position: 'relative' }}>
              {/* Floating Quick Action Toolbar (Tracks Active Card) */}
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(100% + 14px)',
                  top: '0px',
                  transform: `translateY(${toolbarOffsetTop}px)`,
                  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '9999px',
                  padding: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  zIndex: 25,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setQuestionModalMode('change');
                    setTargetAddIndex(activeQuestionIndex);
                    setIsQuestionTypeModalOpen(true);
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Change Question Type"
                >
                  <i className="ri-add-line" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFontModalOpen(true)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: theme.fontFamily ? '#eef2ff' : '#f1f5f9',
                    color: theme.fontFamily ? '#6366f1' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                  title="Select Question Text Font"
                >
                  Tt
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                  title="Preview Survey Modal"
                >
                  <i className="ri-eye-line" />
                </button>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions.map((q, idx) => {
                  const isActive = activeQuestionIndex === idx;

                  return (
                    <div
                      key={q.id || idx}
                      ref={(el) => (questionCardRefs.current[idx] = el)}
                      onClick={() => setActiveQuestionIndex(idx)}
                      onFocusCapture={() => setActiveQuestionIndex(idx)}
                      className="ls-card"
                      style={{
                        position: 'relative',
                        backgroundColor: '#ffffff',
                        border: '1px solid',
                        borderColor: isActive ? '#cbd5e1' : '#e2e8f0',
                        borderLeft: isActive ? '5px solid #10b981' : '5px solid transparent',
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: isActive
                          ? '0 6px 16px rgba(16, 185, 129, 0.12)'
                          : '0 1px 3px rgba(0, 0, 0, 0.04)',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, border-left-color 0.2s ease',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Question Top Row: Full-Width Question Text with Type Badge (Question Type Box moved to Plus Button) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          marginBottom: '16px',
                          width: '100%',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#10b981',
                            paddingTop: '10px',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}.
                        </span>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#6366f1',
                                backgroundColor: '#eef2ff',
                                border: '1px solid #e0e7ff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="ri-questionnaire-line" />
                              {getQuestionTypeBadgeLabel(q.type, q.settings)}
                            </span>
                            {theme.fontName && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#64748b',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #f1f5f9',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontFamily: theme.fontFamily || 'inherit',
                                }}
                              >
                                Font: {theme.fontName}
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder={
                              editingLanguage === defaultLanguage
                                ? 'Question text (e.g. How satisfied are you with team communication?)'
                                : (q.text ? `Translate: ${q.text}` : 'Question translation...')
                            }
                            value={getQuestionTextForEdit(q)}
                            onChange={(e) => setQuestionTextForEdit(idx, e.target.value)}
                            style={{
                              width: '100%',
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              outline: 'none',
                              fontFamily: theme.fontFamily || 'inherit',
                              transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                            onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                          />

                          {defaultLanguage !== 'en' && q.text && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                fontSize: '12px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                color: '#475569',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong style={{ color: '#0f172a' }}>Survey Language:</strong> {SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTranslateSingleQuestion(idx, defaultLanguage)}
                                disabled={translatingQIdx === idx || isTranslating}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#059669',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0,
                                  padding: '2px 4px',
                                }}
                                title={`Auto-translate into ${SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name}`}
                              >
                                {translatingQIdx === idx ? (
                                  <>
                                    <i className="ri-loader-4-line ri-spin" /> Translating...
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-sparkling-fill" style={{ color: '#10b981' }} /> Auto-Translate to {SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name}
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {q.helpText !== undefined && (
                            <input
                              type="text"
                              placeholder={
                                editingLanguage === defaultLanguage
                                  ? 'Optional description / helper instructions...'
                                  : (q.helpText ? `Translate: ${q.helpText}` : 'Help text translation...')
                              }
                              value={getQuestionHelpForEdit(q)}
                              onChange={(e) => setQuestionHelpForEdit(idx, e.target.value)}
                              style={{
                                width: '100%',
                                fontSize: '13px',
                                color: '#64748b',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                outline: 'none',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                                fontFamily: theme.fontFamily || 'inherit',
                              }}
                            />
                          )}

                          {zeroKnowledgeEnabled && q.type === 'long_text' && (
                            <div
                              style={{
                                marginTop: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                alignSelf: 'flex-start',
                              }}
                            >
                              <i className="ri-shield-keyhole-line" />
                              ZK Ghost Comment: voter profile decoupled on submission
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Options Preview & Builder */}
                      <div style={{ padding: '8px 0 16px 24px' }}>
                        {/* 1. Short Text Preview */}
                        {q.type === 'short_text' && (
                          <div
                            style={{
                              width: '60%',
                              padding: '8px 0',
                              borderBottom: '1px dashed #94a3b8',
                              color: '#94a3b8',
                              fontSize: '14px',
                            }}
                          >
                            Short answer text preview
                          </div>
                        )}

                        {/* 2. Long Text / Comment Preview */}
                        {q.type === 'long_text' && (
                          <div
                            style={{
                              width: '85%',
                              height: '60px',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '10px',
                              color: '#94a3b8',
                              fontSize: '13px',
                              backgroundColor: '#f8fafc',
                            }}
                          >
                            Long feedback / commentary text preview...
                          </div>
                        )}

                        {/* 3 & 4. Multiple Choice & Checkboxes Options Builder */}
                        {['single_choice', 'multiple_choice'].includes(q.type) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Selection Mode Control (Single vs Multiple) */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px',
                                padding: '8px 12px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                width: 'fit-content',
                                marginBottom: '2px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#475569',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <i className="ri-list-check-2" style={{ color: '#10b981', fontSize: '15px' }} />
                                Selection Mode:
                              </span>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  gap: '2px',
                                  backgroundColor: '#e2e8f0',
                                  padding: '2px',
                                  borderRadius: '6px',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuestion(idx, {
                                      type: 'single_choice',
                                      settings: { ...(q.settings || {}), allowMultiple: false },
                                    })
                                  }
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor:
                                      !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                        ? '#ffffff'
                                        : 'transparent',
                                    color:
                                      !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                        ? '#0f172a'
                                        : '#64748b',
                                    boxShadow:
                                      !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                        ? '0 1px 3px rgba(0,0,0,0.08)'
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <i
                                    className="ri-radio-button-line"
                                    style={{
                                      color:
                                        !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                          ? '#10b981'
                                          : '#94a3b8',
                                    }}
                                  />
                                  Single selection (Radio)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuestion(idx, {
                                      type: 'multiple_choice',
                                      settings: { ...(q.settings || {}), allowMultiple: true },
                                    })
                                  }
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor:
                                      q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                        ? '#ffffff'
                                        : 'transparent',
                                    color:
                                      q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                        ? '#0f172a'
                                        : '#64748b',
                                    boxShadow:
                                      q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                        ? '0 1px 3px rgba(0,0,0,0.08)'
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <i
                                    className="ri-checkbox-line"
                                    style={{
                                      color:
                                        q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                          ? '#10b981'
                                          : '#94a3b8',
                                    }}
                                  />
                                  Multiple selections (Checkboxes)
                                </button>
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                                {q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                  ? '• Voters can select multiple options'
                                  : '• Voters can select only one option'}
                              </span>
                            </div>

                            {(q.options || []).map((opt, oIdx) => {
                              const isMulti = q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple);
                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                  }}
                                >
                                  {isMulti ? (
                                    <i
                                      className="ri-checkbox-blank-line"
                                      style={{ color: '#94a3b8', fontSize: '18px' }}
                                    />
                                  ) : (
                                    <i
                                      className="ri-radio-button-line"
                                      style={{ color: '#94a3b8', fontSize: '18px' }}
                                    />
                                  )}
                                  <input
                                    type="text"
                                    value={getOptionTextForEdit(q, opt)}
                                    onChange={(e) => setOptionTextForEdit(idx, oIdx, e.target.value)}
                                    placeholder={
                                      editingLanguage === defaultLanguage
                                        ? `Option ${oIdx + 1}`
                                        : (opt.text ? `Translate: ${opt.text}` : `Option ${oIdx + 1} translation`)
                                    }
                                    style={{
                                      flex: 1,
                                      maxWidth: '460px',
                                      padding: '6px 10px',
                                      fontSize: '14px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      outline: 'none',
                                      fontFamily: 'inherit',
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                                  />
                                  {q.settings?.displayType === 'image_select' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {opt.imageUrl && (
                                        <img
                                          src={opt.imageUrl}
                                          alt="Preview"
                                          style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        />
                                      )}
                                      <input
                                        type="text"
                                        value={opt.imageUrl || ''}
                                        placeholder="Image URL (https://...)"
                                        onChange={(e) => handleOptionImageChange(idx, oIdx, e.target.value)}
                                        style={{ width: '160px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                      />
                                    </div>
                                  )}
                                  {(q.options || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(idx, oIdx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                      }}
                                      title="Remove Option"
                                    >
                                      <i className="ri-close-line" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleAddOption(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="ri-add-line" /> Add Option
                              </button>

                              {q.settings?.hasOtherComment && (
                                <span style={{ fontSize: '12px', color: '#6366f1', backgroundColor: '#eef2ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="ri-chat-1-line" /> Includes &ldquo;Other / Comments&rdquo; Field
                                </span>
                              )}
                              {q.settings?.displayType === 'dropdown' && (
                                <span style={{ fontSize: '12px', color: '#6366f1', backgroundColor: '#eef2ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="ri-arrow-down-s-line" /> Dropdown Menu Display
                                </span>
                              )}
                              {q.settings?.displayType === 'button_group' && (
                                <span style={{ fontSize: '12px', color: '#0284c7', backgroundColor: '#f0f9ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="ri-shape-line" /> Segmented Button Pills Display
                                </span>
                              )}
                              {q.settings?.displayType === 'gender_cards' && (
                                <span style={{ fontSize: '12px', color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="ri-user-smile-line" /> Gender Selection Cards
                                </span>
                              )}
                              {q.settings?.displayType === 'image_select' && (
                                <span style={{ fontSize: '12px', color: '#0d9488', backgroundColor: '#f0fdfa', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="ri-image-line" /> Image Select Cards Display
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 4.5 Ranking / Preference Options Builder */}
                        {q.type === 'ranking' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#166534',
                                width: 'fit-content',
                                marginBottom: '4px',
                              }}
                            >
                              <i className="ri-arrow-up-down-line" style={{ fontSize: '15px', color: '#10b981' }} />
                              <span>
                                <strong>Ranked-Choice Voting:</strong> Voters will rank these items (1st to {Math.max(1, (q.options || []).length)}) via drag &amp; drop or number selectors.
                              </span>
                            </div>

                            {(q.options || []).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '28px',
                                    borderRadius: '5px',
                                    backgroundColor: oIdx === 0 ? '#10b981' : '#f1f5f9',
                                    color: oIdx === 0 ? '#ffffff' : '#475569',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    border: oIdx === 0 ? '1px solid #059669' : '1px solid #cbd5e1',
                                  }}
                                  title={`Default position #${oIdx + 1}`}
                                >
                                  #{oIdx + 1}
                                </span>
                                <i
                                  className="ri-draggable"
                                  style={{ color: '#94a3b8', fontSize: '18px', cursor: 'grab' }}
                                  title="Drag handle"
                                />
                                <input
                                  type="text"
                                  value={getOptionTextForEdit(q, opt)}
                                  onChange={(e) => setOptionTextForEdit(idx, oIdx, e.target.value)}
                                  placeholder={
                                    editingLanguage === defaultLanguage
                                      ? `Item ${oIdx + 1} to rank...`
                                      : (opt.text ? `Translate: ${opt.text}` : `Item ${oIdx + 1} translation`)
                                  }
                                  style={{
                                    flex: 1,
                                    maxWidth: '460px',
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                                />
                                <div style={{ display: 'inline-flex', gap: '2px' }}>
                                  <button
                                    type="button"
                                    disabled={oIdx === 0}
                                    onClick={() => handleMoveOption(idx, oIdx, -1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      backgroundColor: oIdx === 0 ? '#f8fafc' : '#ffffff',
                                      color: oIdx === 0 ? '#cbd5e1' : '#64748b',
                                      cursor: oIdx === 0 ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                    }}
                                    title="Move Item Up"
                                  >
                                    <i className="ri-arrow-up-s-line" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={oIdx === (q.options || []).length - 1}
                                    onClick={() => handleMoveOption(idx, oIdx, 1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      backgroundColor: oIdx === (q.options || []).length - 1 ? '#f8fafc' : '#ffffff',
                                      color: oIdx === (q.options || []).length - 1 ? '#cbd5e1' : '#64748b',
                                      cursor: oIdx === (q.options || []).length - 1 ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                    }}
                                    title="Move Item Down"
                                  >
                                    <i className="ri-arrow-down-s-line" />
                                  </button>
                                </div>
                                {(q.options || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx, oIdx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      fontSize: '18px',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                    title="Remove Item"
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                )}
                              </div>
                            ))}

                            <div style={{ marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleAddOption(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="ri-add-line" /> Add Item to Rank
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 5. Rating (1-5) Scale Preview */}
                        {q.type === 'rating' && (
                          <div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <div
                                  key={num}
                                  style={{
                                    width: '46px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                  }}
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '270px',
                                fontSize: '12px',
                                color: '#64748b',
                              }}
                            >
                              <span>1 = Poor</span>
                              <span>5 = Excellent</span>
                            </div>
                          </div>
                        )}

                        {/* 6. Matrix / Grid Builder */}
                        {q.type === 'matrix' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '14px',
                              maxWidth: '620px',
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              {/* Rows */}
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                                  Rows (Statements)
                                </span>
                                {(q.settings?.rows || ['Row 1', 'Row 2']).map((row, rIdx) => (
                                  <div key={rIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                    <input
                                      type="text"
                                      value={getMatrixItemForEdit(q, 'rows', rIdx, row)}
                                      onChange={(e) => setMatrixItemForEdit(idx, 'rows', rIdx, e.target.value)}
                                      placeholder={editingLanguage === defaultLanguage ? 'Statement label' : `Translate: ${row}`}
                                      style={{ flex: 1, padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMatrixItem(idx, 'rows', rIdx)}
                                      style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddMatrixItem(idx, 'rows')}
                                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  + Add Row
                                </button>
                              </div>

                              {/* Columns */}
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                                  Columns (Scale Labels)
                                </span>
                                {(q.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col, cIdx) => (
                                  <div key={cIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                    <input
                                      type="text"
                                      value={getMatrixItemForEdit(q, 'columns', cIdx, col)}
                                      onChange={(e) => setMatrixItemForEdit(idx, 'columns', cIdx, e.target.value)}
                                      placeholder={editingLanguage === defaultLanguage ? 'Scale label' : `Translate: ${col}`}
                                      style={{ flex: 1, padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMatrixItem(idx, 'columns', cIdx)}
                                      style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddMatrixItem(idx, 'columns')}
                                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  + Add Column
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 7. File Upload / Media Attachments Builder */}
                        {q.type === 'file_upload' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Visual Preview Box */}
                            <div
                              style={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: '8px',
                                padding: '20px 16px',
                                textAlign: 'center',
                                backgroundColor: '#f8fafc',
                                maxWidth: '640px',
                              }}
                            >
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  backgroundColor: '#ecfdf5',
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '22px',
                                  margin: '0 auto 8px auto',
                                }}
                              >
                                <i className="ri-upload-cloud-2-line" />
                              </div>
                              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                                Drag &amp; drop media files here, or click to browse
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                {(q.settings?.allowedTypes || 'all') === 'images' && 'Images only (PNG, JPG, WebP, SVG, GIF)'}
                                {(q.settings?.allowedTypes || 'all') === 'documents' && 'Documents (PDF, DOCX, XLSX, TXT)'}
                                {(q.settings?.allowedTypes || 'all') === 'media' && 'Media (MP3, WAV, MP4, WebM)'}
                                {(q.settings?.allowedTypes || 'all') === 'all' && 'All formats accepted (Images, PDFs, Documents, Media)'}
                                {` • Max ${q.settings?.maxFileSize || 10} MB • Up to ${q.settings?.maxFiles || 3} file${(q.settings?.maxFiles || 3) > 1 ? 's' : ''}`}
                              </div>
                            </div>

                            {/* Configuration Toolbar */}
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                padding: '12px 14px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                maxWidth: '640px',
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="ri-settings-4-line" style={{ color: '#10b981', marginRight: '5px' }} />
                                File Upload Configuration
                              </div>

                              {/* Allowed Types */}
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Allowed File Types:
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {[
                                    { id: 'all', label: 'All Formats', icon: 'ri-file-line' },
                                    { id: 'images', label: 'Images Only', icon: 'ri-image-line' },
                                    { id: 'documents', label: 'Documents & PDFs', icon: 'ri-file-text-line' },
                                    { id: 'media', label: 'Audio & Video', icon: 'ri-film-line' },
                                  ].map((cat) => {
                                    const isSelected = (q.settings?.allowedTypes || 'all') === cat.id;
                                    return (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() =>
                                          updateQuestion(idx, {
                                            settings: { ...(q.settings || {}), allowedTypes: cat.id },
                                          })
                                        }
                                        style={{
                                          padding: '5px 10px',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          borderRadius: '6px',
                                          border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                                          backgroundColor: isSelected ? '#ecfdf5' : '#f8fafc',
                                          color: isSelected ? '#065f46' : '#475569',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <i className={cat.icon} />
                                        {cat.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Limits: Max Size & Max Files */}
                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                                <div style={{ flex: '1 1 180px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Max Size per File:
                                  </label>
                                  <select
                                    className="ls-select"
                                    value={q.settings?.maxFileSize || 10}
                                    onChange={(e) =>
                                      updateQuestion(idx, {
                                        settings: { ...(q.settings || {}), maxFileSize: parseInt(e.target.value, 10) },
                                      })
                                    }
                                    style={{ padding: '6px 10px', fontSize: '13px' }}
                                  >
                                    <option value="5">5 MB</option>
                                    <option value="10">10 MB (Recommended)</option>
                                    <option value="25">25 MB</option>
                                    <option value="50">50 MB</option>
                                  </select>
                                </div>

                                <div style={{ flex: '1 1 180px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Max Number of Files:
                                  </label>
                                  <select
                                    className="ls-select"
                                    value={q.settings?.maxFiles || 3}
                                    onChange={(e) =>
                                      updateQuestion(idx, {
                                        settings: { ...(q.settings || {}), maxFiles: parseInt(e.target.value, 10) },
                                      })
                                    }
                                    style={{ padding: '6px 10px', fontSize: '13px' }}
                                  >
                                    <option value="1">1 File (Single attachment)</option>
                                    <option value="3">Up to 3 Files</option>
                                    <option value="5">Up to 5 Files</option>
                                    <option value="10">Up to 10 Files</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 8. Yes / No Switch Builder */}
                        {q.type === 'yes_no' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                              Binary Yes/No Switch (Standard Green / Red Choice)
                            </div>
                            <div style={{ display: 'flex', gap: '12px', maxWidth: '360px' }}>
                              <button
                                type="button"
                                disabled
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  borderRadius: '6px',
                                  border: '1px solid #10b981',
                                  backgroundColor: '#ecfdf5',
                                  color: '#065f46',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: 'default',
                                }}
                              >
                                <i className="ri-check-line" style={{ fontSize: '18px' }} />
                                Yes
                              </button>
                              <button
                                type="button"
                                disabled
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  borderRadius: '6px',
                                  border: '1px solid #ef4444',
                                  backgroundColor: '#fef2f2',
                                  color: '#991b1b',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: 'default',
                                }}
                              >
                                <i className="ri-close-line" style={{ fontSize: '18px' }} />
                                No
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 9. Map / Browser Detection Location Builder */}
                        {q.type === 'map_browser' && (
                          <div
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '16px',
                              maxWidth: '720px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '6px',
                                    backgroundColor: '#dbeafe',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                  }}
                                >
                                  <i className="ri-map-pin-2-fill" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                                    Map Location &amp; Browser Detection
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                    Set the target location on the map for respondents to view (matching screenshot)
                                  </div>
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#2563eb',
                                  backgroundColor: '#eff6ff',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                Interactive Leaflet Map
                              </span>
                            </div>

                            {/* Preset Quick Cities */}
                            <div>
                              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                Quick City Presets (Click to center pin):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {[
                                  { name: 'Hamburg, Germany', lat: 53.5511, lng: 9.9937, zoom: 10 },
                                  { name: 'Berlin, Germany', lat: 52.52, lng: 13.405, zoom: 11 },
                                  { name: 'Munich, Germany', lat: 48.1351, lng: 11.582, zoom: 11 },
                                  { name: 'London, UK', lat: 51.5074, lng: -0.1278, zoom: 10 },
                                  { name: 'Paris, France', lat: 48.8566, lng: 2.3522, zoom: 11 },
                                  { name: 'New York, USA', lat: 40.7128, lng: -74.006, zoom: 10 },
                                  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, zoom: 10 },
                                  { name: 'Bengaluru, India', lat: 12.9716, lng: 77.5946, zoom: 11 },
                                ].map((city) => {
                                  const isCurrent =
                                    Math.abs((q.settings?.latitude ?? 53.5511) - city.lat) < 0.01 &&
                                    Math.abs((q.settings?.longitude ?? 9.9937) - city.lng) < 0.01;
                                  return (
                                    <button
                                      key={city.name}
                                      type="button"
                                      onClick={() =>
                                        updateQuestion(idx, {
                                          settings: {
                                            ...(q.settings || {}),
                                            latitude: city.lat,
                                            longitude: city.lng,
                                            zoom: city.zoom,
                                            locationName: city.name,
                                          },
                                        })
                                      }
                                      style={{
                                        padding: '4px 9px',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        border: '1px solid',
                                        borderColor: isCurrent ? '#2563eb' : '#cbd5e1',
                                        backgroundColor: isCurrent ? '#eff6ff' : '#f8fafc',
                                        color: isCurrent ? '#1d4ed8' : '#475569',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {city.name.split(',')[0]}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Location Settings Row: Name, Lat, Lng, Zoom */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                              <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                                  Location Title / Label:
                                </label>
                                <input
                                  type="text"
                                  value={q.settings?.locationName || 'Hamburg, Germany'}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), locationName: e.target.value },
                                    })
                                  }
                                  placeholder="e.g. Hamburg, Germany"
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                                  Latitude:
                                </label>
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={q.settings?.latitude !== undefined ? q.settings.latitude : 53.5511}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), latitude: parseFloat(e.target.value) || 0 },
                                    })
                                  }
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                                  Longitude:
                                </label>
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={q.settings?.longitude !== undefined ? q.settings.longitude : 9.9937}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), longitude: parseFloat(e.target.value) || 0 },
                                    })
                                  }
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                                  Zoom Level:
                                </label>
                                <select
                                  value={q.settings?.zoom || 10}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), zoom: parseInt(e.target.value, 10) },
                                    })
                                  }
                                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                >
                                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((z) => (
                                    <option key={z} value={z}>
                                      {z} {z === 10 ? '(Default)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Interactive Leaflet Map Picker Component */}
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="ri-information-line" style={{ color: '#2563eb' }} />
                                <span>Click anywhere on the map or drag the blue marker to adjust the location pin.</span>
                              </div>
                              <LeafletMapPicker
                                initialLat={q.settings?.latitude ?? 53.5511}
                                initialLng={q.settings?.longitude ?? 9.9937}
                                initialZoom={q.settings?.zoom ?? 10}
                                locationName={q.settings?.locationName || 'Hamburg, Germany'}
                                isAdmin={true}
                                onLocationChange={(loc) =>
                                  updateQuestion(idx, {
                                    settings: {
                                      ...(q.settings || {}),
                                      latitude: loc.lat,
                                      longitude: loc.lng,
                                      zoom: loc.zoom,
                                      locationName: loc.locationName || q.settings?.locationName,
                                    },
                                  })
                                }
                                height="340px"
                              />
                            </div>

                            {/* Additional Options */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={q.settings?.showLocationInfo !== false}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), showLocationInfo: e.target.checked },
                                    })
                                  }
                                  style={{ accentColor: '#2563eb' }}
                                />
                                <span>Show Location Info Card &amp; Coordinates to respondent</span>
                              </label>

                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(q.settings?.allowUserSelect)}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), allowUserSelect: e.target.checked },
                                    })
                                  }
                                  style={{ accentColor: '#2563eb' }}
                                />
                                <span>Allow respondent to click map to select custom pin coordinates</span>
                              </label>

                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={q.settings?.captureGps !== false}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), captureGps: e.target.checked },
                                    })
                                  }
                                  style={{ accentColor: '#2563eb' }}
                                />
                                <span>Enable &apos;Get My Distance&apos; / GPS button for respondents</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* 10. Date / Time Picker Configuration Builder */}
                        {q.type === 'date_time' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              maxWidth: '640px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#fef3c7',
                                  color: '#d97706',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                }}
                              >
                                <i className="ri-calendar-event-line" />
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                  Date &amp; Time Picker Configuration
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Configure whether respondents pick a date, a time, or both
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Picker Mode:
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {[
                                    { id: 'datetime', label: 'Date & Time', icon: 'ri-calendar-2-line' },
                                    { id: 'date', label: 'Date Only', icon: 'ri-calendar-line' },
                                    { id: 'time', label: 'Time Only', icon: 'ri-time-line' },
                                  ].map((mode) => {
                                    const isSelected = (q.settings?.inputType || 'datetime') === mode.id;
                                    return (
                                      <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() =>
                                          updateQuestion(idx, {
                                            settings: { ...(q.settings || {}), inputType: mode.id },
                                          })
                                        }
                                        style={{
                                          padding: '5px 10px',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          borderRadius: '6px',
                                          border: isSelected ? '1px solid #d97706' : '1px solid #cbd5e1',
                                          backgroundColor: isSelected ? '#fffbeb' : '#ffffff',
                                          color: isSelected ? '#b45309' : '#475569',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        <i className={mode.icon} />
                                        {mode.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div style={{ maxWidth: '300px' }}>
                              <input
                                type={
                                  (q.settings?.inputType || 'datetime') === 'time'
                                    ? 'time'
                                    : (q.settings?.inputType || 'datetime') === 'date'
                                    ? 'date'
                                    : 'datetime-local'
                                }
                                disabled
                                className="ls-input"
                                style={{ backgroundColor: '#ffffff', cursor: 'default' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 11. Numerical Input Builder */}
                        {q.type === 'numerical_input' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              maxWidth: '640px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#dbeafe',
                                  color: '#2563eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                }}
                              >
                                <i className="ri-hashtag" />
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                  Numerical Input Settings
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Single numerical field with custom units, minimum, maximum, and step increments
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              <div style={{ width: '90px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Prefix:
                                </label>
                                <input
                                  type="text"
                                  value={q.settings?.prefix || ''}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), prefix: e.target.value },
                                    })
                                  }
                                  placeholder="$"
                                  style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div style={{ width: '90px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Suffix:
                                </label>
                                <input
                                  type="text"
                                  value={q.settings?.suffix || ''}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), suffix: e.target.value },
                                    })
                                  }
                                  placeholder="kg"
                                  style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div style={{ width: '90px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Min:
                                </label>
                                <input
                                  type="number"
                                  value={q.settings?.min !== undefined ? q.settings.min : ''}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), min: e.target.value === '' ? undefined : Number(e.target.value) },
                                    })
                                  }
                                  placeholder="0"
                                  style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div style={{ width: '90px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Max:
                                </label>
                                <input
                                  type="number"
                                  value={q.settings?.max !== undefined ? q.settings.max : ''}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), max: e.target.value === '' ? undefined : Number(e.target.value) },
                                    })
                                  }
                                  placeholder="1000"
                                  style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>

                              <div style={{ width: '80px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Step:
                                </label>
                                <input
                                  type="number"
                                  value={q.settings?.step || 1}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), step: Number(e.target.value) || 1 },
                                    })
                                  }
                                  style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', maxWidth: '260px' }}>
                              {q.settings?.prefix && (
                                <span style={{ padding: '6px 10px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                  {q.settings.prefix}
                                </span>
                              )}
                              <input
                                type="number"
                                disabled
                                placeholder="0.00"
                                style={{
                                  flex: 1,
                                  padding: '6px 10px',
                                  fontSize: '14px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: q.settings?.prefix && q.settings?.suffix ? '0' : q.settings?.prefix ? '0 4px 4px 0' : q.settings?.suffix ? '4px 0 0 4px' : '4px',
                                  backgroundColor: '#ffffff',
                                }}
                              />
                              {q.settings?.suffix && (
                                <span style={{ padding: '6px 10px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderLeft: 'none', borderRadius: '0 4px 4px 0', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                  {q.settings.suffix}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 12. Multiple Numerical Input Rows Builder */}
                        {q.type === 'multiple_numerical_input' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              maxWidth: '640px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: '#e0e7ff',
                                    color: '#4f46e5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                  }}
                                >
                                  <i className="ri-numbers-line" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                    Multiple Numerical Input Rows
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    Collect multiple numeric values with real-time automatic Grand Total calculation
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="text"
                                  value={q.settings?.prefix || ''}
                                  onChange={(e) =>
                                    updateQuestion(idx, {
                                      settings: { ...(q.settings || {}), prefix: e.target.value },
                                    })
                                  }
                                  placeholder="Prefix ($)"
                                  style={{ width: '80px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={q.settings?.showSum !== false}
                                    onChange={(e) =>
                                      updateQuestion(idx, {
                                        settings: { ...(q.settings || {}), showSum: e.target.checked },
                                      })
                                    }
                                    style={{ accentColor: '#4f46e5' }}
                                  />
                                  <span>Show Grand Total</span>
                                </label>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                              {(q.settings?.rows || ['Budget Item 1', 'Budget Item 2', 'Budget Item 3']).map((row, rIdx) => (
                                <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="ri-drag-move-fill" style={{ color: '#94a3b8', fontSize: '14px' }} />
                                  <input
                                    type="text"
                                    value={row}
                                    onChange={(e) => handleUpdateMultipleNumericalRow(idx, rIdx, e.target.value)}
                                    placeholder={`Item ${rIdx + 1}`}
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff' }}
                                  />
                                  <div style={{ display: 'flex', alignItems: 'center', width: '130px' }}>
                                    {q.settings?.prefix && (
                                      <span style={{ padding: '6px 8px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                        {q.settings.prefix}
                                      </span>
                                    )}
                                    <input
                                      type="number"
                                      disabled
                                      placeholder="0.00"
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        fontSize: '13px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: q.settings?.prefix ? '0 4px 4px 0' : '4px',
                                        backgroundColor: '#f8fafc',
                                        cursor: 'default',
                                      }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMultipleNumericalRow(idx, rIdx)}
                                    style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '16px' }}
                                    title="Remove item"
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                              <button
                                type="button"
                                onClick={() => handleAddMultipleNumericalRow(idx)}
                                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <i className="ri-add-line" /> Add Numerical Row
                              </button>

                              {q.settings?.showSum !== false && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                                  <span>Auto-calculated Grand Total:</span>
                                  <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                    {q.settings?.prefix || ''}0.00
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 13. Multiple Short Text Fields Builder */}
                        {q.type === 'multiple_short_text' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              maxWidth: '640px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#ccfbf1',
                                  color: '#0f766e',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                }}
                              >
                                <i className="ri-file-list-3-line" />
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                  Multiple Short Text Fields
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Configurable collection of one-line inputs (e.g. contact cards, addresses)
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                              {(q.settings?.fields || ['First Name', 'Last Name', 'Email Address', 'Organization']).map((fld, fIdx) => (
                                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="ri-drag-move-fill" style={{ color: '#94a3b8', fontSize: '14px' }} />
                                  <input
                                    type="text"
                                    value={fld}
                                    onChange={(e) => handleUpdateMultipleShortTextField(idx, fIdx, e.target.value)}
                                    placeholder={`Field ${fIdx + 1} Label`}
                                    style={{ width: '180px', padding: '6px 10px', fontSize: '13px', fontWeight: 600, border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff' }}
                                  />
                                  <input
                                    type="text"
                                    disabled
                                    placeholder={`Respondent enters ${fld}...`}
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#f1f5f9', cursor: 'default' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMultipleShortTextField(idx, fIdx)}
                                    style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '16px' }}
                                    title="Remove field"
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddMultipleShortTextField(idx)}
                              style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="ri-add-line" /> Add Text Field
                            </button>
                          </div>
                        )}

                        {/* 14. Equation / Formula Calculation Builder */}
                        {q.type === 'equation' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              maxWidth: '640px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#fce7f3',
                                  color: '#be185d',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                }}
                              >
                                <i className="ri-functions" />
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                  Equation &amp; Dynamic Expression Calculation
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Evaluates arithmetic formulas referencing prior question codes (e.g. &#123;Q1&#125; + &#123;Q2&#125; * 1.5)
                                </div>
                              </div>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                Formula Expression:
                              </label>
                              <input
                                type="text"
                                value={q.settings?.formula || '{Q1 + Q2}'}
                                onChange={(e) =>
                                  updateQuestion(idx, {
                                    settings: { ...(q.settings || {}), formula: e.target.value },
                                  })
                                }
                                placeholder="{Q1} * 0.5 + {Q2}"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  fontSize: '14px',
                                  fontFamily: 'monospace',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  backgroundColor: '#ffffff',
                                  marginBottom: '6px',
                                }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Insert question code:</span>
                                {questions
                                  .filter((_, qI) => qI < idx)
                                  .map((prevQ) => (
                                    <button
                                      key={prevQ.id || prevQ.code}
                                      type="button"
                                      onClick={() => {
                                        const currentFormula = q.settings?.formula || '';
                                        updateQuestion(idx, {
                                          settings: { ...(q.settings || {}), formula: `${currentFormula} {${prevQ.code}}`.trim() },
                                        });
                                      }}
                                      style={{
                                        padding: '2px 8px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: '#f1f5f9',
                                        color: '#334155',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      +{prevQ.code}
                                    </button>
                                  ))}
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                backgroundColor: '#fdf2f8',
                                border: '1px solid #fbcfe8',
                                borderRadius: '6px',
                              }}
                            >
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#9d174d' }}>
                                <i className="ri-calculator-line" style={{ marginRight: '5px' }} />
                                Live Evaluated Score:
                              </div>
                              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#831843' }}>
                                [Calculated dynamically based on responses]
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Question Card Footer Toolbar */}
                      <div
                        style={{
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '12px',
                        }}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, -1);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === 0 ? '#cbd5e1' : '#64748b',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Move Question Up"
                        >
                          <i className="ri-arrow-up-s-line" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, 1);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === questions.length - 1 ? '#cbd5e1' : '#64748b',
                            cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Move Question Down"
                        >
                          <i className="ri-arrow-down-s-line" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Duplicate Question"
                        >
                          <i className="ri-file-copy-line" />
                        </button>

                        <button
                          type="button"
                          disabled={questions.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: questions.length <= 1 ? '#cbd5e1' : '#ef4444',
                            cursor: questions.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete Question"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>

                        <span style={{ height: '20px', width: '1px', backgroundColor: '#cbd5e1' }} />

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#475569',
                            userSelect: 'none',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Required</span>
                          <input
                            type="checkbox"
                            checked={Boolean(q.mandatory)}
                            onChange={(e) => updateQuestion(idx, { mandatory: e.target.checked })}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#10b981',
                              cursor: 'pointer',
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big Bottom Add Question Button */}
              <button
                type="button"
                onClick={() => {
                  setQuestionModalMode('add');
                  setTargetAddIndex(questions.length);
                  setIsQuestionTypeModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px dashed #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  marginBottom: '24px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.backgroundColor = '#ecfdf5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <i className="ri-add-line" style={{ fontSize: '18px' }} /> Add Question
              </button>
            </div>

            {/* Unified Deployment & Privacy Settings Card (Bottom of Canvas) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {/* Card 1: Activate & Publish Survey */}
              <div
                className="ls-card"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '18px 24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <input
                  id="survey-active-toggle"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#10b981',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: active ? '#ecfdf5' : '#f1f5f9',
                    color: active ? '#10b981' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-broadcast-line" />
                </div>
                <div>
                  <label
                    htmlFor="survey-active-toggle"
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    Activate & Publish Survey
                  </label>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Allows participants to access and submit survey responses when checked.
                  </div>
                </div>
              </div>

              {/* Card 2: Enable Zero Knowledge Protocol */}
              <div
                className="ls-card"
                style={{
                  backgroundColor: zeroKnowledgeEnabled ? '#ecfdf5' : '#ffffff',
                  border: zeroKnowledgeEnabled ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '18px 24px',
                  boxShadow: zeroKnowledgeEnabled
                    ? '0 4px 12px rgba(16, 185, 129, 0.12)'
                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  id="zero-knowledge-toggle"
                  type="checkbox"
                  checked={zeroKnowledgeEnabled}
                  onChange={(e) => setZeroKnowledgeEnabled(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#10b981',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: zeroKnowledgeEnabled ? '#10b981' : '#f1f5f9',
                    color: zeroKnowledgeEnabled ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-shield-keyhole-line" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      htmlFor="zero-knowledge-toggle"
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#0f172a',
                        cursor: 'pointer',
                        margin: 0,
                      }}
                    >
                      Enable Zero Knowledge Protocol
                    </label>
                    <span
                      className="ls-badge"
                      style={{
                        backgroundColor: zeroKnowledgeEnabled ? '#10b981' : '#e2e8f0',
                        color: zeroKnowledgeEnabled ? '#ffffff' : '#475569',
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        padding: '2px 7px',
                        fontWeight: 700,
                      }}
                    >
                      ZK PROTOCOL
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Enforces strict secret-ballot privacy. Voter profiles and feedback comments will be decoupled and cannot be viewed together.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: PARTICIPANTS & ACCESS CODES (FOR EXISTING SURVEYS) */
          <div className="ls-card" style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  Participant Tokens & Access Codes
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Configure start times and deadlines for access codes. Voters cannot submit before or after the designated window.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleOpenUniversalModal}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  title="Generate a universal token with schedule for open voting"
                >
                  <i className="ri-link" /> Universal Code
                </button>
                <button
                  type="button"
                  onClick={handleOpenBatchModal}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  title="Generate single-use access codes with schedule for members"
                >
                  <i className="ri-magic-line" /> Batch
                </button>
              </div>
            </div>

            {/* Manual Invite Creation Form */}
            <form onSubmit={handleAddVoter} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ri-user-add-line" style={{ color: '#10b981' }} /> Create New Access Code
              </div>

              {/* Row 1: Email, Custom Code, Universal toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="ls-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Participant Email:
                  </label>
                  <input
                    type="email"
                    placeholder={isUniversalCode ? 'Universal (All participants)' : 'name@example.com (optional)'}
                    className="ls-input"
                    value={isUniversalCode ? '' : newVoterEmail}
                    onChange={(e) => setNewVoterEmail(e.target.value)}
                    disabled={isUniversalCode}
                    style={{ fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label className="ls-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Custom Access Code (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder={isUniversalCode ? 'e.g. ALL-SUMMER-2026' : 'e.g. VOTE-2026 (or auto-generate)'}
                    className="ls-input"
                    value={newVoterToken}
                    onChange={(e) => setNewVoterToken(e.target.value)}
                    style={{ fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '6px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={isUniversalCode}
                      onChange={(e) => setIsUniversalCode(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    Universal Code (Multi-use link)
                  </label>
                </div>
              </div>

              {/* Row 2: Start Date & Time and Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                <div>
                  <label className="ls-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#0f766e' }}>
                    <i className="ri-play-circle-line" /> Start Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    className="ls-input"
                    value={newVoterValidFrom}
                    onChange={(e) => setNewVoterValidFrom(e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                  <div className="ls-helper-text" style={{ fontSize: '11px', marginTop: '3px' }}>
                    Voters cannot submit before this time (leave empty for immediate).
                  </div>
                </div>

                <div>
                  <label className="ls-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}>
                    <i className="ri-alarm-warning-line" /> Deadline Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    className="ls-input"
                    value={newVoterValidUntil}
                    onChange={(e) => setNewVoterValidUntil(e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                  <div className="ls-helper-text" style={{ fontSize: '11px', marginTop: '3px' }}>
                    Voting closes strictly after this deadline (leave empty for no expiration).
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '6px' }}>
                  <button type="submit" className="ls-btn ls-btn-primary" style={{ height: '38px', fontWeight: 600 }}>
                    <i className="ri-user-add-line" /> Add Access Code
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setNewVoterValidFrom(toDatetimeLocalValue(new Date()))}
                  className="ls-badge ls-badge-secondary"
                  style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                >
                  <i className="ri-play-line" /> Start Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = newVoterValidFrom ? new Date(newVoterValidFrom) : new Date();
                    setNewVoterValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 24 * 60 * 60 * 1000)));
                  }}
                  className="ls-badge ls-badge-secondary"
                  style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                >
                  +24 Hours Deadline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = newVoterValidFrom ? new Date(newVoterValidFrom) : new Date();
                    setNewVoterValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)));
                  }}
                  className="ls-badge ls-badge-secondary"
                  style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                >
                  +7 Days Deadline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewVoterValidFrom('');
                    setNewVoterValidUntil('');
                  }}
                  className="ls-badge ls-badge-secondary"
                  style={{ cursor: 'pointer', border: '1px solid #cbd5e1', color: '#64748b' }}
                >
                  Clear Times
                </button>
              </div>
            </form>

            {/* Voters List */}
            {voters.length === 0 ? (
              <div className="ls-empty-state" style={{ padding: '30px 0' }}>
                <i className="ri-group-line ls-empty-icon" style={{ fontSize: '36px' }} />
                <h3>No access codes created yet</h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Use the buttons above to generate participant codes.</p>
              </div>
            ) : (
              <div className="ls-table-container">
                <table className="ls-table">
                  <thead>
                    <tr>
                      <th>Token / Access Code</th>
                      <th>Type / Recipient</th>
                      <th>Voting Window & Deadline</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((v) => {
                      const schedule = getVoterScheduleStatus(v);
                      const isUni = v.usesLeft === -1 || v.email === 'All Participants (Shared Code)';
                      return (
                        <tr key={v.id || v.token}>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <code style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{v.token}</code>
                              <button
                                type="button"
                                onClick={() => handleCopyText(v.token, 'Access Code')}
                                style={{ border: 'none', background: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                                title="Copy Access Code"
                              >
                                <i className="ri-file-copy-line" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const link = `${window.location.origin}/surveys/${id}/take?token=${encodeURIComponent(v.token)}`;
                                  handleCopyText(link, 'Direct Survey Link');
                                }}
                                style={{ border: 'none', background: 'none', color: '#0f766e', cursor: 'pointer', padding: '2px' }}
                                title="Copy Direct Voting Link"
                              >
                                <i className="ri-links-line" />
                              </button>
                            </div>
                          </td>
                          <td>
                            {isUni ? (
                              <span className="ls-badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '11px' }}>
                                <i className="ri-global-line" /> Universal Code
                              </span>
                            ) : v.email ? (
                              <span style={{ color: '#334155', fontSize: '13px' }}>{v.email}</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Single-Use Member Code</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span className={`ls-badge ${schedule.badgeClass}`} style={{ alignSelf: 'flex-start', fontSize: '10.5px' }}>
                                <i className={schedule.icon} /> {schedule.label}
                              </span>
                              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                                {v.validFrom && (
                                  <div>
                                    <strong style={{ color: '#0f766e' }}>Start:</strong> {formatVoterDateDisplay(v.validFrom)}
                                  </div>
                                )}
                                {v.validUntil && (
                                  <div>
                                    <strong style={{ color: '#b91c1c' }}>Deadline:</strong> {formatVoterDateDisplay(v.validUntil)}
                                  </div>
                                )}
                                {!v.validFrom && !v.validUntil && (
                                  <span style={{ color: '#94a3b8' }}>No time limits</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`ls-badge ${v.completed ? 'ls-badge-success' : 'ls-badge-secondary'}`}>
                              {v.completed ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditVoterModal(v)}
                                className="ls-btn ls-btn-outline ls-btn-sm"
                                style={{ color: '#0f766e', borderColor: 'rgba(15, 118, 110, 0.3)' }}
                                title="Edit Schedule & Deadline"
                              >
                                <i className="ri-calendar-event-line" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVoter(v.id || v.voterId)}
                                className="ls-btn ls-btn-outline ls-btn-sm"
                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                title="Remove Access Code"
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Preview Survey Modal */}
      {isPreviewOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <div
            className="ls-modal"
            style={{ maxWidth: '780px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="ls-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div className="ls-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  <i className="ri-eye-line" style={{ color: '#10b981' }} /> Live Survey Preview
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Fill out and test your questionnaire below exactly as voters will experience it.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {supportedLanguages.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label htmlFor="preview-lang-select" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      <i className="ri-translate-2" style={{ marginRight: '3px', color: '#10b981' }} />
                      Language:
                    </label>
                    <select
                      id="preview-lang-select"
                      value={previewLang}
                      onChange={(e) => handlePreviewLangChange(e.target.value)}
                      className="ls-select"
                      style={{ padding: '4px 8px', fontSize: '12px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {supportedLanguages.map((code) => {
                        const lObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
                        return (
                          <option key={code} value={code}>
                            {lObj?.name} ({lObj?.nativeName})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleResetPreviewAnswers}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="Clear all preview inputs"
                >
                  <i className="ri-refresh-line" /> {getUiText('clear_answers', previewLang)}
                </button>
                <button
                  type="button"
                  className="ls-modal-close"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  &times;
                </button>
              </div>
            </div>

            {(() => {
              const previewSurvey = getLocalizedSurvey(
                {
                  title,
                  description,
                  welcomeMessage,
                  endMessage,
                  settings: { translations: surveyTranslations },
                },
                previewLang
              );

              return (
                <div style={{ padding: '20px' }}>
                  <div
                    className="ls-card"
                    style={{
                      borderTop: `6px solid ${theme.accentColor || '#10b981'}`,
                      marginBottom: '20px',
                      borderRadius: '8px',
                    }}
                  >
                    {theme.showLogo && theme.logoUrl && (
                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        <img
                          src={theme.logoUrl}
                          alt="Brand Logo"
                          style={{ maxHeight: '50px', maxWidth: '200px', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      {previewSurvey.title || 'Untitled Survey'}
                    </h1>
                    {previewSurvey.description && <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '14px' }}>{previewSurvey.description}</p>}
                    {previewSurvey.welcomeMessage && (
                      <div style={{ padding: '12px 14px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
                        {previewSurvey.welcomeMessage}
                      </div>
                    )}
                    {zeroKnowledgeEnabled && (
                      <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#047857' }}>
                        <i className="ri-shield-keyhole-line" /> Zero Knowledge Secret Ballot Active
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {questions.map((rawQ, idx) => {
                      const q = getLocalizedQuestion(rawQ, previewLang, { translations: surveyTranslations });
                      const qKey = q.code || `Q_${idx}`;
                      const currentAnswer = previewAnswers[qKey];

                  return (
                    <div key={idx} className="ls-card" style={{ borderRadius: '8px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#10b981', marginRight: '6px' }}>{idx + 1}.</span>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                          {q.text || `Question ${idx + 1}`}
                        </strong>
                        {q.mandatory && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        {q.helpText && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{q.helpText}</p>}
                      </div>

                      {/* 1. Short Text Input */}
                      {q.type === 'short_text' && (
                        <input
                          type="text"
                          className="ls-input"
                          placeholder="Type your answer here..."
                          value={currentAnswer || ''}
                          onChange={(e) => handlePreviewAnswerChange(qKey, e.target.value)}
                        />
                      )}

                      {/* 2. Long Text / Comment Input */}
                      {q.type === 'long_text' && (
                        <textarea
                          className="ls-textarea"
                          rows={3}
                          placeholder="Type your comment / feedback here..."
                          value={currentAnswer || ''}
                          onChange={(e) => handlePreviewAnswerChange(qKey, e.target.value)}
                        />
                      )}

                      {/* 3. Single Choice (Radio) */}
                      {['single_choice', 'multiple_choice'].includes(q.type) && !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(q.options || []).map((o, oIdx) => {
                            const isChecked = currentAnswer === o.code;
                            return (
                              <label
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '9px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isChecked ? '#ecfdf5' : '#f8fafc',
                                  border: isChecked ? '1px solid #10b981' : '1px solid #e2e8f0',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`preview_${idx}`}
                                  checked={isChecked}
                                  onChange={() => handlePreviewAnswerChange(qKey, o.code)}
                                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ color: isChecked ? '#065f46' : '#1e293b', fontWeight: isChecked ? 600 : 400 }}>
                                  {o.text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. Multiple Choice (Checkboxes) */}
                      {['single_choice', 'multiple_choice'].includes(q.type) && (q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(q.options || []).map((o, oIdx) => {
                            const selectedArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                            const isChecked = selectedArray.includes(o.code);
                            return (
                              <label
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '9px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isChecked ? '#ecfdf5' : '#f8fafc',
                                  border: isChecked ? '1px solid #10b981' : '1px solid #e2e8f0',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = isChecked
                                      ? selectedArray.filter((c) => c !== o.code)
                                      : [...selectedArray, o.code];
                                    handlePreviewAnswerChange(qKey, updated);
                                  }}
                                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ color: isChecked ? '#065f46' : '#1e293b', fontWeight: isChecked ? 600 : 400 }}>
                                  {o.text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. Ranking / Preference (Interactive Drag & Drop + Number Selector) */}
                      {q.type === 'ranking' && (
                        <PreviewRankingQuestion
                          question={q}
                          value={currentAnswer}
                          onChange={(rankedCodes) => handlePreviewAnswerChange(qKey, rankedCodes)}
                        />
                      )}

                      {/* 6. Linear Scale / Rating (1-5) */}
                      {q.type === 'rating' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isSelected = String(currentAnswer) === String(star);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handlePreviewAnswerChange(qKey, String(star))}
                                className="ls-btn"
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isSelected ? '#fef3c7' : '#ffffff',
                                  color: isSelected ? '#92400e' : '#334155',
                                  border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <i className={isSelected ? 'ri-star-fill' : 'ri-star-line'} style={{ color: '#f59e0b' }} />
                                {star}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 7. Matrix / Grid */}
                      {q.type === 'matrix' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Statement</th>
                                {(q.settings?.columns || ['Col 1', 'Col 2', 'Col 3']).map((c, cIdx) => (
                                  <th key={cIdx} style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b' }}>{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(q.settings?.rows || ['Row 1', 'Row 2']).map((r, rIdx) => {
                                const matrixMap = (typeof currentAnswer === 'object' && currentAnswer !== null) ? currentAnswer : {};
                                const selectedCol = matrixMap[r];
                                return (
                                  <tr key={rIdx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a' }}>{r}</td>
                                    {(q.settings?.columns || ['Col 1', 'Col 2', 'Col 3']).map((c, cIdx) => (
                                      <td key={cIdx} style={{ textAlign: 'center', padding: '10px 12px' }}>
                                        <input
                                          type="radio"
                                          name={`preview_m_${idx}_${rIdx}`}
                                          checked={selectedCol === c}
                                          onChange={() => {
                                            const updated = { ...matrixMap, [r]: c };
                                            handlePreviewAnswerChange(qKey, updated);
                                          }}
                                          style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 8. File Upload / Media Attachments Preview */}
                      {q.type === 'file_upload' && (
                        <PreviewFileUploadQuestion
                          question={q}
                          value={currentAnswer}
                          onChange={(files) => handlePreviewAnswerChange(qKey, files)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <i className="ri-information-line" /> {getUiText('preview_test_note', previewLang)}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="ls-btn ls-btn-outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  className="ls-btn ls-btn-primary"
                  onClick={handleTestSubmitPreview}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: theme.accentColor || '#10b981',
                    borderColor: theme.accentColor || '#10b981',
                  }}
                >
                  <i className="ri-check-line" /> {getUiText('submit', previewLang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Access Code Generation Modal */}
      {isUniversalModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGeneratingUniversal) {
              handleCloseUniversalModal();
            }
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="universal-modal-title"
            style={{ maxWidth: '500px' }}
          >
            <div className="ls-modal-header">
              <div className="ls-modal-title" id="universal-modal-title">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ls-color-primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ls-color-primary)',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-link" />
                </div>
                <span>Universal Access Code</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={handleCloseUniversalModal}
                disabled={isGeneratingUniversal}
                aria-label="Close modal"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleConfirmGenerateUniversal}>
              <div className="ls-modal-body">
                <p style={{ marginBottom: '16px', fontSize: '13.5px', color: 'var(--ls-color-g-700)', lineHeight: 1.5 }}>
                  Universal codes allow multiple participants to take the survey through a shared link. You can enforce a strict start time and deadline window.
                </p>

                <div className="ls-form-group" style={{ marginBottom: '14px' }}>
                  <label
                    htmlFor="universal-custom-token"
                    className="ls-label"
                    style={{ fontWeight: 600, color: 'var(--ls-color-g-900)', marginBottom: '6px' }}
                  >
                    Custom Code (Optional):
                  </label>
                  <input
                    id="universal-custom-token"
                    type="text"
                    className="ls-input"
                    placeholder="e.g. ALL-GLOBAL-2026 (or auto-generate)"
                    value={universalCustomToken}
                    onChange={(e) => setUniversalCustomToken(e.target.value)}
                    disabled={isGeneratingUniversal}
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label
                      htmlFor="universal-valid-from"
                      className="ls-label"
                      style={{ fontWeight: 600, color: '#0f766e', marginBottom: '4px', fontSize: '12px' }}
                    >
                      <i className="ri-play-circle-line" /> Start Date & Time:
                    </label>
                    <input
                      id="universal-valid-from"
                      type="datetime-local"
                      className="ls-input"
                      value={universalValidFrom}
                      onChange={(e) => setUniversalValidFrom(e.target.value)}
                      disabled={isGeneratingUniversal}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="universal-valid-until"
                      className="ls-label"
                      style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '4px', fontSize: '12px' }}
                    >
                      <i className="ri-alarm-warning-line" /> Deadline Date & Time:
                    </label>
                    <input
                      id="universal-valid-until"
                      type="datetime-local"
                      className="ls-input"
                      value={universalValidUntil}
                      onChange={(e) => setUniversalValidUntil(e.target.value)}
                      disabled={isGeneratingUniversal}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setUniversalValidFrom(toDatetimeLocalValue(new Date()))}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = universalValidFrom ? new Date(universalValidFrom) : new Date();
                      setUniversalValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 24 * 60 * 60 * 1000)));
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = universalValidFrom ? new Date(universalValidFrom) : new Date();
                      setUniversalValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)));
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUniversalValidFrom('');
                      setUniversalValidUntil('');
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1', color: '#64748b' }}
                  >
                    Clear
                  </button>
                </div>

                <div className="ls-helper-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ri-time-line" style={{ color: 'var(--ls-color-primary)' }} />
                  <span>Voters will be blocked before the start time and after the deadline.</span>
                </div>
              </div>

              <div className="ls-modal-footer">
                <button
                  type="button"
                  className="ls-btn ls-btn-outline"
                  onClick={handleCloseUniversalModal}
                  disabled={isGeneratingUniversal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ls-btn ls-btn-primary"
                  disabled={isGeneratingUniversal}
                >
                  {isGeneratingUniversal ? (
                    <>
                      <i className="ri-loader-4-line ri-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line" /> Generate Universal Code
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Member Access Codes Modal */}
      {isBatchModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGeneratingBatch) {
              handleCloseBatchModal();
            }
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-modal-title"
            style={{ maxWidth: '500px' }}
          >
            <div className="ls-modal-header">
              <div className="ls-modal-title" id="batch-modal-title">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ls-color-primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ls-color-primary)',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-magic-line" />
                </div>
                <span>Batch Member Access Codes</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={handleCloseBatchModal}
                disabled={isGeneratingBatch}
                aria-label="Close modal"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchGenerate}>
              <div className="ls-modal-body">
                <p style={{ marginBottom: '16px', fontSize: '13.5px', color: 'var(--ls-color-g-700)', lineHeight: 1.5 }}>
                  Generate unique, single-use access codes for members. You can specify a shared start time and deadline for the entire batch.
                </p>

                <div className="ls-form-group" style={{ marginBottom: '14px' }}>
                  <label
                    htmlFor="batch-member-count"
                    className="ls-label"
                    style={{ fontWeight: 600, color: 'var(--ls-color-g-900)', marginBottom: '6px' }}
                  >
                    Number of members:
                  </label>
                  <input
                    id="batch-member-count"
                    type="number"
                    min="1"
                    max="500"
                    className="ls-input"
                    placeholder="e.g. 10"
                    value={batchMemberCount}
                    onChange={(e) => setBatchMemberCount(e.target.value)}
                    autoFocus
                    required
                    disabled={isGeneratingBatch}
                    style={{ fontSize: '15px' }}
                  />
                  <div className="ls-helper-text" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ri-shield-user-line" style={{ color: 'var(--ls-color-primary)' }} />
                    <span>Each code is valid for exactly 1 person and 1 completion.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label
                      htmlFor="batch-valid-from"
                      className="ls-label"
                      style={{ fontWeight: 600, color: '#0f766e', marginBottom: '4px', fontSize: '12px' }}
                    >
                      <i className="ri-play-circle-line" /> Start Date & Time:
                    </label>
                    <input
                      id="batch-valid-from"
                      type="datetime-local"
                      className="ls-input"
                      value={batchValidFrom}
                      onChange={(e) => setBatchValidFrom(e.target.value)}
                      disabled={isGeneratingBatch}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="batch-valid-until"
                      className="ls-label"
                      style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '4px', fontSize: '12px' }}
                    >
                      <i className="ri-alarm-warning-line" /> Deadline Date & Time:
                    </label>
                    <input
                      id="batch-valid-until"
                      type="datetime-local"
                      className="ls-input"
                      value={batchValidUntil}
                      onChange={(e) => setBatchValidUntil(e.target.value)}
                      disabled={isGeneratingBatch}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setBatchValidFrom(toDatetimeLocalValue(new Date()))}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = batchValidFrom ? new Date(batchValidFrom) : new Date();
                      setBatchValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 24 * 60 * 60 * 1000)));
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = batchValidFrom ? new Date(batchValidFrom) : new Date();
                      setBatchValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)));
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchValidFrom('');
                      setBatchValidUntil('');
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1', color: '#64748b' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="ls-modal-footer">
                <button
                  type="button"
                  className="ls-btn ls-btn-outline"
                  onClick={handleCloseBatchModal}
                  disabled={isGeneratingBatch}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ls-btn ls-btn-primary"
                  disabled={isGeneratingBatch}
                >
                  {isGeneratingBatch ? (
                    <>
                      <i className="ri-loader-4-line ri-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <i className="ri-magic-line" /> Generate Codes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Access Code Schedule Modal */}
      {isEditVoterModalOpen && editingVoter && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingEditVoter) {
              handleCloseEditVoterModal();
            }
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-voter-modal-title"
            style={{ maxWidth: '500px' }}
          >
            <div className="ls-modal-header">
              <div className="ls-modal-title" id="edit-voter-modal-title">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ls-color-primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ls-color-primary)',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-calendar-event-line" />
                </div>
                <span>Edit Schedule & Deadline</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={handleCloseEditVoterModal}
                disabled={isSavingEditVoter}
                aria-label="Close modal"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVoter}>
              <div className="ls-modal-body">
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Access Code:</div>
                  <code style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{editingVoter.token}</code>
                  {editingVoter.email && (
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                      Recipient: {editingVoter.email}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label
                      htmlFor="edit-valid-from"
                      className="ls-label"
                      style={{ fontWeight: 600, color: '#0f766e', marginBottom: '4px', fontSize: '12px' }}
                    >
                      <i className="ri-play-circle-line" /> Start Date & Time:
                    </label>
                    <input
                      id="edit-valid-from"
                      type="datetime-local"
                      className="ls-input"
                      value={editValidFrom}
                      onChange={(e) => setEditValidFrom(e.target.value)}
                      disabled={isSavingEditVoter}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-valid-until"
                      className="ls-label"
                      style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '4px', fontSize: '12px' }}
                    >
                      <i className="ri-alarm-warning-line" /> Deadline Date & Time:
                    </label>
                    <input
                      id="edit-valid-until"
                      type="datetime-local"
                      className="ls-input"
                      value={editValidUntil}
                      onChange={(e) => setEditValidUntil(e.target.value)}
                      disabled={isSavingEditVoter}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setEditValidFrom(toDatetimeLocalValue(new Date()))}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = editValidFrom ? new Date(editValidFrom) : new Date();
                      setEditValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 24 * 60 * 60 * 1000)));
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = editValidFrom ? new Date(editValidFrom) : new Date();
                      setEditValidUntil(toDatetimeLocalValue(new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)));
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditValidFrom('');
                      setEditValidUntil('');
                    }}
                    className="ls-badge ls-badge-secondary"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1', color: '#64748b' }}
                  >
                    Remove Limits
                  </button>
                </div>

                <div className="ls-helper-text">
                  Voters using this code cannot vote before the start time or after the deadline.
                </div>
              </div>

              <div className="ls-modal-footer">
                <button
                  type="button"
                  className="ls-btn ls-btn-outline"
                  onClick={handleCloseEditVoterModal}
                  disabled={isSavingEditVoter}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ls-btn ls-btn-primary"
                  disabled={isSavingEditVoter}
                >
                  {isSavingEditVoter ? (
                    <>
                      <i className="ri-loader-4-line ri-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line" /> Save Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multilingual Survey Settings Modal */}
      {isLanguageModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLanguageModalOpen(false);
          }}
          style={{ padding: '20px 16px', overflowY: 'auto' }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: 'calc(100dvh - 40px)',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              className="ls-modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                flexShrink: 0,
              }}
            >
              <div className="ls-modal-title" id="language-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-translate-2" />
                </div>
                <span>Survey Languages & Localization</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={() => setIsLanguageModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div
              className="ls-modal-body"
              style={{
                padding: '16px 20px',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#475569', lineHeight: 1.45 }}>
                Choose the language for this survey. Only one language can be chosen. When selected, survey questions and options will automatically be translated into this language.
              </p>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Select Language:
                  </span>
                  {isTranslating && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                      <i className="ri-loader-4-line ri-spin" /> Translating survey...
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: '8px',
                    padding: '2px',
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((l) => {
                    const isSelected = defaultLanguage === l.code;

                    return (
                      <div
                        key={l.code}
                        onClick={() => {
                          if (!isTranslating) handleChooseSurveyLanguage(l.code);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          cursor: isTranslating ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 1px 3px rgba(16, 185, 129, 0.15)' : 'none',
                          opacity: isTranslating ? 0.7 : 1,
                        }}
                      >
                        <input
                          type="radio"
                          name="survey-language-choice"
                          checked={isSelected}
                          readOnly
                          style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <i className="ri-global-line" style={{ fontSize: '16px', color: isSelected ? '#10b981' : '#94a3b8' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#065f46' : '#0f172a' }}>
                            {l.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {l.nativeName}
                          </span>
                        </div>
                        {isSelected && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #86efac',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexShrink: 0 }}>
              <button
                type="button"
                className="ls-btn ls-btn-primary"
                onClick={() => setIsLanguageModalOpen(false)}
                style={{ minWidth: '100px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom White-Labeling, Brand Logo, Accent Color & Completion Settings Modal */}
      {isThemeModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsThemeModalOpen(false);
          }}
          style={{ padding: '20px 16px', overflowY: 'auto' }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-modal-title"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: 'calc(100dvh - 40px)',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              className="ls-modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                flexShrink: 0,
              }}
            >
              <div className="ls-modal-title" id="theme-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: `${theme.accentColor || '#10b981'}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.accentColor || '#10b981',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-palette-line" />
                </div>
                <span>Custom White-Labeling & Themes</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={() => setIsThemeModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div
              className="ls-modal-body"
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* SECTION 1: CUSTOM BRAND LOGO */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ri-image-line" style={{ color: theme.accentColor || '#10b981' }} />
                    Organization Brand Logo
                  </label>
                  {theme.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setTheme((prev) => ({ ...prev, logoUrl: '' }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Upload your organization logo or provide an image link. Displayed at the top of your survey and completion pages.
                </p>

                {theme.logoUrl ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 16px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <div
                      style={{
                        width: '140px',
                        height: '56px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        border: '1px dashed #cbd5e1',
                      }}
                    >
                      <img
                        src={theme.logoUrl}
                        alt="Brand Logo Preview"
                        style={{ maxHeight: '44px', maxWidth: '128px', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0f172a', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(theme.showLogo)}
                          onChange={(e) => setTheme((prev) => ({ ...prev, showLogo: e.target.checked }))}
                          style={{ accentColor: theme.accentColor || '#10b981' }}
                        />
                        Display logo on survey header
                      </label>
                      <label
                        style={{
                          fontSize: '12px',
                          color: '#2563eb',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          display: 'inline-block',
                        }}
                      >
                        Change logo image
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleLogoDrop}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: `${theme.accentColor || '#10b981'}15`,
                          color: theme.accentColor || '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          marginBottom: '8px',
                        }}
                      >
                        <i className="ri-upload-cloud-line" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        Click to upload logo or drag and drop
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        PNG, JPG, SVG, WebP up to 5 MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoFileUpload}
                      />
                    </label>

                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Or image URL:</span>
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={theme.logoUrl || ''}
                        onChange={(e) => setTheme((prev) => ({ ...prev, logoUrl: e.target.value.trim(), showLogo: true }))}
                        className="ls-input"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: CUSTOM ACCENT COLOR */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <i className="ri-brush-line" style={{ color: theme.accentColor || '#10b981' }} />
                  Custom Brand Accent Color
                </label>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Select a preset palette or enter your brand hex color code. Applied to survey banners, buttons, and selection highlights.
                </p>

                {/* Preset Swatches */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  {ACCENT_COLOR_PRESETS.map((p) => {
                    const isSelected = (theme.accentColor || '#10b981').toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setTheme((prev) => ({ ...prev, accentColor: p.hex }))}
                        title={p.label}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: p.hex,
                          border: isSelected ? '3px solid #0f172a' : '2px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '14px',
                          boxShadow: isSelected ? '0 0 0 2px rgba(15, 23, 42, 0.2)' : 'none',
                          transition: 'transform 0.1s ease',
                        }}
                      >
                        {isSelected && <i className="ri-check-line" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input & Live Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={theme.accentColor || '#10b981'}
                      onChange={(e) => setTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                      style={{
                        width: '38px',
                        height: '38px',
                        padding: 0,
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                      title="Choose custom color"
                    />
                    <input
                      type="text"
                      value={theme.accentColor || '#10b981'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setTheme((prev) => ({ ...prev, accentColor: val }));
                        }
                      }}
                      placeholder="#10b981"
                      className="ls-input"
                      style={{ width: '100px', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}
                    />
                  </div>

                  {/* Mini Preview Component */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${theme.accentColor || '#10b981'}`,
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Live Swatch:</span>
                    <button
                      type="button"
                      style={{
                        backgroundColor: theme.accentColor || '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      Sample Button
                    </button>
                    <input
                      type="radio"
                      checked={true}
                      readOnly
                      style={{ accentColor: theme.accentColor || '#10b981', cursor: 'default' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CUSTOM COMPLETION LANDING PAGE & REDIRECT URLS */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <i className="ri-external-link-line" style={{ color: theme.accentColor || '#10b981' }} />
                  Custom Completion Landing Page & Redirection
                </label>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
                  Customize the completion landing page or automatically redirect respondents to an external URL upon questionnaire submission.
                </p>

                {/* Custom Title & Message */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Custom Completion Headline (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thank You for Choosing Acme Corp!"
                      value={theme.completion?.customTitle || ''}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          completion: { ...prev.completion, customTitle: e.target.value },
                        }))
                      }
                      className="ls-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Custom Completion Message (Optional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Your feedback directly impacts our product roadmap. We look forward to connecting soon."
                      value={theme.completion?.customMessage || ''}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          completion: { ...prev.completion, customMessage: e.target.value },
                        }))
                      }
                      className="ls-textarea"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Redirect Toggle */}
                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(theme.completion?.redirectEnabled)}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          completion: { ...prev.completion, redirectEnabled: e.target.checked },
                        }))
                      }
                      style={{ accentColor: theme.accentColor || '#10b981', width: '16px', height: '16px' }}
                    />
                    Redirect respondent to custom external URL upon submission
                  </label>

                  {theme.completion?.redirectEnabled && (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '26px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Destination URL:
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/thank-you"
                          value={theme.completion?.redirectUrl || ''}
                          onChange={(e) =>
                            setTheme((prev) => ({
                              ...prev,
                              completion: { ...prev.completion, redirectUrl: e.target.value },
                            }))
                          }
                          className="ls-input"
                          style={{ fontSize: '13px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                            Redirect Delay:
                          </label>
                          <select
                            value={theme.completion?.redirectDelay ?? 3}
                            onChange={(e) =>
                              setTheme((prev) => ({
                                ...prev,
                                completion: { ...prev.completion, redirectDelay: parseInt(e.target.value, 10) },
                              }))
                            }
                            className="ls-select"
                            style={{ fontSize: '12.5px', padding: '6px 10px' }}
                          >
                            <option value={0}>0s (Instant redirect)</option>
                            <option value={3}>3s (Recommended)</option>
                            <option value={5}>5s</option>
                            <option value={10}>10s</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                            Button Label:
                          </label>
                          <input
                            type="text"
                            placeholder="Continue to Website"
                            value={theme.completion?.buttonText || 'Continue to Website'}
                            onChange={(e) =>
                              setTheme((prev) => ({
                                ...prev,
                                completion: { ...prev.completion, buttonText: e.target.value },
                              }))
                            }
                            className="ls-input"
                            style={{ fontSize: '12.5px', padding: '6px 10px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexShrink: 0 }}>
              <button
                type="button"
                className="ls-btn ls-btn-primary"
                onClick={() => setIsThemeModalOpen(false)}
                style={{
                  minWidth: '100px',
                  backgroundColor: theme.accentColor || '#10b981',
                  borderColor: theme.accentColor || '#10b981',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LimeSurvey Question Type Selection Modal (Triggered by Quick Action '+' Button) */}
      {isQuestionTypeModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuestionTypeModalOpen(false);
          }}
          style={{
            padding: '24px 16px',
            overflowY: 'auto',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-type-modal-title"
            style={{
              maxWidth: '920px',
              width: '100%',
              borderRadius: '8px',
              border: '2px solid #8b5cf6',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(0, 0, 0, 0.12)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto',
            }}
          >
            {/* Top Search Bar with Purple Outline Border */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    questionModalMode === 'change'
                      ? `Change type for Question #${(targetAddIndex !== null ? targetAddIndex : activeQuestionIndex) + 1}...`
                      : 'Search for a question type'
                  }
                  value={questionTypeSearchQuery}
                  onChange={(e) => setQuestionTypeSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    color: '#0f172a',
                    backgroundColor: 'transparent',
                    fontFamily: 'inherit',
                  }}
                />
                <i
                  className="ri-search-line"
                  style={{ fontSize: '18px', color: '#1e293b' }}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsQuestionTypeModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '22px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
                title="Close"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Change Mode Indicator Banner */}
            {questionModalMode === 'change' && (
              <div style={{ padding: '8px 24px', backgroundColor: '#f5f3ff', borderBottom: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#6d28d9', fontWeight: 600 }}>
                <span>
                  <i className="ri-pencil-line" style={{ marginRight: '6px' }} />
                  Modifying Question #{(targetAddIndex !== null ? targetAddIndex : activeQuestionIndex) + 1}
                </span>
                <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>
                  Question text and options will be preserved
                </span>
              </div>
            )}

            {/* Sub-bar: + Add question group */}
            <div style={{ padding: '16px 24px 8px 24px' }}>
              <button
                type="button"
                onClick={() => handleAddQuestionGroup(targetAddIndex)}
                style={{
                  backgroundColor: '#f3e8ff',
                  color: '#7c3aed',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ede9fe')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3e8ff')}
              >
                <i className="ri-add-line" style={{ fontSize: '16px' }} />
                Add question group
              </button>
            </div>

            {/* Categories & Question Types Grid matching attached screenshot */}
            <div
              style={{
                padding: '16px 28px 32px 28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                columnGap: '32px',
                rowGap: '28px',
                maxHeight: '68vh',
                overflowY: 'auto',
              }}
            >
              {filteredQuestionCategories.map((cat) => (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Category Title with Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {cat.id === 'dates_data' ? (
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>&#123; &#125;</span>
                    ) : cat.id === 'number' ? (
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>123</span>
                    ) : (
                      <i className={cat.icon} style={{ fontSize: '16px', color: '#1e293b' }} />
                    )}
                    <span>{cat.title}</span>
                  </div>

                  {/* Items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectQuestionType(item, targetAddIndex)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '3px 0',
                          textAlign: 'left',
                          fontSize: '13.5px',
                          color: '#6366f1',
                          cursor: 'pointer',
                          display: 'block',
                          fontFamily: 'inherit',
                          lineHeight: 1.4,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4338ca';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6366f1';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredQuestionCategories.length === 0 && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '36px 12px', color: '#64748b' }}>
                  <i className="ri-search-line" style={{ fontSize: '28px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>No question types found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    No results for &ldquo;{questionTypeSearchQuery}&rdquo;. Try another term.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Text Font Selection Modal ('Tt' Button) */}
      {isFontModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFontModalOpen(false);
          }}
          style={{
            padding: '24px 16px',
            overflowY: 'auto',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="font-modal-title"
            style={{
              maxWidth: '680px',
              width: '100%',
              borderRadius: '10px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#eef2ff',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                  }}
                >
                  Tt
                </div>
                <div>
                  <h3 id="font-modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Question Text Font & Typography
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Select the font style for question titles, notes, and response choices
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFontModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '22px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Font Search & Categories Filter */}
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  gap: '8px',
                }}
              >
                <i className="ri-search-line" style={{ color: '#94a3b8', fontSize: '16px' }} />
                <input
                  type="text"
                  placeholder="Search among 50+ fonts (e.g. Inter, Playfair, Fira Code)..."
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    width: '100%',
                    color: '#1e293b',
                  }}
                />
                {fontSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFontSearchQuery('')}
                    style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                  >
                    <i className="ri-close-circle-fill" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'All', label: 'All', count: FONT_PRESETS.length },
                  { id: 'Sans-serif', label: 'Sans-serif', count: FONT_PRESETS.filter((f) => f.category === 'Sans-serif').length },
                  { id: 'Serif', label: 'Serif', count: FONT_PRESETS.filter((f) => f.category === 'Serif').length },
                  { id: 'Monospace', label: 'Monospace', count: FONT_PRESETS.filter((f) => f.category === 'Monospace').length },
                  { id: 'Display', label: 'Display', count: FONT_PRESETS.filter((f) => f.category === 'Display').length },
                ].map((cat) => {
                  const isActive = selectedFontCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedFontCategory(cat.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: isActive ? '#6366f1' : '#e2e8f0',
                        backgroundColor: isActive ? '#ede9fe' : '#f8fafc',
                        color: isActive ? '#4f46e5' : '#64748b',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat.label}
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          backgroundColor: isActive ? '#6366f1' : '#e2e8f0',
                          color: isActive ? '#ffffff' : '#475569',
                        }}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fonts List */}
            <div
              style={{
                padding: '16px 24px',
                maxHeight: '52vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {FONT_PRESETS.filter((f) => {
                const q = fontSearchQuery.trim().toLowerCase();
                const matchesSearch =
                  !q ||
                  f.name.toLowerCase().includes(q) ||
                  f.category.toLowerCase().includes(q) ||
                  f.description.toLowerCase().includes(q);
                const matchesCategory =
                  selectedFontCategory === 'All' || f.category === selectedFontCategory;
                return matchesSearch && matchesCategory;
              }).map((f) => {
                const isSelected =
                  (theme.fontFamily && theme.fontFamily === f.fontFamily) ||
                  (!theme.fontFamily && f.name === 'IBM Plex Sans');

                return (
                  <div
                    key={f.name}
                    onClick={() => {
                      setTheme((prev) => ({
                        ...prev,
                        fontFamily: f.fontFamily,
                        fontName: f.name,
                      }));
                      showToast(`Question font updated to ${f.name}!`, 'success');
                    }}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: isSelected ? '#6366f1' : '#e2e8f0',
                      backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          {f.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            backgroundColor: '#e2e8f0',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {f.category}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#334155',
                          fontFamily: f.fontFamily,
                          letterSpacing: '0.01em',
                          lineHeight: 1.3,
                        }}
                      >
                        {f.sample}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {f.description}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isSelected ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#6366f1',
                            fontWeight: 700,
                            fontSize: '13px',
                            backgroundColor: '#ede9fe',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          <i className="ri-check-line" style={{ fontSize: '16px' }} />
                          Active
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          style={{ fontSize: '12px', padding: '4px 12px' }}
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {FONT_PRESETS.filter((f) => {
                const q = fontSearchQuery.trim().toLowerCase();
                const matchesSearch =
                  !q ||
                  f.name.toLowerCase().includes(q) ||
                  f.category.toLowerCase().includes(q) ||
                  f.description.toLowerCase().includes(q);
                const matchesCategory =
                  selectedFontCategory === 'All' || f.category === selectedFontCategory;
                return matchesSearch && matchesCategory;
              }).length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  <i className="ri-font-size" style={{ fontSize: '36px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                    No fonts match &ldquo;{fontSearchQuery}&rdquo;
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#94a3b8' }}>
                    Try searching for another font name or switch to &apos;All&apos; category
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Active Font: <strong style={{ color: '#0f172a' }}>{theme.fontName || 'IBM Plex Sans'}</strong>
              </div>
              <button
                type="button"
                className="ls-btn ls-btn-primary"
                onClick={() => setIsFontModalOpen(false)}
                style={{ minWidth: '100px', backgroundColor: '#6366f1', borderColor: '#6366f1' }}
              >
                Apply Font
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
