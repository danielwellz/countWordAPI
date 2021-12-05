const bodyParser = require('body-parser');
const express = require('express');
const textract = require('textract');
const lc = require('letter-count');
function cfe(fileName) {
  extension = fileName.split('.').pop();
  return extension;
}
const crawler = require('crawler-request');
// var options = {
//   type: 'text', // extract the actual text in the pdf file
// };
const File = require('./model/fileSchema');
var spawn = require('child_process').spawn;
// const { stdout } = require('process');
// const { error } = require('console');
// const { log } = require('util');
// const { spawnSync } = require('child_process');
const app = express();
// const url = require('url');
const path = require('path');
var multer = require('multer');
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(`${__dirname}/public`));

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `files/admin-${file.fieldname}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (
    file.originalname.split('.').pop() === 'pdf' ||
    file.originalname.split('.').pop() === 'docx' ||
    file.originalname.split('.').pop() === 'xlsx' ||
    file.originalname.split('.').pop() === 'pptx'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Not a Valid File Type!!'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

app.post('/api/uploadFile', upload.single('myFile'), async (req, res) => {
  try {
    const newFile = await File.create({
      name: req.file.filename,
    });
    if (req.file.originalname.split('.').pop() === 'pdf') {
      textract.fromFileWithPath(
        `public/${req.file.filename}`,
        async (error, text) => {
          if (!error && text.length > 0) {
            res.status(200).send({
              words: wc(text),
              chars: lc.count('-c', text).chars,
              num: lc.count('-n', text).numbers,
            });
          } else if (!error && text.length == 0) {
            arg1 = req.file.filename;
            py = spawn('python', ['pythoncode.py', arg1]);
            py.stdout.on('data', (data) => {
              textract.fromBufferWithMime(
                'txt',
                data,
                function (error, text) {},
              );
              textract.fromFileWithPath('out_text.txt', function (err, text) {
                if (!err) {
                  res.json({
                    words: wc(text),
                    chars: lc.count('-c', text).chars,
                    num: lc.count('-n', text).numbers,
                  });
                }
              });
            });
            py.stderr.on('data', (data) => {
              console.error(data);
            });

            py.on('exit', (code) => {
              console.log('Process quit with code : ' + code);
            });
          } else {
            res.status(400).send({ error });
          }
        },
      );
    } else if (
      req.file.originalname.split('.').pop() === 'docx' ||
      req.file.originalname.split('.').pop() === 'pptx' ||
      req.file.originalname.split('.').pop() === 'xlsx'
    ) {
      textract.fromFileWithPath(
        `public/${req.file.filename}`,
        async (error, text) => {
          if (!error) {
            res.status(200).send({
              words: wc(text),
              chars: lc.count('-c', text).chars,
              num: lc.count('-n', text).numbers,
            });
          } else {
            res.status(400).send({ error });
          }
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
});

app.use('/', (req, res) => {
  res.status(200).render('index');
  console.log('index loaded successfully');
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
