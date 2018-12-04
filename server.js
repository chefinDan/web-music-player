/*
* nodeJS module dependencies
*/
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { Readable } = require('stream');
/*
* NPM Module Dependies
*/
const exphbs = require('express-handlebars');
const express = require('express');
const Handlebars = require('handlebars');
const ID3 = require('id3-parser');
const trackRoute = express.Router();
const multer = require('multer'); // for handling large form-data
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const FileReader = require('filereader');
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
var mongoUser = process.env.MONGO_USER || 'cs290_stachurr';
var mongoPassword = process.env.MONGO_PASSWORD || 'DuckS361046';
var mongoDBName = process.env.MONGO_DB_NAME || 'cs290_stachurr';
var PORT = process.env.PORT || 8000;
var contentDir;
var libData = {}; //store mongoDB id and tag data on server
var mongoDBDatabase;
var mongoURL = 'mongodb://' + mongoUser + ':' + mongoPassword + '@' +
                mongoHost + ':' + mongoPort + '/' + mongoDBName;



MongoClient.connect(mongoURL, (err, client) => {
  if (err) {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    console.log(err);
    process.exit(1);
  }
  db = mongoDBDatabase = client.db(mongoDBName);
  app.listen(PORT, err => {
    if(err) throw err;
    console.log(' === server listening on port ', PORT);
  });
});

app.get('/', (req, res, next) => {
    res.status(200).render('library', {
        empty: true,
        data: libData
    });
});

app.get('/library', (req, res, next) => {

    res.status(200).render('library', libData);
});

app.get('/uploadFiles', (req, res, next) => {
    res.status(200).render('uploadFiles');
});


app.get('/tracks/:trackID', (req, res) => {
  console.log('get song');
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


app.post('/', (req, res) => {
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 60000000, files: 1, parts: 2 }});
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
      console.log("Error uploading file");
    });

    uploadStream.on('finish', () => {
      console.log("File uploaded successfully, stored under Mongo ObjectID: " + id);
      parseTrackData(req.file.buffer, id);
      return res.status(201).json({ message: "File uploaded successfully, stored under Mongo ObjectID: " + id });
    });
  });
});




//  This uses the ID3 module to parse the tag data from a buffer stream passed
//  as file in the parameters. .
//  ID3.parse returns an object, each object is pushed to an
//  array libData[]
function parseTrackData(file, id) {
    var tags = ID3.parse(file);
    if(!tags.image) {
      tags.image = {
        "data": "null",
        "mime": "null"
      };
    }
    var tagDataObject = {
      "id": id,
      "title": tags.title.trim(),
      "artist": tags.artist.trim(),
      "album": tags.album.replace(/\uFFFD/g, ''), //weird character keeps popping up
      "year": tags.year.trim(),
      "genre": tags.genre.trim(),
      "cover":
      {
          "img": Buffer.from(tags.image.data, 'base64'),
          "mime": tags.image.mime
      }
    };
    console.log(tagDataObject);

    if(libData[tags.artist] && libData[tags.artist][tags.album] && libData[tags.artist][tags.album].tracks) {
      // console.log('artist, album and tracks already in database');
      libData[tags.artist][tags.album].tracks.push(tagDataObject);
    }
    else if(libData[tags.artist] && libData[tags.artist][tags.album]) {
      libData[tags.artist][tags.album] = {
        tracks: [tagDataObject]
      }
      // console.log('artist, album already in database');
      libData[tags.artist][tags.album].tracks.push(tagDataObject);

    }
    else if(libData[tags.artist]) {
      libData[tags.artist][tags.album] = {
        tracks: []
      }
      // console.log('artist already in database');
      libData[tags.artist][tags.album].tracks.push(tagDataObject);
    }
    else {
      libData[tags.artist] = {
        [tags.album.replace("\u0000", "")]: {
          tracks: []
        }
      };
      // console.log('new to the database');
      libData[tags.artist][tags.album.replace("\u0000", "")].tracks.push(tagDataObject);
      console.log(libData);
    }
};

// route method for img artwork,
// The imgs are stored as base64 data in the libData object array,
// because of this a route method is used instead of serving static files.
app.get('/:artist/:album/:trackID', (req, res, next) => {
    var tracks = libData[req.params.artist][req.params.album.replace(/\uFFFD/g, '')].tracks;
    for(var i = 0; i < tracks.length;  i++) {
      if(tracks[i].id == req.params.trackID) {
        if(tracks[i].cover.mime == 'null') {
          // console.log('no cover art');
          next();
        }
        else {
          res.contentType('image/jpeg');
          res.send(tracks[i].cover.img);
        }
      }
    }
});

app.get('/*/*/*', (req, res, next) => {
  res.contentType('image/jpeg');
  res.sendFile(path.join(__dirname, 'public/default-artwork.png'));
});

app.get('*', (req, res) => {
  // res.contentType('html/css');
  res.status(404).render('404');
})


//catches all instances where there is no album artwork
app.get('/public/img/*', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public/default-artwork.png'));
})
