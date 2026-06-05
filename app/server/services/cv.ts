import fs from 'node:fs';
import pdfParse from 'pdf-parse';

export async function extractTextFromFile(filePath: string, mimetype?: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype?.startsWith('text/') ||
    mimetype === 'application/json' ||
    /\.(txt|md|csv)$/i.test(filePath)
  ) {
    return buffer.toString('utf8');
  }

  throw new Error('Unsupported file type. Upload PDF or plain text.');
}
