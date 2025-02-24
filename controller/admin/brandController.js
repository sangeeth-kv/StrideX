const brandSchema=require("../../model/brandModel")


const brandController={

    loadBrandPage: async (req, res) => {
        try {
     
          let page=parseInt(req.query.page)||1
          let limit=5;
          let skip=(page-1)*limit

          const searchQuery=req.query.search?req.query.search.trim():"";
          let filter={}
          if(searchQuery){
            filter.name= {$regex:new RegExp(searchQuery,"i")}
          }
          const totalCategories=await brandSchema.countDocuments(filter)
          const totalPages=Math.ceil(totalCategories/limit)

          const brands = await brandSchema.find(filter).sort({createdAt:-1}).skip(skip).limit(limit)
          
          res.render("admin/brand", {
            brands: brands,
            currentPage:page,
            totalPages,
            search:searchQuery });
        } catch (error) {
          console.log(error);
        }
      },
      addBrands:async (req,res) => {
        try {
          console.log("start of add brands")
          const {name,description}=req.body
          const imageUrl=req.file ? `/uploads/${req.file.filename}`:"";
          if(!name || !description){
            return res.status(400).json({message:"must fill all fields!!"})
          }
          const existingBrand=await brandSchema.findOne({
            name:{$regex:new RegExp(`^${name}$`,"i")}
          });

          if(existingBrand){
            return res.status(409).json({message:"This brand already exists"})
          }
          console.log("the ehehje")
          const newBrand=new brandSchema({
            name,
            description,
            image:imageUrl
          })

          await newBrand.save();

          return res.status(201).json({success:true,message:"Brand added successfully!"})

        } catch (error) {
          console.log(error )
          res.status(500).send("server error")
        }
      },editBrands:async (req,res) => {
        try {
          console.log("heeieieiei")
            const {id}=req.params;
            const  imageUrl=req.file?`/uploads/${req.file.filename}`:"";
            const {name,description}=req.body;
            console.log(id+"  "+description+"   "+name+"   "+imageUrl)

            if(!name.trim() || !description.trim()){
              return res.status(401).json({
                message:"Must enter all fields",
                status:"error"
              })
            }

            const existingBrand = await brandSchema.findOne({
                        _id: { $ne: id }, // Exclude the current category being edited
                        name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
            });
            if(existingBrand){
              return res.status(409).json({
                message: "Brand name already exists!",
                status: "error",
            });
            }

             await brandSchema.findByIdAndUpdate(id, { name:name.trim(), description:description ,image:imageUrl});
             console.log("completed")
             res.status(200).json({ success: true, message: "Brand updated successfully" ,imageUrl});
        } catch (error) {
          res.status(500).send("server error")
        }
      },
      listUnlistBrand:async (req,res) => {
        try {
          console.log("con")
          const brandId=req.params.id;
          const brand=await brandSchema.findById(brandId) 
          if(!brand){
            return res.status(404).json({message:"No such brand found",success:false})
          }
          brand.isListed=!brand.isListed
          await brand.save()

          return res.status(200).json({ success: true, newStatus:brand.isListed })

        } catch (error) {
          console.log(error)
          res.status(500).send("internal server error")
        }
      }


}

module.exports=brandController