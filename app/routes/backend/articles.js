var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const path = require("path");

const { check, validationResult } = require('express-validator');

const ValidatorArticles  = require(__base__validator + "articles.js");
const ArticlesModel      = require(__base__model + "articles.js");
const CategoryModel     = require(__base__schemas + "category.js");// Lấy ra giá trị name và id cua thằng GROUP để đổ vào add article
const UtilsHelper     = require(__base__helpers + "utils.js");
const FilesHelper     = require(__base__helpers + "file.js");
const ParamsHelper    = require(__base__helpers + "params.js");
const systemConfig    = require(__base__configs + "system");
const notify          = require(__base__configs + "notify");
const util            = require('util'); // util.format() vao nodejs.org/Utilities xem lai ho tro cho viec tach cau thong bao thanh 1 file rieng

const uploadThumb = FilesHelper.uploadHelper('thumb', "/uploads/articles");

const link = `/${systemConfig.prefixAdmin}/articles/status/`;
const titlePage = 'articles - ';
const titleList = titlePage + "LIST";
const titleADD = titlePage + "ADD";
const titleEDIT = titlePage + "EDIT";
const folderView = "admin/articles/";

/* articles. */
router.get('/status/(:status)?', async (req, res, next) => {
  let params = {
      currentStatus : ParamsHelper.getParams(req.params, "status", "all"),
      keyword       : ParamsHelper.getParams(req.query, "search", ""),

      //lấy ra session đã lưu /*SORT FIELD STAUS ORDERING NAME*/ sau đó bỏ vào sort() để làm điều kiện tìm kiếm của mongo
      sortField     : ParamsHelper.getParams(req.session, "sort_field", 'ordering'),
      sortType      : ParamsHelper.getParams(req.session, "sort_type", 'asc'),
      categorys_id     : ParamsHelper.getParams(req.session, "session_id", ""),

      //setting pagination
      pagination : {
        totalItem: '',
        totalItemPerPage: 4,
        currentPage: parseInt(ParamsHelper.getParams(req.query, "page", 1)),
        pageRanges: 3
      }
  }
  let statusFillter = await UtilsHelper.createFillterStatus(params.currentStatus, 'articles');
   
  // Lấy ra giá trị name cua thằng GROUP để đổ vào add articles
   let categorysItems = [];
   await CategoryModel.find({}, {_id: 1, name: 1}).then( (data) =>{  // Dùng select("name _id") cũng được
     categorysItems = data;
     categorysItems.unshift({_id: "novalue", name: "Choose categorys"}) // vì categorysItems là array và hàm unshift() là thêm vào đầu mãng.
    })

  //objWhere.categorys.categorys_id no se bao loi
  await ArticlesModel.countItems({}).then( (data) => {
    params.pagination.totalItem = data;
  });

  await ArticlesModel.listItems(params)
  .then( (data) => {
    res.render(`${folderView}list`, {
      title: titleList,
      items: data,
      statusFillter,
      categorysItems,
      params
    });
  })
})

/*CHANGE_STATUS*/
router.get("/change-status/:id/:status", (req, res, next) =>{
  let curentStatus =  ParamsHelper.getParams(req.params, "status", "active");
  let id           =  ParamsHelper.getParams(req.params, "id", "");

  //console.log(req.app.locals); cai nay de lay ra systemConfig nhung require() cho de
  ArticlesModel.changeStatus(id, curentStatus, {task : 'changeStatus'}).then( (result) =>{
    req.flash('success', notify.CHANGE_STATUS, false) 
  })
  res.redirect(link)
  res.end()
// cach 2
  /*ArticlesModel.findById(id).then( (data)=>{
    data.status = status;
    data.save().then( (result) =>{
      res.redirect("/admin123/article")
    })
  })*/
});

/*CHANGE_STATUS_MULTI*/
router.post("/change-status/:status", async (req, res, next) =>{
  let curentStatus =  ParamsHelper.getParams(req.params, "status", "active");
  let id = req.body.cid
  await ArticlesModel.changeStatus(id, curentStatus, {task : 'changeStatusMulti'}).then( (result) =>{
    req.flash('success', util.format(notify.CHANGE_STATUS_MULTI, result.n), false);
  })
  res.redirect(link)
  res.end();
});

/* DELETE */
router.get("/delete/:id", (req, res, next) => {
  let id = ParamsHelper.getParams(req.params, "id", '');

  ArticlesModel.delete(id, {task: "delete"}).then( (result) =>{
  })
    req.flash("warning", notify.DELETE, false);
    res.redirect(link);
});

/* DELETE-MULTI */
router.post("/deletemulti", async (req, res, next) =>{
  let id = req.body.cid;
  ArticlesModel.delete(id, {task: "deleteMulti"}).then( (result) =>{

  })
  let cids = (req.body.cid.length == 24)? 1 : req.body.cid.length;
  req.flash("warning", util.format(notify.DELETE_MULTI, cids), false)
  res.redirect(link);
  res.end();
});

/* CHANGES_ORDERING */
router.post("/change-ordering/", (req, res, next) =>{
  let cids = req.body.cid
  let currentOrdering = req.body.ordering

  if(Array.isArray(cids)){ // Ktra xem thang cids co phay la mang hay khong
    ArticlesModel.changeOrdering(cids, currentOrdering).then( (result) =>{
    })
  }else{
    ArticlesModel.changeOrdering(cids, currentOrdering).then( (result) =>{
    })
  }
  let numberCids = (req.body.cid.length == 24)? 1 : req.body.cid.length
  req.flash("success", util.format(notify.CHANGE_ORDERING_MULTI, numberCids), false)
  res.redirect(link)
  res.end();
});

/* SHOW ADD VS EDIT. */
router.get('/form(/:id)?', async (req, res, next) => {
  let id = ParamsHelper.getParams(req.params, 'id', '');
  let errors = null; // fix loi o check validator
  let errorsUpload = null;

   // Lấy ra giá trị name cua thằng GROUP để đổ vào add article
   let categorysItems = [];
   await CategoryModel.find({}, {_id: 1, name: 1}).then( (data) =>{  // Dùng select("name _id") cũng được
     categorysItems = data;
     categorysItems.unshift({_id: "novalue", name: "Choose categorys"}) // vì categorysItems là array và hàm unshift() là thêm vào đầu mãng.
   })

  if(id === ""){//article ADD
    let items = { // phai dat gia tri mac dinh nay neu khong trang add se khong hieu item render ben duoi edit
      name: "",
      status: "",
      ordering: 0,
      categorys: {
        id: "",
        name: ''
      }
    }
    res.render(`${folderView}form`, {title: titleADD, item: items, errors, categorysItems, errorsUpload});
  }else{//article EDIT

    ArticlesModel.getItem(id).then( (data) =>{
      res.render(`${folderView}form`, {title: titleEDIT, item: data, errors, categorysItems, errorsUpload});
    })
  }
});

//ADD & EDIT
router.post('/form/save', ValidatorArticles.validator(), (req, res, next) =>{
  
  uploadThumb(req, res, async (errUpload) => {

    let item = Object.assign(req.body) // lưu lại giá trị item ơ trên
    const errors = validationResult(req);

    let errorsUpload = [];
    if(errUpload){
       errorsUpload.push({param: 'avatar', msg: errUpload});
    }

    // Lấy ra giá trị name cua thằng GROUP để đổ vào add article
    let categorysItems = [];
    await CategoryModel.find({}, {_id: 1, name: 1}).then( (data) =>{  // Dùng select("name _id") cũng được
      categorysItems = data;
      categorysItems.unshift({_id: "novalue", name: "Choose categorys"}) // vì categorysItems là array và hàm unshift() là thêm vào đầu mãng.
    })

    if(item.id !== ""){ //EDIT article 
      req.body = JSON.parse(JSON.stringify(req.body));

         // Lấy ra tên của Group bên bản categorys để thưc hiện việc add vào article 
         let namecategorys = "";
         await categorysItems.forEach( (data) =>{
           if(req.body.categorys == data.id){
             namecategorys = data.name;
            }
         })


      if(!errors.isEmpty()){
        res.render("articles/form", { errors, item, title: titleADD, categorysItems, errorsUpload})// cho nay phai render day du cac thuoc tinh phia tren SHOW ADD VS EDIT
      }else{
       
        if(req.file === undefined){
          item.thumb = req.body.thumbOld;
        }else{
          item.thumb = req.file.filename;
          FilesHelper.fileRemove('public/uploads/articles/', req.body.thumbOld)
        }
        ArticlesModel.editItem(item, namecategorys, req.body).then( (result) ={

        })
        req.flash("success", notify.EDIT, false)
        res.redirect(link)
      }

    }else{ //ADD ITEM
      if(!errors.isEmpty()){
        if(req.file !== undefined){
          FilesHelper.fileRemove('public/uploads/articles/', req.file.filename) // xoa hinh anh khi form validate chua hop le. vi form chua hop le nhung bam submit hinh anh van duoc upload
        }
        res.render("articles/form", { errors, item, title: titleADD, categorysItems, errorsUpload}) // cho nay phai render day du cac thuoc tinh phia tren SHOW ADD VS EDIT
      }else{ //add
        req.body = JSON.parse(JSON.stringify(req.body)); // fix bug req.body.hasOwnProperty is not a function
  
        // Lấy ra tên của Group bên bản categorys để thưc hiện việc add vào article 
        let namecategorys = "";
        await categorysItems.forEach( (data) =>{
          if(req.body.categorys == data.id){
            namecategorys = data.name;
          }
        })        

        let thumbName = 'no-thumb.png';
        if(req.file !== undefined) thumbName = req.file.filename;
          await ArticlesModel.addItem(req.body, namecategorys, thumbName).then( (data) =>{


          })
          req.flash("success", notify.ADD, false);
          res.redirect(link)
      }
    }
    res.end();
  })
    
})

/*SORT FIELD STAUS ORDERING NAME*/
router.get("/sort/:sort_field/:sort_type", (req, res, next) => {
  let sort_field = ParamsHelper.getParams(req.params, "sort_field", "ordering");
  let sort_type = ParamsHelper.getParams(req.params, "sort_type", "asc");
  // Lưu vào session và sau đó về trang Item lấy ra và đưa vào monggo phương thức sort() để làm điều kiện tìm kiếm  

  req.session.sort_field = sort_field
  req.session.sort_type = sort_type
  //console.log(req.session.sort_field);

  res.redirect(link);
})

/* FILTER categorys */
router.get("/filter-categorys/:id", (req, res, next) => {
  let session_id = ParamsHelper.getParams(req.params, "id", "");

  // Lưu vào session và sau đó về trang Item lấy ra và đưa vào monggo phương thức sort() để làm điều kiện tìm kiếm  
  req.session.session_id = session_id
  res.redirect(link);
})

/* CHANGE-SPECIAL */
router.get("/change-special/:special/:id", (req, res, next) => {
  let curentSpecial = ParamsHelper.getParams(req.params, "special", "normal");
  let id            = ParamsHelper.getParams(req.params, "id", "");
  ArticlesModel.changeSpecial(id, curentSpecial, {task: 'changeSpecial'}).then( (result) =>{

  })
  res.redirect(link)
  res.end();
})
module.exports = router;
