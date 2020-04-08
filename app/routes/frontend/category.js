var express = require('express');
var router = express.Router();

const ParamsHelper    = require(__base__helpers + "params.js");
const ArticlesModel      = require(__base__model + "articles.js");
let folderView = 'blog/pages/';


router.get("/:id", async (req, res, next) =>{
    let id = ParamsHelper.getParams(req.params, "id", '');

    let itemCategory    = [];
    let listCategorys   = [];
    let itemsRandom    = [];

    await ArticlesModel.itemsRandom().then( (result) =>{  
        itemsRandom = result
    })

    await ArticlesModel.listItemsCategory().then( (result) =>{  
        itemCategory = result
    })

    await ArticlesModel.listCategorys(id).then( (result) =>{  
        listCategorys = result
    })


    res.render(folderView + "category/category.ejs", {
        layout: "blog/frontend.ejs",
        topPost: false,
        itemCategory,
        listCategorys,
        itemsRandom
    })
    res.end()
}) 

module.exports = router;
