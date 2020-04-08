var express = require('express');
var router = express.Router();
const ArticlesModel      = require(__base__model + "articles.js");
const systemConfig    = require(__base__configs + "system");
const linkLogin = `/${systemConfig.prefixAdmin}/auth/login`;



let folderView = 'blog/pages/';


router.get("/", async (req, res, next) =>{

    let itemSpecials = [];
    let itemNews    = [];
    let itemCategory    = [];
    let itemsRandom    = [];

    await ArticlesModel.listItemsSpecial().then( (result) =>{  
        itemSpecials = result
    })
    
    await ArticlesModel.listItemsNews().then( (result) =>{  
        itemNews = result
    })

    await ArticlesModel.listItemsCategory().then( (result) =>{  
        itemCategory = result
    })

    await ArticlesModel.itemsRandom().then( (result) =>{  
        itemsRandom = result
    })

    res.render(folderView + "home/home.ejs", {
        layout: "blog/frontend.ejs",
        topPost: true,
        itemSpecials,
        itemNews,
        itemCategory,
        itemsRandom
    })
    res.end()
})

router.get("/login", (req, res, next) =>{
   res.redirect(linkLogin);
   res.end()
})

module.exports = router;
