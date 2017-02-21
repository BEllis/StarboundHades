// import * as http from "http";
import * as url from "url";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as router from "./router";
import * as locale from "./locale";

declare var global: any;

var FileAPI = require('file-api')
var FileReader = FileAPI.FileReader;
global.FileReaderSync = FileReader;

// import errorHandler = require("errorhandler");
//import methodOverride = require("method-override");

// import * as routes from "./routes/index";

const app = express();
const strings = locale.getStrings();
let listenPort = 21080;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// app.set('views', __dirname + '/views');
// app.set('view engine', 'jade');
// app.set('view options', { layout: false });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(methodOverride());
// app.use(express.static(__dirname + '/public'));
app.use(router);

/*
if (env === 'development') {
    app.use(errorHandler());
} */
app.get('*', function(req, res){
  res.status(400).send('Na ni?!');
});

app.listen(listenPort, function() {
    console.log(strings.logServerListening, listenPort, app.settings.env);
});

export = app;