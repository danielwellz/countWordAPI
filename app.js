const bodyParser = require('body-parser');
const express = require('express');
const textract = require('textract');
function cfe(fileName) {
  extension = fileName.split('.').pop();
  return extension;
  };  
const crawler = require('crawler-request');
var options = {
  type: 'text' // extract the actual text in the pdf file
}
var spawn = require('child_process').spawn;
const { stdout } = require('process');
const { error } = require('console');
const { log } = require('util');
const { spawnSync } = require('child_process');
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));

console.time("runtime")
app.post("/", function(req, res) {
  var link = req.body.link;

  const extention = cfe(link);


  if (extention === "pdf") {

    crawler(link).then(function(response) {
      console.log(response);

      let length = response.text.length;
      const enter = "\n";

//----------------------------------------------------------------------------

      if (response.text === enter.repeat(length)) {
        console.log("this is a scanned pdf!");
        console.time("pdftime")

        arg1 = link;

      py = spawn('python', ['pythoncode.py', arg1])

      console.log("running")

      py.stdout.on('data', (data) => {

        // console.log(data);

        // textract.fromBufferWithMime(txt, data, function( error, text ) {})
        
        // if(!error){
        // console.log(text);}
        // else {console.log(error);}

        textract.fromFileWithPath("out_text.txt", function(err, text) {

          if(!err) {
            console.log(text);
            res.json(wc(JSON.stringify(text)));
          } else {
            console.log(err);
          }
        });
    });


      py.stderr.on('data', (data) => {
        console.error(data);
      })

      py.on('exit', (code) => {
        console.log("Process quit with code : " + code);


    });

    py.stdin.end();

 
//--------------------------------------------------------------------------------------------

      } else {
        res.json(wc(response.text));
      }
    });

    //--------------------------------------------------------------------------------------------

  } else if (extention === "docx" || extention === "pptx" || extention === "xlsx") {

    textract.fromUrl(link, function(error, text) {
      if (error) {
        console.log(error);
      } else {

        res.json(wc(text));
      }
    });

    //----------------------------------------------------------------------------------------------

  } else {
    console.log("extention not supported!");
  }
});
console.timeEnd("runtime")

//--------------------------------------------------------------------------

var port = process.env.PORT || 3001;

app.listen(port, function() {

  console.log("sever started on port " + port );
});

//----------------------------------------------------------------------------

var OUT = 0;
var IN = 1;
 

function wc( str)
{
    var state = OUT;
    var wc = 0; 
    var i = 0;
     
    
    while (i < str.length)
    {
     
       
        if (str[i] == ' ' || str[i] == '\n'||
                              str[i] == '\t')
            state = OUT;
             
 
    
        else if (state == OUT)
        {
            state = IN;
            ++wc;
        }
 
   
        ++i;
    }
     
    return "total number of words : " + wc;
}
