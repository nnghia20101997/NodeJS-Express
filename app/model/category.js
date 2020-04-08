const CategoryModel      = require(__base__schemas + "category");
const ParamsHelper    = require(__base__helpers + "params.js");

module.exports = {
    listItems: (params)=>{
        let objWhere = {};
        //cach 1
        if(params.currentStatus === "all"){
            if(params.keyword !== "") objWhere = {name: new RegExp(params.keyword, 'i')}
        }else{
            objWhere = {status: params.currentStatus, name: new RegExp(params.keyword, 'i')}
        }
        /* // cach 2
        if(currentStatus !== "all") objWhere.status = currentStatus;
        if(keyword !=="") objWhere.name = new RegExp(keyword, 'i');
        */ 

        //đặt điều kiện cho mongo chứ đem bỏ trực tiếp vào sort() mongo sẽ không hiểu và sẽ báo lỗi
        let sort = {}
        sort[params.sortField] = params.sortType;
        //console.log(sort);
        return CategoryModel
            .find(objWhere)
            .select("name status ordering slug content created modified")
            .sort(sort)
            .limit(params.pagination.totalItemPerPage)
            .skip((params.pagination.currentPage - 1)* params.pagination.totalItemPerPage);
    },

    getItem: (id) => {
        return CategoryModel.findById(id);
    },

    addItem: (params)=>{
        let items = {
            name: ParamsHelper.getParams(params, 'name', ''),
            slug: ParamsHelper.getParams(params, 'slug', ''),
            status: ParamsHelper.getParams(params, 'status', "active"),
            ordering: ParamsHelper.getParams(params, 'ordering', 0),
            content : ParamsHelper.getParams(params, 'content', ''),
            created : {
                user_id     : 0,
                user_name   : "admin",
                time        : Date.now()
            } 
        }    
        return CategoryModel.insertMany(items)
    },

    editItem: (item, title)=>{
        let items = {
            name: item.name,slug: item.slug, status: item.status, ordering: item.ordering,
            modified : {
                user_id     : "0",
                user_name   : 'admin',
                time        : Date.now()
            }
        }
        return CategoryModel.updateMany({_id: item.id}, items)
    },//sds

    countItems: (params)=>{
       return CategoryModel.count(params)
    },

    changStatus: (id, curentStatus, id_changeMulti, options = null) =>{
       
        let status = (curentStatus == "active")? "inactive" : "active"; 
        let item = {
            status: status,
            modified : {
                user_id     : 0,
                user_name   : "admin",
                time        : Date.now()
            }
        }

        if(options.task == 'change-status'){
            return CategoryModel.update({_id: id},item); 
        }else if(options.task == 'change-status-multi'){
            item.status = curentStatus;
            return CategoryModel.updateMany({_id: {$in: id_changeMulti}}, item)
        }   
    },

    changOrdering: async (cids, currentOrdering) => {
        
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
            await CategoryModel.updateOne({_id: cids[index]}, item);
        }
        return Promise.resolve("Success"); // phay tra ve neu khong se bi loi
    
        }else{
          return CategoryModel.updateOne({_id: cids}, item);
        }
    },

    deleteItem: (id) =>{
        if((Array.isArray(id))){
            return CategoryModel.deleteMany({_id: {$in: id}})
        }else{
            return CategoryModel.deleteOne({_id: id});
        }
    },
}