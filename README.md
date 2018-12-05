# final-project-godspeed

This web application allows the user to upload mp3 files and have them stored in a database. Data stored as ID3 tags in the mp3 file is used to populate the artist, album etc data fields.  
As of right now, when the server is killed the files are gone. But the browser can be closed without losing any data.


The core of this app is built around nodeJS, Express, MongoDB, GridFS and Multer.
To use, clone the repo to your local host, and set the following environment variables
MONGO_USER ,MONGO_PASSWORD, MONGO_DB_NAME and PORT.

All features of this application are in an experimental state, so any and all errors should be expected.  
