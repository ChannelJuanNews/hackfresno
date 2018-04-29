let fs = require('fs');
let path = require('path');
let express = require('express');
let bodyParser = require('body-parser')
let request = require('request');
let morgan = require('morgan')
let base64ToImage = require('base64-to-image')

let mongoose = require('mongoose')
let User = require( __dirname + "/models/User")

mongoose.connect('mongodb://admin:hackfresno2018@ds161459.mlab.com:61459/hackfresno', function(err){
    if (err){
        return console.log(err)
    }
    else {
        console.log('connected to database')
    }
})




/*base URL for retreieveing photos*/
let ngrokurl = 'https://da64dcdb.ngrok.io' + '/photo/'

/*instantiate express app*/
let app = express()

/* Body Parser */
app.use(bodyParser.json({
    limit : '50mb'
}))

/*middleware to log http requests to the browser*/
app.use(morgan('dev'))


/* Root Route */
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '/new_index.html'))
})


/* Upload  */
app.post('/upload', function(req, res){

    User.findOne({
        username : req.body.username
    }, function(err, user){
        if (err){
            console.log(err)
            res.json(err)
        }
        else {
            // there was no errror

            var base64Str = req.body.img
            var filepath = path.join( __dirname, "/uploads/");
            var optionalObj = {'fileName': req.body.username , 'type':'jpeg'};
            try {
                  base64ToImage(base64Str,filepath,optionalObj);
            }
            catch(error) { /*ignore*/
                console.log('not saving image')
            }
            let response = function(emo_res) { res.json(emo_res) }
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

                function callback(error, response, body) {

                    // if user exists
                    if (user){
                        // update user karma
                        let test = JSON.parse(body)

                        if(!test.frames){

                            console.log(test)

                            return res.json({
                                error : true,
                                message : "No Data Was Returned, No Frames"
                            })
                        }


                        if(test.frames[0].people.length == 0){
                            return res.json({
                                error : true,
                                message : "No Data Was Returned, No People"
                            })
                        }
                        let emotions = JSON.parse(body).frames[0].people[0].emotions

                        /* algorithm to to determine karma*/
                        if (emotions.sadness < emotions.joy){
                            user.karma = user.karma + emotions.joy
                        }
                        else {

                            if (user.karma > 0) {
                                user.karma = user.karma - 1
                            }
                            else if (user.karma > 1 && user.karma > 0){
                                user.karma = 0
                            }
                            // do nothing
                        }

                        user.save(function(err){
                            if (err){
                                return console.log(err)
                            }
                            else {
                                res.json({
                                    body : body,
                                    karma : user.karma
                                })
                            }
                        })

                    }
                    else {
                        // user does not exist, only come here once per new user
                        let newUser = new User()
                        newUser.username = req.body.username

                        let test = JSON.parse(body)
                        if(!test.frames){
                            return res.json({
                                error : true,
                                message : "No Data Was Returned, No Frames"
                            })
                        }


                        let emotions = JSON.parse(body).frames[0].people[0].emotions

                        /* algorithm to to determine karma*/
                        if (emotions.sadness > emotions.joy){
                            newUser.karma = -1
                        }
                        else if (emotions.sadness < emotions.joy){
                            newUser.karma = emotions.joy
                        }
                        else {
                            newUser.karma = 0
                        }

                        newUser.save(function(err){
                            if (err){
                                return console.log(err)
                            }
                            else {
                                res.json({
                                    body : body,
                                    karma : newUser.karma
                                })
                            }
                        })

                    }

                }
                /*make API request*/
                request(options, callback);

            }
            catch(error){
                console.log(error)
            }

        }
    })
    //console.log(req.body)
})

app.get('/karma', function(req, res){
    User.find({}, function(err, users){
        let karma = 0

        for (let i = 0; i< users.length; i++){
            if (typeof users[i].karma == "number"){
                karma += users[i].karma
            }
        }
        res.json({
            karma : karma
        })
    })
})

app.post('/checkuser', function(req, res){

    console.log(req.body)

    User.findOne({
        username : req.body.username
    }, function(err, user){
        if (err){
            return res.json(err)
        }
        else {
            if (user){
                return res.json({
                    userExists : true
                })
            }
            else {
                return res.json({
                    userExists : false
                })
            }
        }
    })
})

app.get('/photo/:username' + '.jpg', function(req, res){
    res.sendFile( path.join( __dirname , "/uploads/" + req.params.username + ".jpeg") )
})


app.listen(4040, function(err){
    if (err){
        return console.log(err)
    }
    else {
        console.log('Running on port 3000')
    }
})
