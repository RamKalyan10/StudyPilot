import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts plain text from various document formats:
 * - .pdf (Portable Document Format)
 * - .docx (Word Open XML Document)
 * - .txt (Plain Text)
 * - .md / .markdown (Markdown)
 * - .json / .csv (Structured formats)
 * - .html / .htm (Web documents)
 *
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {string} fileName
 * @param {string} [mimeType]
 * @returns {Promise<{ text: string, detectedType: string, pages?: number }>}
 */
export async function extractTextFromDocument(fileBuffer, fileName = '', mimeType = '') {
  if (!fileBuffer || !fileBuffer.length) {
    throw new Error('File buffer is empty or missing.');
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // 1. PDF Document
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    let parser;
    try {
      parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      const raw = result.text || '';
      // Clean up common page footer artifacts like '-- 1 of 5 --'
      const cleaned = raw
        .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return {
        text: cleaned,
        detectedType: 'PDF Document',
        pages: result.total || 1
      };
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  // 2. DOCX (Word Document)
  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    try {
      const res = await mammoth.extractRawText({ buffer: fileBuffer });
      const cleaned = (res.value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return {
        text: cleaned,
        detectedType: 'Word Document (.docx)'
      };
    } catch (err) {
      throw new Error(`Failed to parse DOCX document: ${err.message}`);
    }
  }

  // 3. Markdown
  if (ext === 'md' || ext === 'markdown') {
    const raw = fileBuffer.toString('utf-8');
    return {
      text: raw.trim(),
      detectedType: 'Markdown Document (.md)'
    };
  }

  // 4. JSON
  if (ext === 'json' || mimeType.includes('json')) {
    try {
      const str = fileBuffer.toString('utf-8');
      const obj = JSON.parse(str);
      // If syllabus object format
      if (Array.isArray(obj)) {
        return {
          text: obj.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n'),
          detectedType: 'JSON Data'
        };
      }
      return {
        text: typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj),
        detectedType: 'JSON Data'
      };
    } catch {
      return {
        text: fileBuffer.toString('utf-8').trim(),
        detectedType: 'JSON Data'
      };
    }
  }

  // 5. HTML
  if (ext === 'html' || ext === 'htm' || mimeType.includes('html')) {
    const raw = fileBuffer.toString('utf-8');
    const stripped = raw
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return {
      text: stripped,
      detectedType: 'HTML Document'
    };
  }

  // 6. Plain Text / Default Fallback (.txt, etc.)
  const text = fileBuffer.toString('utf-8').trim();
  return {
    text,
    detectedType: ext ? `${ext.toUpperCase()} Document` : 'Text Document'
  };
}
