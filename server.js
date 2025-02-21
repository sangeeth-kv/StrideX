const env=require("dotenv").config()
require("dotenv").config();
const express=require("express");
const app=express();
const path=require("path")
// const bodyParser=require("body-parser")
const adminRoutes=require("./routes/admin")
const userRoutes=require("./routes/user")
// const flash=require("express-flash")
const session=require("express-session")
// const flash = require("connect-flash");
const jwt = require("jsonwebtoken");
require("./config/passport"); // Ensure this is present
console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET);

// const passport=require("passport")
// require("./passport")
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true
    
}))
// app.use(flash())
// app.use((req, res, next) => {
//     console.log("📌 Current Flash Messages in Middleware:", req.flash());
//     res.locals.messages = req.flash();
//     console.log(res.locals.messages+"thisis the message on app.use")
//     next();
// });
app.use(express.urlencoded({extended:true}));
app.use(express.json())
// app.use(bodyParser.json({ limit: "100mb" })); // Increase JSON request size
// app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }))



app.use("/uploads", express.static("public/uploads"));





const connectDB=require("./config/db/connectDB");

app.set('views', path.join(__dirname,'views'));



app.set("view engine","ejs")





app.use(express.static("public"))

app.use("/admin",adminRoutes)
app.use("/user",userRoutes)




connectDB();
app.listen(process.env.PORT,()=>console.log("server running"))