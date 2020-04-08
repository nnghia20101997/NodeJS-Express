var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const path = require("path");
const { check, validationResult } = require('express-validator');
const ValidatorItems  = require(__base__validator + "login");
const UsersModel      = require(__base__model + "users.js");
const systemConfig    = require(__base__configs + "system");

const linkLogin = `/auth/login`;
const linkRefix = `/`;


var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

router.get("/login", (req, res, next) =>{
    if(req.isAuthenticated() === true) res.redirect(linkRefix) // xu ly khi dang nhap roi ma quay ve trang Login thi van giu Dang Nhap
    let errors  = null;
    res.render('blog/pages/auth/auth.ejs', {
        layout: 'blog/login.ejs',
        errors,
    })
    res.end();
})

router.post("/login", ValidatorItems.validator(), async (req, res, next) =>{

    req.body = JSON.parse(JSON.stringify(req.body));
    const errors = validationResult(req);
    if(req.isAuthenticated() === true) res.redirect(linkRefix) // xu ly khi dang nhap roi ma quay ve trang Login thi van giu Dang Nhap

    if(!errors.isEmpty()){
        res.render("blog/pages/auth/auth.ejs", { 
            layout: 'blog/login.ejs',
            errors,
        })
    }else{ 
        passport.authenticate('local', { 
                    failureRedirect: linkLogin,
                    successRedirect: linkRefix
                })(req, res, next)
    }
    res.end();
});

passport.use(new LocalStrategy( 
    (username, password, done) => {

        let options = systemConfig.auth;
        if(username !== options.username){
            console.log("Ten Tai Khoan Khong dung")
            return done(null, false)
        }
        if(username !== options.username){
            console.log("Pass Word Khoan Khong dung")
            return done(null, false)
        }

        if(username === options.username && password === options.password){
            console.log("Dang nhap thanh cong")
            return done(null, options)
        }     
    }
));

passport.serializeUser(function(options, done){
    done(null, options);
});
passport.deserializeUser(function(options, done){
    done(null, options);
});



router.get('/logout', (req, res, next) =>{
    req.logout();
    res.redirect(linkLogin)
})

module.exports = router;
