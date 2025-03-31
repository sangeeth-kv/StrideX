// const multer=require("multer")
// const path=require("path")


// const storage=multer.diskStorage({
//     destination:(req,res,cb)=>{
//         cb(null,"/uploads/")
//     },
//     filename:(req,res,cb)=>{
//         cb(null,Date.now()+path.extname(file.originalname));
//     }
// })

// const fileFilter=(req,res,cb)=>{
//     const allowedTypes=["image/jpeg","image/png","image/jpg"];
//     if(allowedTypes.includes(file.mimetype)){                              //des typpe of file contains jpg/pdf etc/.
//         cb(null,true)
//     }else{
//         cb(new Error("Only images are allowed!"), false);
//     }
// };

// const upload=multer({
//     storage,
//     fileFilter,
//     limits:{fileSize: 5*1024*1024} //lm 5mb
// })

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed!"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
});

module.exports = upload;