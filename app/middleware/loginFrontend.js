
module.exports = (req, res, next) =>{
    let userInfo = {};
    if(req.isAuthenticated() === true){
        userInfo = req.user
    }
    res.locals.userInfo = userInfo
    next()
}