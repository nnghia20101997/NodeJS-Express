var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const path = require("path");

const { check, validationResult } = require('express-validator');

const ValidatorUsers  = require(__base__validator + "users.js");
const UsersModel      = require(__base__model + "users.js");
const GroupsModel     = require(__base__schemas + "groups.js");// Lấy ra giá trị name và id cua thằng GROUP để đổ vào add USERS
const UtilsHelper     = require(__base__helpers + "utils.js");
const FilesHelper     = require(__base__helpers + "file.js");
const ParamsHelper    = require(__base__helpers + "params.js");
const systemConfig    = require(__base__configs + "system");
const notify          = require(__base__configs + "notify");
const util            = require('util'); // util.format() vao nodejs.org/Utilities xem lai ho tro cho viec tach cau thong bao thanh 1 file rieng
const uploadAvatar = FilesHelper.uploadHelper('avatar');

const link = `/${systemConfig.prefixAdmin}/users/status/`;
const titlePage = 'USERS - ';
const titleList = titlePage + "LIST";
const titleADD = titlePage + "ADD";
const titleEDIT = titlePage + "EDIT";
const folderView = "admin/users/";

/* USERS. */
router.get('/status/(:status)?', async (req, res, next) => {
  let params = {
      currentStatus : ParamsHelper.getParams(req.params, "status", "all"),
      keyword       : ParamsHelper.getParams(req.query, "search", ""),

      //lấy ra session đã lưu /*SORT FIELD STAUS ORDERING NAME*/ sau đó bỏ vào sort() để làm điều kiện tìm kiếm của mongo
      sortField     : ParamsHelper.getParams(req.session, "sort_field", 'ordering'),
      sortType      : ParamsHelper.getParams(req.session, "sort_type", 'asc'),
      groups_id     : ParamsHelper.getParams(req.session, "session_id", ""),

      //setting pagination
      pagination : {
        totalItem: '',
        totalItemPerPage: 4,
        currentPage: parseInt(ParamsHelper.getParams(req.query, "page", 1)),
        pageRanges: 3
      }
  }
  let statusFillter = await UtilsHelper.createFillterStatus(params.currentStatus, 'users');
   
  // Lấy ra giá trị name cua thằng GROUP để đổ vào add USERS
   let groupsItems = [];
   await GroupsModel.find({}, {_id: 1, name: 1}).then( (data) =>{  // Dùng select("name _id") cũng được
     groupsItems = data;
     groupsItems.unshift({_id: "novalue", name: "Choose Groups"}) // vì groupsItems là array và hàm unshift() là thêm vào đầu mãng.
   })

  //objWhere.groups.groups_id no se bao loi
  await UsersModel.countItems({}).then( (data) => {
    params.pagination.totalItem = data;
  });

  await UsersModel.listItems(params)
  .then( (data) => {
    res.render(`${folderView}list`, {
      title: titleList,
      items: data,
      statusFillter,
      groupsItems,
      params
    });
  })
})

/*CHANGE_STATUS*/
router.get("/change-status/:id/:status", (req, res, next) =>{
  let curentStatus =  ParamsHelper.getParams(req.params, "status", "active");
  let id           =  ParamsHelper.getParams(req.params, "id", "");

  //console.log(req.app.locals); cai nay de lay ra systemConfig nhung require() cho de
  UsersModel.changeStatus(id, curentStatus, {task : 'changeStatus'}).then( (result) =>{
    req.flash('success', notify.CHANGE_STATUS, false) 
  })
  res.redirect(link)
  res.end()
// cach 2
  /*UsersModel.findById(id).then( (data)=>{
    data.status = status;
    data.save().then( (result) =>{
      res.redirect("/admin123/users")
    })
  })*/
});

/*CHANGE_STATUS_MULTI*/
router.post("/change-status/:status", async (req, res, next) =>{
  let curentStatus =  ParamsHelper.getParams(req.params, "status", "active");
  let id = req.body.cid
  await UsersModel.changeStatus(id, curentStatus, {task : 'changeStatusMulti'}).then( (result) =>{
    req.flash('success', util.format(notify.CHANGE_STATUS_MULTI, result.n), false);
  })
  res.redirect(link)
  res.end();
});

/* DELETE */
router.get("/delete/:id", (req, res, next) => {
  let id = ParamsHelper.getParams(req.params, "id", '');

  UsersModel.delete(id, {task: "delete"}).then( (result) =>{
  })
    req.flash("warning", notify.DELETE, false);
    res.redirect(link);
});

/* DELETE-MULTI */
router.post("/deletemulti", async (req, res, next) =>{
  let id = req.body.cid;
  UsersModel.delete(id, {task: "deleteMulti"}).then( (result) =>{

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
    UsersModel.changeOrdering(cids, currentOrdering).then( (result) =>{
    })
  }else{
    UsersModel.changeOrdering(cids, currentOrdering).then( (result) =>{
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

   // Lấy ra giá trị name cua thằng GROUP để đổ vào add USERS
   let groupsItems = [];
   await GroupsModel.find({}, {_id: 1, name: 1}).then( (data) =>{  // Dùng select("name _id") cũng được
     groupsItems = data;
     groupsItems.unshift({_id: "novalue", name: "Choose Groups"}) // vì groupsItems là array và hàm unshift() là thêm vào đầu mãng.
   })

  if(id === ""){//USERS ADD
    let items = { // phai dat gia tri mac dinh nay neu khong trang add se khong hieu item render ben duoi edit
      name: "",
      status: "",
      ordering: 0,
      groups: {
        id: "",
        name: ''
      }
    }
    res.render(`${folderView}form`, {title: titleADD, item: items, errors, groupsItems, errorsUpload});
  }else{//USERS EDIT

    UsersModel.getItem(id).then( (data) =>{
      res.render(`${folderView}form`, {title: titleEDIT, item: data, errors, groupsItems, errorsUpload});
    })
  }
});

//ADD & EDIT
router.post('/form/save', ValidatorUsers.validator(), (req, res, next) =>{
  
  uploadAvatar(req, res, async (errUpload) => {
    let item = Object.assign(req.body) // lưu lại giá trị item ơ trên
    const errors = validationResult(req);

    let errorsUpload = [];
    if(errUpload){
       errorsUpload.push({param: 'avatar', msg: errUpload});
    }

    // Lấy ra giá trị name cua thằng GROUP để đổ vào add USERS
    let groupsItems = [];
    await GroupsModel.find({}, {_id: 1, name: 1}).then( (data) =>{  // Dùng select("name _id") cũng được
      groupsItems = data;
      groupsItems.unshift({_id: "novalue", name: "Choose Groups"}) // vì groupsItems là array và hàm unshift() là thêm vào đầu mãng.
    })

    if(item.id !== ""){ //EDIT USERS 
      req.body = JSON.parse(JSON.stringify(req.body));

         // Lấy ra tên của Group bên bản Groups để thưc hiện việc add vào users 
         let nameGroups = "";
         await groupsItems.forEach( (data) =>{
           if(req.body.groups == data.id){
             nameGroups = data.name;
            }
         })


      if(!errors.isEmpty()){
        res.render("users/form", { errors, item, title: titleADD, groupsItems, errorsUpload})// cho nay phai render day du cac thuoc tinh phia tren SHOW ADD VS EDIT
      }else{
        if(req.file === undefined){
          item.avatar = req.body.avatarOld;
        }else{
          item.avatar = req.file.filename;
          FilesHelper.fileRemove('public/uploads/users/', req.body.avatarOld)
        }
        UsersModel.editItem(item, nameGroups, req.body).then( (result) ={

        })
        req.flash("success", notify.EDIT, false)
        res.redirect(link)
      }

    }else{ //ADD ITEM
      if(!errors.isEmpty()){
        if(req.file !== undefined){
          FilesHelper.fileRemove('public/uploads/users/', req.file.filename) // xoa hinh anh khi form validate chua hop le. vi form chua hop le nhung bam submit hinh anh van duoc upload
        }
        res.render("users/form", { errors, item, title: titleADD, groupsItems, errorsUpload}) // cho nay phai render day du cac thuoc tinh phia tren SHOW ADD VS EDIT
      }else{ //add
        req.body = JSON.parse(JSON.stringify(req.body)); // fix bug req.body.hasOwnProperty is not a function

        // Lấy ra tên của Group bên bản Groups để thưc hiện việc add vào users 
        let nameGroups = "";
        await groupsItems.forEach( (data) =>{
          if(req.body.groups == data.id){
            nameGroups = data.name;
          }
        })        

        let avatarName = 'no-avatar';
        if(req.file !== undefined) avatarName = req.file.filename;
          await UsersModel.addItem(req.body, nameGroups, avatarName).then( (data) =>{

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

/* FILTER GROUPS */
router.get("/filter-groups/:id", (req, res, next) => {
  let session_id = ParamsHelper.getParams(req.params, "id", "");

  // Lưu vào session và sau đó về trang Item lấy ra và đưa vào monggo phương thức sort() để làm điều kiện tìm kiếm  
  req.session.session_id = session_id
  res.redirect(link);
})

router.post('/uploads', (req, res, next) =>{
  let errors = [];
  addAvatar(req, res, (err) => {
    if(err){
       errors.push({errors:{param: 'avatar', msg: err}});
    }
    res.render(`${folderView}uploads`, {errors});
    res.end();
  })
})
module.exports = router;
