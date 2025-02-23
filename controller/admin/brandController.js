const brandSchema=require("../../model/brandModel")


const brandController={

    loadBrandPage: async (req, res) => {
        try {
          const brands = await brandSchema.find({});
          console.log(brands);
          
          res.render("admin/brand", { brands: brands });
        } catch (error) {
          console.log(error);
        }
      },
      addBrands:async (req,res) => {
        try {
          console.log("start of add brands")
          const {name,description}=req.body
          console.log(name,description)
        } catch (error) {
          console.log(error )
          res.status(500).send("server error")
        }
      }


}

module.exports=brandController