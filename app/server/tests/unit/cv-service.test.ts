/**
 * Unit tests for services/cv.ts
 * node:fs and pdf-parse are mocked.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mocks

const mockReadFileSync = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
    existsSync: vi.fn().mockReturnValue(true),
    readdirSync: vi.fn().mockReturnValue([]),
  },
  readFileSync: mockReadFileSync,
  existsSync: vi.fn().mockReturnValue(true),
  readdirSync: vi.fn().mockReturnValue([]),
}));

const mockPdfParse = vi.fn();
vi.mock('pdf-parse', () => ({ default: mockPdfParse }));

afterEach(() => {
  vi.clearAllMocks();
});

// extractTextFromFile

describe('extractTextFromFile', () => {
  it('extracts text from a PDF file using pdf-parse', async () => {
    const fakeBuffer = Buffer.from('fake pdf bytes');
    mockReadFileSync.mockReturnValue(fakeBuffer);
    mockPdfParse.mockResolvedValue({ text: 'Extracted PDF text with skills: Kubernetes, Docker' });

    const { extractTextFromFile } = await import('../../services/cv.js');
    const text = await extractTextFromFile('/tmp/resume.pdf', 'application/pdf');

    expect(text).toBe('Extracted PDF text with skills: Kubernetes, Docker');
    expect(mockPdfParse).toHaveBeenCalledWith(fakeBuffer);
  });

  it('detects PDF by file extension when mimetype is not provided', async () => {
    mockReadFileSync.mockReturnValue(Buffer.from('pdf bytes'));
    mockPdfParse.mockResolvedValue({ text: 'CV text' });

    const { extractTextFromFile } = await import('../../services/cv.js');
    const text = await extractTextFromFile('/uploads/cv.pdf');
    expect(text).toBe('CV text');
    expect(mockPdfParse).toHaveBeenCalled();
  });

  it('reads plain text files as UTF-8 string', async () => {
    const fakeText = 'John Doe\nDevOps Engineer\nKubernetes, Terraform';
    mockReadFileSync.mockReturnValue(Buffer.from(fakeText, 'utf8'));

    const { extractTextFromFile } = await import('../../services/cv.js');
    const text = await extractTextFromFile('/tmp/resume.txt', 'text/plain');
    expect(text).toBe(fakeText);
    expect(mockPdfParse).not.toHaveBeenCalled();
  });

  it('reads .md files as plain text', async () => {
    const fakeMarkdown = '# John Doe\n\n## Skills\n- Kubernetes';
    mockReadFileSync.mockReturnValue(Buffer.from(fakeMarkdown, 'utf8'));

    const { extractTextFromFile } = await import('../../services/cv.js');
    const text = await extractTextFromFile('/uploads/cv.md');
    expect(text).toBe(fakeMarkdown);
  });

  it('reads application/json files as text', async () => {
    const fakeJson = '{"name":"Jane","skills":["Go","Docker"]}';
    mockReadFileSync.mockReturnValue(Buffer.from(fakeJson, 'utf8'));

    const { extractTextFromFile } = await import('../../services/cv.js');
    const text = await extractTextFromFile('/uploads/cv.json', 'application/json');
    expect(text).toBe(fakeJson);
  });

  it('throws for unsupported MIME types', async () => {
    mockReadFileSync.mockReturnValue(Buffer.from([0x89, 0x50, 0x4e, 0x47])); 

    const { extractTextFromFile } = await import('../../services/cv.js');
    await expect(
      extractTextFromFile('/uploads/photo.png', 'image/png')
    ).rejects.toThrow('Unsupported file type');
  });

  it('throws for unsupported file extension with no mimetype', async () => {
    mockReadFileSync.mockReturnValue(Buffer.from('some binary data'));

    const { extractTextFromFile } = await import('../../services/cv.js');
    await expect(
      extractTextFromFile('/uploads/resume.docx')
    ).rejects.toThrow('Unsupported file type');
  });
});