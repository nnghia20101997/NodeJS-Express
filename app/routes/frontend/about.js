var express = require('express');
var router = express.Router();

const ArticlesModel      = require(__base__model + "articles.js");

router.get("/about", async (req, res, next) =>{
    
    let listCategorys   = [];
    await ArticlesModel.listItemsCategory().then( (result) =>{  
        itemCategory = result
    })

   res.render('blog/pages/about/about.ejs', {
       layout: 'blog/frontend.ejs',
       itemCategory,
       topPost: false
   })
})

module.exports = router;
