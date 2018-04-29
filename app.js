
let fs = require('fs');
let path = require('path');
let busboy = require('connect-busboy');
let connect = require('connect');
let express = require('express');
let bodyParser = require('body-parser')
let multer  = require('multer');
let http = require('http')
let request = require('request');

let fetch = require('node-fetch')

let morgan = require('morgan')


let FileAPI = require('file-api')
let File = FileAPI.File

let FileReader = require('filereader')
let fileReader = new FileReader()

/*base64 stuffs here*/
let base64ToImage = require('base64-to-image')

/*api key*/
let indico = require('indico.io')
indico.apiKey = "03df8347024aba09b8b449732fb887c4";


let ngrokurl = 'https://74427e7b.ngrok.io' + '/photo/'



/*for uploading files*/
let upload = multer({ dest: __dirname + '/uploads/' });
let type = upload.single('upl');

let app = express()

/* Body Parser */
app.use(bodyParser.json({
    limit : '50mb'
}))

app.use(morgan('dev'))


/* Root Route */
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '/../index.html'))
})

/* Upload  */
app.post('/upload', function(req, res){

    //console.log(req.body)

    var base64Str = req.body.img
    var filepath = path.join( __dirname, "/uploads/");
    var optionalObj = {'fileName': req.body.username , 'type':'jpeg'};

    try {
          base64ToImage(base64Str,filepath,optionalObj);
    }
    catch(error) {
        // ignore
    }


    let response = function(emo_res) {
        res.json(emo_res)
    }
    let logError = function(emo_err) { console.log(err); }

    try {
        // ignore




        var options = {
          url: 'https://api.kairos.com/v2/media?source=' + ngrokurl +  req.body.username + '.jpg',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'app_id' : 'e1ec8d9d',
            'app_key' : 'bf72d599ecfc633c7c69e91ba35dbf16'
          }
        };

        //console.log(options.url)

        function callback(error, response, body) {
            console.log(body)
            res.json(body)

        }
        request(options, callback);

        // single example
        //indico.fer(ngrokurl + '/photo/' + req.body.username + '.jpg' )
        //.then(response)
        //.catch(logError);
    }

    catch(error){
        console.log(error)
    }


})


app.get('/photo/:username' + '.jpg', function(req, res){
    res.sendFile( path.join( __dirname , "/uploads/" + req.params.username + ".jpeg") )
})


app.listen(3000, function(err){
    if (err){
        return console.log(err)
    }
    else {
        console.log('Running on port 3000')
    }
})
