jest.mock('../model/fileSchema', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
}));

jest.mock('textract', () => ({
  fromFileWithPath: jest.fn(),
  fromBufferWithMime: jest.fn(),
}));

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const lc = require('letter-count');
const textract = require('textract');
const File = require('../model/fileSchema');
const app = require('../app');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'files');

describe('POST /api/uploadFile', () => {
  afterEach(() => {
    jest.clearAllMocks();
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.readdirSync(UPLOAD_DIR).forEach((fileName) => {
        fs.unlinkSync(path.join(UPLOAD_DIR, fileName));
      });
    }
  });

  it('returns counts for a successful upload', async () => {
    const text = 'hello world 123';
    textract.fromFileWithPath.mockImplementation((filePath, cb) => cb(null, text));

    const response = await request(app)
      .post('/api/uploadFile')
      .attach('myFile', Buffer.from('test pdf content'), { filename: 'sample.pdf' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      words: 3,
      chars: lc.count('-c', text).chars,
      num: lc.count('-n', text).numbers,
    });
    expect(File.create).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid file type', async () => {
    const response = await request(app)
      .post('/api/uploadFile')
      .attach('myFile', Buffer.from('invalid'), { filename: 'image.png' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_FILE_TYPE',
        message: expect.stringContaining('Invalid file type'),
      },
    });
  });

  it('requires a file in myFile field', async () => {
    const response = await request(app).post('/api/uploadFile');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'FILE_REQUIRED',
        message: 'File field "myFile" is required.',
      },
    });
  });
});
