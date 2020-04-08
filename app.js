var createError   = require('http-errors');
var express       = require('express');
var path          = require('path');
var cookieParser  = require('cookie-parser');
var logger        = require('morgan');

//cau hinh duong dan
const pathConfig  = require("./path")

//module internet
const passport = require('passport'); // passport Login
var LocalStrategy = require('passport-local').Strategy;

const flash       = require('express-flash-notification'); // co the dung connect-flash
const session     = require('express-session');
var mongoose      = require('mongoose');
var expressLayouts = require('express-ejs-layouts');
const moment      = require('moment'); //format date() - app.locals.moment = moment; de su dung duoc ben ejs


//DEFINE path
global.__base = __dirname + pathConfig.folder_app;
global.__base__validator  = __base + pathConfig.folder_validator + '/';
global.__base__configs    = __base + pathConfig.folder_configs + '/';
global.__base__schemas    = __base + pathConfig.folder_schemas + "/";
global.__base__helpers    = __base + pathConfig.folder_helpers + "/";
global.__base__router     = __base + pathConfig.folder_router + "/";
global.__base__router_frontend     = __base + pathConfig.folder_router_frontend + "/";
global.__base__model      = __base + pathConfig.folder_model + "/";
global.__base_public      = __dirname + pathConfig.folder_public;

//module tu viet
const systemConfig = require(__base__configs + "system.js");
const databaseConfig = require(__base__configs + "database");

// admin - nguyenTrungNghia
let urlMongo = 'mongodb+srv://admin:nguyenTrungNghia@cluster0-fxi7r.gcp.mongodb.net/test?retryWrites=true&w=majority'
mongoose.connect(urlMongo, {useNewUrlParser: true});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');
app.set('layout', 'admin/backend.ejs');

// show nodtication
app.use(cookieParser());
app.use(session(
  {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie:{
      maxAge: 600*1000 //thoi gian luu trong sesstion tinh bang mili giay
    }
  }
));
app.use(passport.initialize())
app.use(passport.session())


//setting notication
app.use(flash(app, {
  viewName: 'admin/elements/notify',
}));

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));// dung de doc file css
app.use(expressLayouts);


// local variable admin
app.locals.systemConfig = systemConfig
app.locals.moment = moment;


//SETING ROUTER
app.use(`/${systemConfig.prefixAdmin}`, require(__base__router + "items"));
app.use("/", require(__base__router_frontend + "index"));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('admin/error');
});


module.exports = app;
