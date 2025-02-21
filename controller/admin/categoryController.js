const categorySchema=require("../../model/categoryModel")


const categoryController={
    loadCategoryPage:async (req,res) => {
        try {
            // const categories=await categorySchema.find()
            // res.render("admin/category",{categories})
            let page = parseInt(req.query.page) || 1; // Default to page 1
            let limit = 5; // Number of categories per page
            let skip = (page - 1) * limit;

            const totalCategories = await categorySchema.countDocuments(); // Total count
            const totalPages = Math.ceil(totalCategories / limit);

            const categories = await categorySchema.find()
                .skip(skip)
                .limit(limit);

            res.render("admin/category", {
                categories,
                currentPage: page,
                totalPages,
            });
        } catch (error) {
            console.log(error)
            res.status(500).send("internal server error")
        }
    },
    loadEditCategory:async (req,res) => {
        try {
            res.render("admin/editcategory")
        } catch (error) {
            console.log(error)
            res.status(500).send("internal server error")
        }
    },
    editCategory:async (req,res) => {
        try {
         
            
            const { id } = req.params;
            console.log("this isidd"+id)

        const { editedCategoryName, editedCategoryDesc } = req.body;
        if(!editedCategoryName?.trim() || !editedCategoryDesc?.trim()){
            return res.status(401).json({

                message: 'Must fill all fields!',
                status: 'error',
            });
        }
        console.log(editedCategoryName+"  "+editedCategoryDesc)

        const existingCategory = await categorySchema.findOne({
            _id: { $ne: id }, // Exclude the current category being edited
            name: { $regex: new RegExp(`^${editedCategoryName.trim()}$`, "i") }
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category name already exists!",
                status: "error",
            });
        }

         await categorySchema.findByIdAndUpdate(id, { name:editedCategoryName.trim(), description:editedCategoryDesc });

        res.status(200).json({ success: true, message: "Category updated successfully" });
        } catch (error) {
            console.log(error)
             return res.status(500).send("internal server error")
        }
    },
    addCategory:async (req,res) => {
        try {
            const {name,description}=req.body
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
                description
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