//server js goes here
// Use nodejs, express, mongodb


const express = require('express');
const stream = require('stream');

function requestHandler(req, res) {
  console.log('=== request was recieved');
  console.log('  - method:', req.method);
  console.log('  - url:', req.url);
  // console.log('  - headers:', req.headers);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  // res.setHeader('Content-Type', 'image/jpg');
  // res.setHeader('Content-Type', 'application/js');

  var file = fs.readFileSync('index.html', 'utf8', err => { if(err) throw err; });
  res.write(file);
  // res.write( fs.readFile('./server.js', 'utf8', err => { if(err) throw err; });
  res.end();
}


var server = http.createServer(requestHandler);
server.listen(process.env.PORT, function (err) {
  if(err) throw err;
    console.log('=== server is listening on port', process.env.PORT);
  }
);
