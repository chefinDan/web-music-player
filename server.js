//server js goes here
// Use nodejs, express, mongodb
var path = require('path');
var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var Handlebars = require('handlebars');
const fs = require('fs');
const ID3 = require('id3-parser');

var PORT = process.env.PORT || 8000;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('public'));



//  This uses the ID3 module using local files in /testContent.
//  ID3.parse outputs returns an object, each object is pushed to an
//  array trackdata[]

// To use on our own computer, make a directory of only mp3's,
// put mp3 directory in public directory and assign path to 'var contentDir' below
var contentDir = "public/testContent";
var trackdata = [];

fs.readdir(contentDir, (err, files) => {
  files.forEach( elem => {
    fs.readFile(path.join(contentDir, elem), (err, buf) => {
      var tags = ID3.parse(buf);
      trackdata.push({"title": tags.title,
                      "artist": tags.artist,
                      "album": tags.album,
                      "year": tags.year,
                      "genre": tags.genre,
                      "cover":
                        {
                          "img": new Buffer(tags.image.data, 'base64'),
                          "mime": tags.image.mime
                        },
                        "url": elem
      });
    });
  });
});


//route method for img artwork, uses :album param and virtual paths!!
app.get('/public/img/:album', (req, res, next) => {
  console.log(req.params.track);
  for(var i = 0; i < trackdata.length; i++) {
    if(trackdata[i].album.includes(req.params.album)) {
      res.contentType('image/'+ trackdata[i].cover.mime);
      res.send(trackdata[i].cover.img);
      i = trackdata.length;
    }
  }
});

app.get('/public/testContent/:track', (req, res, err) => {
  console.log(req.params.track);
  for(var i = 0; i < trackdata.length; i++) {
    if(trackdata[i].url.includes(req.params.track)) {
      res.contentType('audio/mpeg');
      res.send(trackdata[i].url);
      i = trackdata.length;
    }
  }
})

//route method for root, used for testing
app.get('/', function (req, res, next) {
    res.render('listTemplate', {"data": trackdata} );
  });





app.listen(PORT, err => {
  if(err) throw err;
  console.log(' === server listening on port ', PORT);
});
