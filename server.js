//server js goes here
// Use nodejs, express, mongodb
var path = require('path');
var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var Handlebars = require('handlebars');
const fs = require('fs');
const ID3 = require('id3-parser');
var bodyParser = require('body-parser');

var PORT = process.env.PORT || 8000;

app.engine('handlebars', exphbs({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static('public'));

app.use(bodyParser.json());

var contentDir;
var trackdata = [];

app.get('/', (req, res, next) => {
  if(!contentDir) {
    res.status(200).render('uploadFiles');
  }
  else {}

});

app.get('/library', (req, res, next) => {
  console.log('render landing page');
  res.status(200).render('library', { tracks: trackdata });
});

app.post('/songs/upload', (req, res, next) => {
  if(req.body && req.body.path) {
    contentDir = req.body.path;
    res.status(200).send("Success");
    app.use(express.static(contentDir));
    parseTrackData();
  }
  else {
    res.status(400).send("Request needs a body with a path");
  }
});


function parseTrackData() {
  console.log(contentDir);
    fs.readdir(contentDir, (err, files) => {
      console.log(files);
      files.forEach( elem => {
        fs.readFile(path.join(contentDir, elem), (err, buf) => {
          var tags = ID3.parse(buf);
          // console.log(tags);
          if(!tags.image) {
            tags.image = {
              "data": "null",
              "mime": "null"
            };
          }
          trackdata.push({"title": tags.title.trim(),
                          "artist": tags.artist.trim(),
                          "album": tags.album.trim(),
                          "year": tags.year.trim(),
                          "genre": tags.genre.trim(),
                          "cover":
                            {
                              "img": Buffer.from(tags.image.data, 'base64'),
                              "mime": tags.image.mime
                            },
                            "url": contentDir + elem
          });
          // fs.copyFile('source.txt', 'destination.txt', (err) => {
          // if (err) throw err;
          // console.log('source.txt was copied to destination.txt');
          // });
          console.log(trackdata);
        });
      });
    });
}



//  This uses the ID3 module using local files in /testContent.
//  ID3.parse outputs returns an object, each object is pushed to an
//  array trackdata[]

// To use on our own computer, make a directory of only mp3's,
// assign path to 'const contentDir' above





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
