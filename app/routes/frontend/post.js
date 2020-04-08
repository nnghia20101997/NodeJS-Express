var express = require('express');
var router = express.Router();

let folderUploads = 'blog/pages/';
const ParamsHelper    = require(__base__helpers + "params.js");
const ArticlesModel      = require(__base__model + "articles.js");


router.get("/article/:id", async (req, res, next) =>{
    let id = ParamsHelper.getParams(req.params, "id", "");
    
    let itemPost = [];
    let itemNews    = [];
    let itemCategory    = [];
    let itemsRandom    = [];

    await ArticlesModel.listItemsNews().then( (result) =>{  
        itemNews = result
    })

    await ArticlesModel.listItemsCategory().then( (result) =>{  
        itemCategory = result
    })

    await ArticlesModel.itemsRandom().then( (result) =>{  
        itemsRandom = result
    })

    await ArticlesModel.itemPost(id).then( (result) =>{
        itemPost = result;
    })

    res.render( folderUploads + "post/post.ejs", {
        layout: "blog/frontend.ejs",
        topPost: false,
        itemPost,
        itemsRandom,
        itemCategory,
        itemNews
    })
    res.end()
})

module.exports = router;
