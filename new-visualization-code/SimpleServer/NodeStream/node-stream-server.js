/*var oppressor = require('oppressor');
var filed = require('filed');
var http = require('http');

var server = http.createServer(function (req, res) {
  filed(__dirname + '/TestData.csv')
  .pipe(oppressor(req)).pipe(res)
  ;
});

server.listen(8000);*/

/*const fs = require('fs');
const zlib = require('zlib');
const { Transform } = require('stream');
const csv = require('fast-csv');

const file = './RawData.csv';
  
 // server example
// Running a gzip operation on every request is quite expensive.
// It would be much more efficient to cache the compressed buffer.
const http = require('http');
http.createServer((request, response) => {
  //const raw = fs.createReadStream('index.html');

  const raw = fs.createReadStream(file)
      .pipe(csv()).on('error', err => console.log(err));

  // Store both a compressed and an uncompressed version of the resource.
  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // Note: This is not a conformant accept-encoding parser.
  // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (/\bdeflate\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    raw.pipe(zlib.createDeflate()).pipe(response);
  } else if (/\bgzip\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'gzip' });
    raw.pipe(zlib.createGzip()).pipe(response);
  } else if (/\bbr\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'br' });
    raw.pipe(zlib.createBrotliCompress()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(8000);*/


const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const ndjson = require('ndjson');
const port = 5555;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data', function(req, res) {
  const src = fs.createReadStream(__dirname + '/RawData2.json');
  //setup headers
  res.writeHead(200, {'Content-Type': 'application/ndjson'}); 

  readStream.on('open', () => {
      readStream.pipe(res); //pipe stream to response object
    });
});

app.get('/api', (req, res) => {
  let readStream = fs.createReadStream(__dirname + '/nd-RawData.ndjson').pipe(ndjson.parse());

  const chunks = [];
  readStream.on('data', (data) => {
      chunks.push(JSON.stringify(data));
  });
  console.log("starting stream");

  readStream.on('end', () => {
    var id = setInterval(() => {
      if (chunks.length) {
        res.write(chunks.shift() + '\n');
        console.log("writing chunk ")
      } else {
        clearInterval(id);
        console.log("finished streaming");
        res.end();
      }
    }, 1);
  });
})

var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + port);
});
/*
const server = require('http').createServer();

server.on('request', (req, res) => {
  console.log('piping data');
  
});

server.listen(5555);*/