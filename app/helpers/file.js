var randomstring = require("randomstring");
var multer  = require('multer');
const path = require("path");
const fs = require("fs");

let uploadHelper = (field, folderUpload = "/uploads/users", fileNameLenght = 10, fileSizeMB = 1, fileExtentions = "jpg|jpeg|png|gif") =>{
    var storage = multer.diskStorage({ //noi cau hinh uploads
        destination: function (req, file, cb) {
          cb(null, __base_public + folderUpload) // duong dan
        },
        filename: function (req, file, cb) { // Dat ten fileUploads
          //const uniqueSuffix = Date.now() + file.originalname
          cb(null, randomstring.generate(fileNameLenght) + path.extname(file.originalname)) // path.extname(file.originalname)) lay phan mo rong
        }
      })
      
      var upload = multer({ 
        storage: storage ,
        limits: {
          fileSize: fileSizeMB * 1024 * 1240, // gioi han dung luong
        },
        fileFilter: (req, file, cb)=>{  // gioi hang phan mo rong
          const filetypes = new RegExp(fileExtentions);
          const extname   = filetypes.test(path.extname(file.originalname).toLowerCase());
          const mimetype  = filetypes.test(file.mimetype);
          if(mimetype && extname){
            return cb(null, true)
          } else{
            cb('Phan mo rong khong hop le');
          }
        }
      }).single(field)

      return upload;
}

let fileRemove = (folder, fileName) =>{
  const path = folder + fileName
  if(fileName !== '' && fileName !== undefined){
    try {
      if (fs.existsSync(path)) {
          fs.unlink(path, (err) => {
              if (err) throw err;
           });
      }
    } catch(err) {
        console.error(err)
    }
  }
};

module.exports = {
    uploadHelper,
    fileRemove
}