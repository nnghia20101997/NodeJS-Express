
let createFillterStatus = async (currentStatus, collection) =>{
  
  const currentModel = require(__base__schemas + collection);

      let statusFillter = [ 
        {name: 'all', value: 'all', count: 1, class: 'default'},
        {name: 'active', value: 'active', count: 23, class: 'default'},
        {name: 'inactive', value: 'inactive', count: 2, class: 'default'}
      ];

      //console.log(statusFillter.length);
      //statusFillter.forEach( async (data, index) =>{ // async await forEach xu ly dem sai

      for(let index = 0; index < statusFillter.length; index++){
        let condition = {};
        let data = statusFillter[index];
   
        if(data.value !== 'all') condition = {status: data.value};
        if(currentStatus === data.value) data.class = 'success';

        await currentModel.countDocuments(condition).then( (data) =>{
          statusFillter[index].count = data;
        })
      }  
      return statusFillter;
}

module.exports = {
    createFillterStatus
}