/*
* nodeJS module dependencies
*/
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { readable } = require('stream');
/*
* NPM Module Dependies
*/
const exphbs = require('express-handlebars');
const express = require('express');
const Handlebars = require('handlebars');
const ID3 = require('id3-parser');
const trackRoute = express.Router();
const multer = require('multer');
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const app = express();

/*
*  Express declarations
*/
app.engine('handlebars', exphbs({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use('/tracks', trackRoute);
app.use(express.static('public'));
app.use(bodyParser.json());

/*
* Global variables
*/
var mongoHost = process.env.MONGO_HOST || 'classmongo.engr.oregonstate.edu';
var mongoPort = process.env.MONGO_PORT || 27017;
var mongoUser = process.env.MONGO_USER || 'cs290_greendan';
var mongoPassword = process.env.MONGO_PASSWORD;
var mongoDBName = process.env.MONGO_DB_NAME || 'cs290_greendan';
var PORT = process.env.PORT || 8000;
var contentDir;
var trackdata = [];
var mongoDBDatabase;
var mongoURL = 'mongodb://' + mongoUser + ':' + mongoPassword + '@' +
                mongoHost + ':' + mongoPort + '/' + mongoDBName;

mongodb://<username>:<password>@<hostName>:<port>/<database>

console.log(process.env.MONGO_PASSWORD);



MongoClient.connect(mongoURL, (err, client) => {
  if (err) {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    console.log(err);
    process.exit(1);
  }
  db = mongoDBDatabase = client.db(mongoDBName);
});


trackRoute.get('/:trackID', (req, res) => {
  try {
    var trackID = new ObjectID(req.params.trackID);
  } catch(err) {
    return res.status(400).json({ message: "Invalid trackID in URL param." });
  }
  res.set('content-type', 'audio/mp3');
  res.set('accept-ranges', 'bytes');

  var bucket = new mongodb.GridFSBucket(db, {
    bucketName: 'tracks'
  });

  var downloadStream = bucket.openDownloadStream(trackID);

  downloadStream.on('data', (chunk) => {
    res.write(chunk);
  });

  downloadStream.on('error', () => {
    res.sendStatus(404);
  });

  downloadStream.on('end', () => {
    res.end();
  });
});

trackRoute.post('/', (req, res) => {
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }});
  upload.single('track')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "Upload Request Validation Failed" });
    } else if(!req.body.name) {
      return res.status(400).json({ message: "No track name in request body" });
    }

    var trackName = req.body.name;

    // Covert buffer to Readable Stream
    const readableTrackStream = new Readable();
    readableTrackStream.push(req.file.buffer);
    readableTrackStream.push(null);

    let bucket = new mongodb.GridFSBucket(db, {
      bucketName: 'tracks'
    });

    let uploadStream = bucket.openUploadStream(trackName);
    let id = uploadStream.id;
    readableTrackStream.pipe(uploadStream);

    uploadStream.on('error', () => {
      return res.status(500).json({ message: "Error uploading file" });
    });

    uploadStream.on('finish', () => {
      return res.status(201).json({ message: "File uploaded successfully, stored under Mongo ObjectID: " + id });
    });
  });
});


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





// route method for img artwork, uses :album param and virtual paths!!
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
