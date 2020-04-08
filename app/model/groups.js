const GroupsModel  = require(__base__schemas + "groups");
const ParamsHelper    = require(__base__helpers + "params.js");

module.exports = {

    listItems: (params) =>{
        let objWhere = {}
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
    return GroupsModel
        .find(objWhere)
        .sort(sort)
        .select("name status ordering content groups_acp created modified")
        .limit(params.pagination.totalItemPerPage)
        .skip((params.pagination.currentPage - 1)* params.pagination.totalItemPerPage)
    },

    getItem: (id) => {
        return GroupsModel.findById(id);
    },

    countItems: (params) =>{
        return GroupsModel.count(params)
    },

    addItem: (params)=>{
        let items = {
            name: ParamsHelper.getParams(params, 'name', ''),
            status: ParamsHelper.getParams(params, 'status', "active"),
            ordering: ParamsHelper.getParams(params, 'ordering', 0),
            content : ParamsHelper.getParams(params, 'content', ''),
            groups_acp: ParamsHelper.getParams(params, 'groups_acp', 'no'),
            created : {
              user_id     : 0,
              user_name   : "admin",
              time        : Date.now()
            } 
          }    
        return GroupsModel.insertMany(items);
    },
    
    editItem: (item)=>{
       
        let items = {
            name: item.name, status: item.status, ordering: item.ordering, groups_acp: item.groups_acp,
            modified : {
                user_id     : "0",
                user_name   : 'admin',
                time        : Date.now()
            }
        }
          return GroupsModel.updateMany({_id: item.id}, items);
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
            return GroupsModel.update({_id: id},item);
        }else if(options.task == 'changeStatusMulti'){
            item.status = curentStatus;
            return GroupsModel.updateMany({_id: {$in: id}}, item);
        }
    },

    delete: (id, options = null) =>{
        if(options.task =='delete'){
            return GroupsModel.deleteOne({_id: id});
        }else if(options.task == 'deleteMulti'){
            return GroupsModel.deleteMany({_id: {$in: id}});
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
            await GroupsModel.updateOne({_id: cids[index]}, item);
        }
        return Promise.resolve("Success"); // phay tra ve neu khong se bi loi
    
        }else{
          return GroupsModel.updateOne({_id: cids}, item);
        }
    },

    changeGroupACP: (id, currentGroupACP) =>{
        (currentGroupACP == 'yes')? currentGroupACP = 'no' : currentGroupACP = 'yes';
      
        let item = {
          groups_acp: currentGroupACP,
          modified : {
            user_id     : "0",
            user_name   : 'admin',
            time        : Date.now()
          }
        }
        return GroupsModel.updateOne({_id: id}, item);
    },

}