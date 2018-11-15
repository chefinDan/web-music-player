//server js goes here
// Use nodejs, express, mongodb


const express = require('express');
const stream = require('stream');

const app = express();
const PORT = process.env.PORT;

app.use(express.static('public'));


app.listen(PORT, err => {
  if(err) throw err;
  console.log(' === server listening on port ', PORT);
});
