const bodyParser = require('body-parser');
const express = require('express');
const textract = require('textract');
const lc = require('letter-count');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const File = require('./model/fileSchema');
const mongoose = require('mongoose');
const { spawn } = require('child_process');

const app = express();

const UPLOAD_ROOT = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(UPLOAD_ROOT, 'files');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const allowedExtensions = ['pdf', 'docx', 'xlsx', 'pptx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const createHttpError = (statusCode, code, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const getFileExtension = (fileName) => path.extname(fileName).slice(1).toLowerCase();

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(`${__dirname}/public`));

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public');
  },
  filename: (req, file, cb) => {
    const ext = getFileExtension(file.originalname);
    cb(null, `files/admin-${file.fieldname}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  const extension = getFileExtension(file.originalname);
  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(createHttpError(400, 'INVALID_FILE_TYPE', 'Invalid file type. Allowed: pdf, docx, xlsx, pptx'));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const sendCounts = (text, res) =>
  res.status(200).send({
    words: wc(text),
    chars: lc.count('-c', text).chars,
    num: lc.count('-n', text).numbers,
  });

const handleTextractResponse = (err, text, res, next) => {
  if (err || !text) {
    return next(createHttpError(400, 'TEXT_EXTRACTION_FAILED', 'Unable to extract text from uploaded file.'));
  }
  return sendCounts(text, res);
};

app.post('/api/uploadFile', upload.single('myFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createHttpError(400, 'FILE_REQUIRED', 'File field "myFile" is required.'));
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await File.create({
          name: req.file.filename,
        });
      } catch (error) {
        console.warn('Skipping DB save; failed to persist file metadata:', error.message);
      }
    } else {
      console.warn('Skipping DB save; database not connected.');
    }

    const extension = getFileExtension(req.file.originalname);
    const uploadedFilePath = path.join(UPLOAD_ROOT, req.file.filename);

    if (extension === 'pdf') {
      textract.fromFileWithPath(uploadedFilePath, async (error, text) => {
        if (!error && text && text.length > 0) {
          return sendCounts(text, res);
        }
        if (!error && text.length === 0) {
          const py = spawn('python', ['pythoncode.py', req.file.filename]);
          py.stdout.on('data', (data) => {
            textract.fromBufferWithMime('txt', data, function () {});
            textract.fromFileWithPath('out_text.txt', function (err, text) {
              if (!err) {
                return sendCounts(text, res);
              }
              return handleTextractResponse(err, text, res, next);
            });
          });
          py.stderr.on('data', (data) => {
            console.error(data);
          });

          py.on('exit', (code) => {
            console.log('Process quit with code : ' + code);
          });
          return;
        }
        return handleTextractResponse(error, text, res, next);
      });
    } else if (extension === 'docx' || extension === 'pptx' || extension === 'xlsx') {
      textract.fromFileWithPath(uploadedFilePath, async (error, text) =>
        handleTextractResponse(error, text, res, next),
      );
    } else {
      next(createHttpError(400, 'INVALID_FILE_TYPE', 'Invalid file type. Allowed: pdf, docx, xlsx, pptx'));
    }
  } catch (error) {
    next(error);
  }
});

const mapReadyState = (state) => {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mongo: mapReadyState(mongoose.connection.readyState),
  });
});

app.use('/', (req, res) => {
  res.status(200).render('index');
  console.log('index loaded successfully');
});

app.use((err, req, res, next) => {
  const isFileTooLarge = err.code === 'LIMIT_FILE_SIZE';
  const statusCode = err.statusCode || (isFileTooLarge ? 400 : 500);
  const code = isFileTooLarge ? 'FILE_TOO_LARGE' : err.code || 'INTERNAL_SERVER_ERROR';
  const message =
    isFileTooLarge || statusCode < 500
      ? isFileTooLarge
        ? 'File size exceeds the allowed limit.'
        : err.message || 'Bad request.'
      : 'An unexpected error occurred.';

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
});

module.exports = app;
// //----------------------------------------------------------------------------

var OUT = 0;
var IN = 1;

function wc(str) {
  var state = OUT;
  var wc = 0;
  var i = 0;

  while (i < str.length) {
    if (str[i] == ' ' || str[i] == '\n' || str[i] == '\t') state = OUT;
    else if (state == OUT) {
      state = IN;
      ++wc;
    }

    ++i;
  }

  return wc;
}
