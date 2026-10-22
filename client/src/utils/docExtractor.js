import { api } from '../api';

/**
 * Extracts readable text from any uploaded document (.txt, .md, .pdf, .docx, .json, etc.)
 * - For .txt / .md: Reads client-side instantly
 * - For .pdf / .docx: Sends base64 to /api/syllabus/extract-document to parse server-side
 *
 * @param {File} file
 * @returns {Promise<{ text: string, fileName: string, detectedType?: string, pages?: number, totalUnits?: number, totalTopics?: number }>}
 */
export async function extractDocumentText(file) {
  if (!file) throw new Error('No file provided');

  const fileName = file.name;
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // Instant client-side reading for text and markdown
  if (['txt', 'text', 'md', 'markdown'].includes(ext)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result || '';
        resolve({
          text,
          fileName,
          detectedType: ext === 'md' || ext === 'markdown' ? 'Markdown (.md)' : 'Plain Text (.txt)'
        });
      };
      reader.onerror = () => reject(new Error(`Could not read ${fileName}`));
      reader.readAsText(file);
    });
  }

  // Server-side extraction for PDF, DOCX, and other rich formats
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileBase64 = e.target?.result;
        const res = await api('/syllabus/extract-document', {
          method: 'POST',
          body: JSON.stringify({
            fileBase64,
            fileName,
            mimeType: file.type
          })
        });
        resolve(res);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read binary data from ${fileName}`));
    reader.readAsDataURL(file);
  });
}
