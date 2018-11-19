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


const contentDir = path.join(__dirname, '../', 'Music/mp3');
app.use(express.static('public'));
app.use('/public/music/mp3', express.static(contentDir));

//route method for root, used for testing
app.get('/', function (req, res, next) {
    res.render('listTemplate', {"data": trackdata} );
});



//  This uses the ID3 module using local files in /testContent.
//  ID3.parse outputs returns an object, each object is pushed to an
//  array trackdata[]

// To use on our own computer, make a directory of only mp3's,
// assign path to 'const contentDir' above

var trackdata = [];
fs.readdir(contentDir, (err, files) => {
  files.forEach( elem => {
    fs.readFile(path.join(contentDir, elem), (err, buf) => {
      var tags = ID3.parse(buf);
      if(!tags.image) {
        tags.image = {
          "data": "null",
          "mime": "null"
        };
      }
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
// The imgs are stored as base64 data in the trackdata object array,
// because of this a route method is used instead of serving static files.
app.get('/public/img/:album', (req, res, next) => {
  for(var i = 0; i < trackdata.length; i++) {
    if(trackdata[i].album.includes(req.params.album)) {
      res.contentType('image/'+ trackdata[i].cover.mime);
      res.send(trackdata[i].cover.img);
      i = trackdata.length;
    }
  }
  if(!res.headersSent) {
    // console.log('res.headerSent: ', res.headersSent);
    next();
  }
});

//catches all instances where there is no album artwork
app.get('/public/img/*', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public/default-artwork.png'));
})



app.listen(PORT, err => {
  if(err) throw err;
  console.log(' === server listening on port ', PORT);
});
