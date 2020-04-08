const ArticlesModel      = require(__base__schemas + "articles.js");
const CategorysModel      = require(__base__schemas + "category.js");

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
       
        return ArticlesModel
        .find(objWhere)
        .select("name thumb status special ordering content created modified categorys.name")
        .sort(sort)
        .limit(params.pagination.totalItemPerPage)
        .skip((params.pagination.currentPage - 1)* params.pagination.totalItemPerPage)
    },

    listItemsSpecial : (options = null) => {
        return ArticlesModel.find({status: 'active', special: 'toppost'})
                            .select("name created.user_name created.time categorys.id categorys.name thumb")
                            .limit(3)
                            .sort({ordering: "asc"})
    },

    listItemsNews : (options = null) => {
        return ArticlesModel.find({status: 'active'})
                            .select("name created.user_name created.time categorys.name categorys.id thumb content")
                            .limit(3)
                            .sort({"created.time": "desc"})
    },

    listItemsCategory : (options = null) => {
        return CategorysModel.find({status: 'active'})
                            .select("name id")
                            .sort({ordering: "asc"})
    },

    listCategorys : (id) => {
        return ArticlesModel.find({status: 'active', "categorys.id": id})
                            .select("name created.user_name created.time categorys.name categorys.id thumb content")
                            .sort({ordering: "asc"})
    },
    
    itemsRandom : () => {
        return ArticlesModel.aggregate([
                                {$match: {status: 'active'}},
                                {$project: {_id: 1, name: 1, created: 1, thumb: 1}},
                                {$sample: {size: 3}},
        ])
    },

    itemPost: (id) => {
        return ArticlesModel.find({_id: id})
                            .select("name created.user_name created.time categorys.name thumb content")
                            .sort({ordering: 'asc'})
    },

    getItem: (id) => {
        return ArticlesModel.findById(id);
    },

    countItems: (params) =>{
        return ArticlesModel.count(params);
    },

    editItem: (item, namecategorys, params, options = null) =>{
        let items = {
            name: item.name, status: item.status, ordering: item.ordering, thumb: item.thumb, special: item.special, slug: item.slug, content: item.content,
            categorys  : {
                id: ParamsHelper.getParams(params, 'categorys', ''),
                name: namecategorys
            },
            modified : {
                user_id     : "0",
                user_name   : 'admin',
                time        : Date.now()
            }
        }
        return ArticlesModel.updateMany({_id: item.id}, items);
    },

    changecategorysName: (item) => {
        return ArticlesModel.update({"categorys.id": item.id}, {"categorys.name": item.name});
    },

    addItem: (params, namecategorys, thumbName)=>{
        let items = {
            name: ParamsHelper.getParams(params, 'name', ''),
            slug: ParamsHelper.getParams(params, 'slug', ''),
            status: ParamsHelper.getParams(params, 'status', "active"),
            special: ParamsHelper.getParams(params, 'special', "normal"),
            ordering: ParamsHelper.getParams(params, 'ordering', 0),
            content : ParamsHelper.getParams(params, 'content', ''),
            thumb  : thumbName,
            categorys  : {
              id: ParamsHelper.getParams(params, 'categorys', ''),
              name: namecategorys
            },
            created : {
              user_id     : 0,
              user_name   : "admin",
              time        : Date.now()
            } 
          }    
        return ArticlesModel.insertMany(items);
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
            return ArticlesModel.update({_id: id},item);
        }else if(options.task == 'changeStatusMulti'){
            item.status = curentStatus;
            return ArticlesModel.updateMany({_id: {$in: id}}, item);
        }
    },


    changeSpecial: (id, curentSpecial, options = null) =>{
        let special       = (curentSpecial == "normal")? "toppost" : "normal"; 
        
        let item = {
            special: special,
            modified : {
            user_id     : 0,
            user_name   : "admin",
            time        : Date.now()
            }
        }

        if(options.task == 'changeSpecial'){
            return ArticlesModel.update({_id: id},item);
        }else if(options.task == 'changeStatusMulti'){
            console.log("hahaahahah");
        }
    },



    delete: async (id, options = null) =>{
        
        if(options.task =='delete'){
            ArticlesModel.findById(id).then( (data) => {
                FilesHelper.fileRemove('public/uploads/articles/', data.avatar)
            })
            return ArticlesModel.deleteOne({_id: id});

        }else if(options.task == 'deleteMulti'){
            if(Array.isArray(id)){
                for(let index = 0; index < id.length; index ++){
                    await ArticlesModel.findById(id[index]).then( (data) =>{
                        const path = 'public/uploads/articles/' + data.avatar;
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
                ArticlesModel.findById(id).then( (data) => {
                    const path = 'public/uploads/articles/' + data.avatar;
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
            return ArticlesModel.deleteMany({_id: {$in: id}});
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
            await ArticlesModel.updateOne({_id: cids[index]}, item);
        }
        return Promise.resolve("Success"); // phay tra ve neu khong se bi loi
    
        }else{
          return ArticlesModel.updateOne({_id: cids}, item);
        }
    },


}
