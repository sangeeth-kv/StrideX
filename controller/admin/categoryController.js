const categorySchema=require("../../model/categoryModel");
// const { search } = require("../../routes/admin");


const categoryController={
    loadCategoryPage:async (req,res) => {
        try {
           
            let page = parseInt(req.query.page) || 1; // Default to page 1
            let limit = 5; // Number of categories per page
            let skip = (page - 1) * limit;

            //for searchh quetr frm url
            const searchQuery=req.query.search?req.query.search.trim():"";

            let filter={}
            if(searchQuery){
                filter.name={$regex:new RegExp(searchQuery,"i")};
            }
           
            const totalCategories = await categorySchema.countDocuments(filter); // Total count
            const totalPages = Math.ceil(totalCategories / limit);
    
            const categories = await categorySchema.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            res.render("admin/category", {
                categories,
                currentPage: page,
                totalPages,
                search:searchQuery,
            });

        } catch (error) {
            console.log(error)
            res.status(500).send("internal server error")
        }
    },
    editCategory:async (req,res) => {
        try {
         
            
            const { id } = req.params;
            const imageUrl=req.file ? `/uploads/${req.file.filename}`:"";
            console.log(req.body)

        const { name, description } = req.body;
        if(!name?.trim() || !description?.trim()){
            return res.status(401).json({
                message: 'Must fill all fields!',
                status: 'error',
            });
        }

        const existingCategory = await categorySchema.findOne({
            _id: { $ne: id }, // Exclude the current category being edited
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category name already exists!",
                status: "error",
            });
        }

         await categorySchema.findByIdAndUpdate(id, { name:name.trim(), description:description ,image:imageUrl});

        res.status(200).json({ success: true, message: "Category updated successfully" ,imageUrl});
        } catch (error) {
            console.log(error)
             return res.status(500).send("internal server error")
        }
    },
    addCategory:async (req,res) => {
        try {
            const {name,description}=req.body
            const imageUrl=req.file ? `/uploads/${req.file.filename}`:"";
            console.log("this is name of product"+name )
            console.log("this is descro"+description)
            
            if(!name || !description){
                return res.status(400).json({success:false ,message:"must fill the form"})
            }
            // const existingCatergory=await categorySchema.findOne({name})
            const existingCategory = await categorySchema.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, "i") } 
            });

            console.log(existingCategory)
            if(existingCategory){
               return res.status(409).json({success:false,message:"already existed category"})
            }

            const newcategory=new categorySchema({
                name,
                description,
                image:imageUrl
            })

            await newcategory.save();

           return res.status(201).json({ success: true, message: "Category added successfully!" });


        } catch (error) {
            console.log(error)
            res.status(500).send("internal server error")
        }
    },
    listUnlistCategory:async (req,res) => {
        try {
            const categoryId = req.params.id;
            const category = await categorySchema.findById(categoryId);
            if (!category) {
                return res.json({ success: false, message: "Category not found" });
            }
            
            category.isListed = !category.isListed;
            await category.save();
    
            return res.json({ success: true, newStatus: category.isListed });
        } catch (error) {
            console.log(error)
            res.status(500).json({message:" internal server error"})
        }
    }
}

module.exports=categoryController