const { verify } = require("jsonwebtoken");
const userSchema=require("../../model/userModel")
const addressSchema=require("../../model/addressModel")


const userAddressController={
    loadAddAddressPage:async (req,res) => {
        try {
            const id=req.params.id
            console.log(id);
            res.render("user/useraddress")
        } catch (error) {
            console.log(error);
            
        }
    },verifyAddAddress:async (req,res) => {
        try {
            const id=req.session.user?.id
            console.log(req.body)
            console.log('idd is here'+id);
            const {name,mobile_number,country,state,district,city,place,pinCode,address,type}=req.body
            console.log(name," ",mobile_number," ",country," ",state," ",district," ",city," ",place," ",pinCode," ",address," ",type);

            const user=await userSchema.findById(id)

            if(!user){
                return res.status(404).json({message:"User no found"})
            }

            const newAddress=new addressSchema({
                userId:id,
                name,
                country,
                address,
                state,
                pinCode,
                district,
                mobile_number,
                place,
                city,
                type
            })


            await newAddress.save();
            return res.status(201).json({message:"Address added succesfully",success:true,redirectUrl:`/user/view-profile/${id}`})     
        } catch (error) {
            console.log(error)
        }
    },
    loadEditAddressPage:async (req,res) => {
        try {
            const id=req.params.id
            const userId=req.session.userId

            const address= await addressSchema.findById(id)


            res.render("user/editaddress",{address,userId})
        } catch (error) {
            console.log(error)
        }
    },
    verifyEditAddress:async (req,res) => {
        try {
            const id=req.session.user?.id
            const addressId=req.params.id
            if(!id){
                return res.status(401).json({message:"Session out,need to login again"})
            }

            const user=await userSchema.findById(id)

            if(!user){
                return res.status(401).json({message:"User not found"})
            }
            console.log(req.body)
            const {name,phoneNumber,addressType,pincode,city,state,landmark,address}=req.body

            // if(!fullName || !phoneNumber || !addressType || !pincode || !city || !landmark || !address)

            const updateAddress=await addressSchema.findOneAndUpdate(
                { _id: addressId, userId: id },
                {
                    name: name,
                    mobile_number: phoneNumber,
                    type: addressType,
                    pinCode: pincode,
                    city: city,
                    state: state,
                    district: landmark, // Assuming 'landmark' is the district in your schema
                    address: address
                },
                {new:true}
            );

            if (!updateAddress) {
                return res.status(404).json({ message: "Address not found or does not belong to the user" });
            }

            return res.status(200).json({ message: "Address updated successfully", address: updateAddress });

        } catch (error) {
            console.log(error)
        }
    },
    deleteUserAddress:async (req,res) => {
        try {
            console.log("works here...");
            
            const id=req.params.id
            if(!id){
                return res.status(400).json({message:"No address found"})
            }
            console.log("works until here 1");
            
            const address = await addressSchema.findByIdAndUpdate(
                id,
                { isDeleted: true }, // Mark as deleted
                { new: true }
            );
            console.log("works until here 2");
            if (!address) {
                return res.status(404).json({ message: "Address not found" });
            }
            console.log("works until here 3");

            res.status(200).json({ message: "Address deleted successfully", address,success:true });

        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=userAddressController