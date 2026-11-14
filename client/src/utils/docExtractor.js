/**
 * @file docExtractor.js
 * @description Client-Side & Server-Assisted Document Ingestion Utility.
 * Reads uploaded syllabus and curriculum documents across multiple formats:
 * - Direct Client-side reading: .txt, .text, .md, .markdown
 * - Server-assisted binary parsing: .pdf, .docx, .json, .html via /api/syllabus/extract-document
 */

import { api } from '../api';

/**
 * Extracts readable plain text and structural preview from an uploaded curriculum document.
 *
 * @param {File} file - Native browser File object selected via <input type="file">
 * @returns {Promise<{
 *   text: string,
 *   fileName: string,
 *   detectedType?: string,
 *   pages?: number,
 *   totalUnits?: number,
 *   totalTopics?: number,
 *   units?: Array<any>
 * }>} Extracted content and preview metadata
 */
export async function extractDocumentText(file) {
  if (!file) throw new Error('No file provided');

  const fileName = file.name;
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // Instant client-side reading for text and markdown files
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
      reader.onerror = () => reject(new Error(`Could not read file: ${fileName}`));
      reader.readAsText(file);
    });
  }

  // Server-side binary extraction for PDF, DOCX, and other structured formats
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
    reader.onerror = () => reject(new Error(`Failed to read binary data from file: ${fileName}`));
    reader.readAsDataURL(file);
  });
}
