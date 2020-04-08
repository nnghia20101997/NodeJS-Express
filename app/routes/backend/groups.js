var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

const { check, validationResult } = require('express-validator');
const UsersModel      = require(__base__model + "users.js");
const ValidatorGroups = require(__base__validator + "groups");
const GroupsModel     = require(__base__model + "groups");
const UtilsHelper     = require(__base__helpers + "utils.js");
const ParamsHelper    = require(__base__helpers + "params.js");
const systemConfig    = require(__base__configs + "system");
const notify          = require(__base__configs + "notify");
const util            = require('util'); // util.format() vao nodejs.org/Utilities xem lai ho tro cho viec tach cau thong bao thanh 1 file rieng

const link = `/${systemConfig.prefixAdmin}/groups/status/`;
const titlePage = 'GROUPS - ';
const titleList = titlePage + "LIST";
const titleADD = titlePage + "ADD";
const titleEDIT = titlePage + "EDIT";
const folderView = "admin/groups/";

/* GROUPS. */
router.get('/status/(:status)?', async (req, res, next) => {
  let params= {
    currentStatus : ParamsHelper.getParams(req.params, "status", "all"),
    keyword       : ParamsHelper.getParams(req.query, "search", ""),
    //lấy ra session đã lưu /*SORT FIELD STAUS ORDERING NAME*/ sau đó bỏ vào sort() để làm điều kiện tìm kiếm của mongo
    sortField     : ParamsHelper.getParams(req.session, "sort_field", 'ordering'),
    sortType      : ParamsHelper.getParams(req.session, "sort_type", 'asc'),
     //setting pagination
    pagination : {
      totalItem: '',
      totalItemPerPage: 10,
      currentPage: parseInt(ParamsHelper.getParams(req.query, "page", 1)),
      pageRanges: 3
    }
  };

  let statusFillter = await UtilsHelper.createFillterStatus(params.currentStatus, 'groups');

  await GroupsModel.countItems({}).then( (data) => {
    params.pagination.totalItem = data;
  });

  await GroupsModel.listItems(params)
    .then( (data) => {
      res.render(`${folderView}list`, {
        title: titleList,
        items: data,
        statusFillter,
        params
    });
  })
})

/*CHANGE_STATUS*/
router.get("/change-status/:id/:status", (req, res, next) =>{
  let curentStatus =  ParamsHelper.getParams(req.params, "status", "active");
  let id           =  ParamsHelper.getParams(req.params, "id", "");
  //console.log(req.app.locals); cai nay de lay ra systemConfig nhung require() cho de
  GroupsModel.changeStatus(id, curentStatus, {task: 'changeStatus'}).then( (result) =>{

  })
    req.flash('success', notify.CHANGE_STATUS, false) 
    res.redirect(link)
});

/*CHANGE_STATUS_MULTI*/
router.post("/change-status/:status", async (req, res, next) =>{
  let curentStatus =  ParamsHelper.getParams(req.params, "status", "active");
  let id = req.body.cid;
  await GroupsModel.changeStatus(id, curentStatus, {task: 'changeStatusMulti'}).then( (result) => {
    req.flash('success', util.format(notify.CHANGE_STATUS_MULTI, result.n), false) 
  })
  res.redirect(link)
  res.end();
});

/* DELETE */
router.get("/delete/:id", (req, res, next) => {
  let id = ParamsHelper.getParams(req.params, "id", '');
  
  GroupsModel.delete(id, {task: "delete"}).then( (result) => {
    
  })
  req.flash("warning", notify.DELETE, false);
  res.redirect(link);
});

/* DELETE-MULTI */
router.post("/deletemulti", async (req, res, next) =>{
  let id = req.body.cid;
  GroupsModel.delete(id, {task: "deleteMulti"}).then( (result) =>{

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
  GroupsModel.changeOrdering(cids, currentOrdering).then( (result) =>{

  })
  let numberCids = (req.body.cid.length == 24)? 1 : req.body.cid.length
  req.flash("success", util.format(notify.CHANGE_ORDERING_MULTI, numberCids), false)
  res.redirect(link)
  res.end();
});

/* SHOW ADD VS EDIT. */
router.get('/form(/:id)?', function(req, res, next) {
  let id = ParamsHelper.getParams(req.params, 'id', '');
  let errors = null; // fix loi o check validator

  if(id === ""){//GROUPS ADD
    let items = { // phai dat gia tri mac dinh nay neu khong trang add se khong hieu item render ben duoi edit
      name: "",
      status: "",
      ordering: 0
    }
    res.render(`${folderView}form`, {title: titleADD, item: items, errors});
  }else{//GROUPS EDIT
    GroupsModel.getItem(id).then( (result) =>{
      res.render(`${folderView}form`, {title: titleEDIT, item: result, errors});
    })
  }
});

//ADD & EDIT
router.post('/form/save', ValidatorGroups.validator(),  async (req, res, next) =>{

    let item = Object.assign(req.body) // lưu lại giá trị item ơ trên
    const errors = validationResult(req);

    if(item.id !== ""){//EDIT ITEM

      if(!errors.isEmpty()){
        res.render("groups/form", { errors, item, title:"ITEM ADD"})// cho nay phai render day du cac thuoc tinh phia tren SHOW ADD VS EDIT
      }else{
        GroupsModel.editItem(item).then( (result) =>{
            UsersModel.changeGroupsName(item).then( (data) =>{
            })
        })  
        req.flash("success", notify.EDIT, false)
        res.redirect(link)
      }

    }else{ //ADD ITEM
      if(!errors.isEmpty()){
        res.render("groups/form", {
          errors,
          item,
          title:"ITEM ADD" // cho nay phai render day du cac thuoc tinh phia tren SHOW ADD VS EDIT
        })
      }else{ //add
        req.body = JSON.parse(JSON.stringify(req.body)); // fix bug req.body.hasOwnProperty is not a function
          GroupsModel.addItem(req.body).then( (result) =>{

          })
          req.flash("success", notify.ADD, false);
          res.redirect(link)
      }
    }
    res.end();
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

/* CHANGE-GROUPS-ACP */
router.get("/change-groups-acp/:id/:currentGroupACP", (req, res, next) =>{
  let id = ParamsHelper.getParams(req.params, 'id', '');
  let currentGroupACP = ParamsHelper.getParams(req.params, 'currentGroupACP', 'no');
  
  GroupsModel.changeGroupACP(id, currentGroupACP).then( (result) =>{
    
  })
  res.redirect(link);
  res.end()
})

module.exports = router;
