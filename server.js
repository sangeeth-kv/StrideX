const env=require("dotenv").config()
require("dotenv").config();
const express=require("express");
const app=express();
const path=require("path")
const adminRoutes=require("./routes/admin")
const userRoutes=require("./routes/user")
const session=require("express-session")
const jwt = require("jsonwebtoken");
require("./config/passport"); 
console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET);


app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true
    
}))

app.use(express.urlencoded({extended:true}));
app.use(express.json())

app.use("/uploads", express.static("public/uploads"));  

const connectDB=require("./config/db/connectDB");

app.set('views', path.join(__dirname,'views'));



app.set("view engine","ejs")



app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Assign session user globally
    next();
});


app.use(express.static("public"))

app.use("/admin",adminRoutes)
app.use("/user",userRoutes)




connectDB();
app.listen(process.env.PORT,()=>console.log("server running"))