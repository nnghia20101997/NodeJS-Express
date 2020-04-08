const systemConfig    = require(__base__configs + "system");
const linkLogin = `/${systemConfig.prefixAdmin}/auth/login`;


module.exports = (req, res, next) =>{
    if(req.isAuthenticated() === true){
        next()
    }else{
        res.redirect(linkLogin);
    }
}