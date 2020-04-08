const UsersModel      = require(__base__schemas + "users.js");
const ParamsHelper    = require(__base__helpers + "params.js");
const fs              = require('fs');
const FilesHelper     = require(__base__helpers + "file.js");

module.exports = {
    listItems: (params) =>{
        let objWhere = {};

        //đặt điều kiện cho mongo chứ đem bỏ trực tiếp vào sort() mongo sẽ không hiểu và sẽ báo lỗi
        let sort = {}
        sort[params.sortField] = params.sortType;

        if(params.currentStatus !== "all") objWhere.status = params.currentStatus;
        if(params.keyword !=="") objWhere.name = new RegExp(params.keyword, 'i');
        if(params.groups_id !==''){
            objWhere["groups.id"] = params.groups_id;
        }else{
            objWhere = {}
        }

        return UsersModel
        .find(objWhere)
        .select("name avatar status ordering content created modified groups.name")
        .sort(sort)
        .limit(params.pagination.totalItemPerPage)
        .skip((params.pagination.currentPage - 1)* params.pagination.totalItemPerPage)
    },

    getItem: (id) => {
        return UsersModel.findById(id);
    },

    countItems: (params) =>{
        return UsersModel.count(params);
    },

    editItem: (item, nameGroups, params, options = null) =>{
        let items = {
            name: item.name, status: item.status, ordering: item.ordering, avatar: item.avatar,
            groups  : {
                id: ParamsHelper.getParams(params, 'groups', ''),
                name: nameGroups
            },
            modified : {
                user_id     : "0",
                user_name   : 'admin',
                time        : Date.now()
            }
        }
        return UsersModel.updateMany({_id: item.id}, items);
    },

    changeGroupsName: (item) => {
        return UsersModel.update({"groups.id": item.id}, {"groups.name": item.name});
    },

    addItem: (params, nameGroups, nameAvatar)=>{
        let items = {
            name: ParamsHelper.getParams(params, 'name', ''),
            status: ParamsHelper.getParams(params, 'status', "active"),
            ordering: ParamsHelper.getParams(params, 'ordering', 0),
            content : ParamsHelper.getParams(params, 'content', ''),
            username : ParamsHelper.getParams(params, 'username', ''),
            password : ParamsHelper.getParams(params, 'password', ''),
            avatar  : nameAvatar,
            groups  : {
              id: ParamsHelper.getParams(params, 'groups', ''),
              name: nameGroups
            },
            created : {
              user_id     : 0,
              user_name   : "admin",
              time        : Date.now()
            } 
          }    
        return UsersModel.insertMany(items);
    },

    changeStatus:(id, curentStatus, options = null) =>{
        let status       = (curentStatus == "active")? "inactive" : "active"; 
        
        let item = {
            status: status,
            modified : {
            user_id     : 0,
            user_name   : "admin",
            time        : Date.now()
            }
        }

        if(options.task == 'changeStatus'){
            return UsersModel.update({_id: id},item);
        }else if(options.task == 'changeStatusMulti'){
            item.status = curentStatus;
            return UsersModel.updateMany({_id: {$in: id}}, item);
        }
    },

    delete: async (id, options = null) =>{
        
        if(options.task =='delete'){
            UsersModel.findById(id).then( (data) => {
                FilesHelper.fileRemove('public/uploads/users/', data.avatar)
            })
            return UsersModel.deleteOne({_id: id});

        }else if(options.task == 'deleteMulti'){
            if(Array.isArray(id)){
                for(let index = 0; index < id.length; index ++){
                    await UsersModel.findById(id[index]).then( (data) =>{
                        const path = 'public/uploads/users/' + data.avatar;
                        try {
                            if (fs.existsSync(path)) {
                                fs.unlink(path, (err) => {
                                    if (err) throw err;
                                 });
                            }
                        } catch(err) {
                            console.error(err)
                        }
                    })
                }
            }else{
                UsersModel.findById(id).then( (data) => {
                    const path = 'public/uploads/users/' + data.avatar;
                    try {
                        if (fs.existsSync(path)) {
                            fs.unlink(path, (err) => {
                                if (err) throw err;
                             });
                        }
                    } catch(err) {
                        console.error(err)
                    }
                })  
            }
            return UsersModel.deleteMany({_id: {$in: id}});
        }
    },

    changeOrdering: async (cids, currentOrdering) => {
        let item = {
            ordering: parseInt(currentOrdering), 
            modified : {
              user_id     : 0,
              user_name   : "admin",
              time        : Date.now()
            }
          }

        if(Array.isArray(cids)){ // Ktra xem thang cids co phay la mang hay khong
           
        for(let index = 0; index < cids.length; index ++){
            item.ordering = parseInt(currentOrdering[index]); // phai bo index vao vi nhan phan phoi vo
            await UsersModel.updateOne({_id: cids[index]}, item);
        }
        return Promise.resolve("Success"); // phay tra ve neu khong se bi loi
    
        }else{
          return UsersModel.updateOne({_id: cids}, item);
        }
    },

    getUserPass: (usernameForm)=>{
        return UsersModel.find({status: 'active', username: usernameForm}).select("username password")
    }
}