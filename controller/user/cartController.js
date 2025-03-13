const cartSchema=require("../../model/cartModel")
const productSchema=require("../../model/productModel")
const userSchema=require("../../model/userModel")
const brandSchema=require("../../model/brandModel")

const cartController={

    addToCart:async (req,res) => {
        try {
            console.log("works for two..")
            const {productId,size}=req.body
            console.log(productId,"hi",size,"sizeee")

            const userId = req.session.user?.id; 

            if (!userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }

            const product = await productSchema.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            const variant = product.variants.find(v => v.size === size);
            if (!variant) {
                return res.status(400).json({ message: "Selected size is not available" });
            }

            let cart = await cartSchema.findOne({ userId });

            if (!cart) {
                cart = new cartSchema({ userId, items: [] });
            }

                //to check same itme with size exitsed
            const existingItem = cart.items.find(item => 
                item.productId.toString() === productId && item.size === size
            ); 



            if (existingItem) {
                //if adding another item exceeds available stock**
                if(existingItem.quantity > 5){
                    return res.status(400).json({message:"You can add upto 6 items"})
                }else{
                    if (existingItem.quantity + 1 > variant.quantity) {
                        return res.status(400).json({ message: "Not enough stock available" });
                    }
                }
                

                existingItem.quantity += 1;
            } else {
                // Ensure we do not add more than available stock**
                if (variant.quantity < 1) {
                    return res.status(400).json({ message: "Product is out of stock" });
                }

                // Add the new product with the selected size to cart
                cart.items.push({ productId, size, quantity: 1 });
            }

            await cart.save();

            return res.status(200).json({ success:true, message: "Product added to cart successfully" });

            
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Internal server error" });
        }
    },
    updateCartQuantity:async (req,res) => {
        try {
            console.log(req.body)
            const {productId,size,quantity}=req.body
            const userId=req.session.user?.id
            const user=await userSchema.findById(userId)
            if(!userId){
                return res.status(404).json({message:"User not authenticated.."})
            }
            
             if (!user) {
            return res.status(404).json({ message: "User not found..!" });
            }

            
            const product=await productSchema.findById(productId)
            if(!product || !product.isActive){
                return res.status(404).json({message:"Product currently not available"})
            }

            const variant = product.variants.find(v => v.size === size);
            if (!variant) {
            return res.status(400).json({ message: "Selected size is not available" });
            }


            const cart = await cartSchema.findOne({ userId });

            if(!cart){
                return res.status(400).json({message:"Cart not found..!"})
            }

            console.log(cart.items)

            console.log("Cart items: ", cart.items.map(itm => ({
                productId: itm.productId.toString(),
                size: itm.size,
                quantity: itm.quantity
            })));
            
            console.log("Looking for productId:", productId, "and size:", size);
            
            const item = cart.items.find(itm => 
                itm.productId.toString() === productId.toString() && itm.size === size
            );
            
            console.log("this is my itemss : ",item)
            console.log("here it ends.....")

            
            
            if (!item) {
                return res.status(400).json({ message: "Product not found in cart" });
            }

            if (quantity > variant.quantity) {
                return res.status(400).json({ message: `Only ${variant.quantity} items available in stock.` });
            }

            
            item.quantity = quantity;
            await cart.save();

            return res.status(200).json({ success: true, message: "Cart updated successfully", cart });
         } catch (error) {
            console.log(error)
        }
    },loadCartPage:async (req,res) => {
        try {
            const userId = req.session.user?.id// Assuming user is authenticated
            const user=await userSchema.findById(userId)

            
            // const cart = await cartSchema.findOne({ userId }).populate("items.productId");

            const cart = await cartSchema.findOne({ userId })
            .populate({
                path: "items.productId",
                populate: [
                    { path: "categoryId", model: "Category" }, // Populate category
                    { path: "brand", model: "Brand" } // Populate brand
                ]
            });

            
            if (!cart || cart.items.length === 0) {
                return res.render("user/usercart", { data: [], grandTotal: 0, actualTotal: 0, user, shippingCharge: 0 ,finalTotal:0 });
            }
            let actualTotal = 0;
            let grandTotal = 0;


            const cartData = cart.items.map(item => {
                const product = item.productId;
                const variant = product.variants?.find(v => v.size === item.size); 


                 if (!variant) {
                  console.warn(`No variant found for product ${product.name} with size ${item.size}`);
                return null; // Skip invalid entries
                }

                const regularPrice = variant.regularPrice;
                const offerPercentage = variant.offer || 0;
                // Calculate sale price after applying the product-specific offer
                const salePrice = regularPrice - (regularPrice * offerPercentage / 100);
                // Calculate discount on the product
                const discount = regularPrice - salePrice;


                // Calculate subtotal (price after product discount)               
                const subtotal = salePrice * item.quantity;
                grandTotal += subtotal;
                actualTotal += regularPrice * item.quantity;

                let additionalDiscount = 0;


                if (grandTotal > 2000) {
                    additionalDiscount = grandTotal * 0.10; // 10% discount for orders above ₹2000
                } else if (grandTotal > 1000) {
                    additionalDiscount = grandTotal * 0.05; // 5% discount for orders above ₹1000
                }


                const finalTotal = grandTotal - additionalDiscount;
                return {
                    productId: product._id,
                    productName: product.name,
                    productImage: product.images[0],
                    // category: product.categoryId, // Assuming category name is available via population
                    // category:product.categoryId ? product.categoryId.name : "Unknown Category", // Access category name
                    // brand: product.brand,
                    category: product.categoryId ? product.categoryId.name : "Unknown Category", // ✅ Category name
                    brand: product.brand ? product.brand.name : "Unknown Brand", // ✅ Brand name
                    size: item.size,
                    regularPrice,
                    salePrice,
                    discount,
                    quantity: item.quantity,
                    stock: variant.quantity,
                    subtotal,
                    grandTotal,
                    additionalDiscount,
                    finalTotal
                };
            }).filter(item => item !== null);

            let shippingCharge = grandTotal >= 1000 ? 0 : 50;
            let finalTotal = grandTotal + shippingCharge;
            console.log(actualTotal)
    
            console.log(cartData)
            res.render("user/usercart", { data: cartData, grandTotal,shippingCharge, finalTotal, actualTotal, user });
        } catch (error) {
            console.log(error)
        }
    },deleteItem:async (req,res) => {
        try {
            const productId=req.params.id
            console.log(productId)
            const userId=req.session.user?.id
console.log("here 1")
            if (!userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            console.log("here 2")
            let cart = await cartSchema.findOne({ userId });
            console.log("here 3")
            if (!cart) {
                return res.status(404).json({ message: "Cart not found" });
            }
            console.log("here 5")
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            console.log("here 6")
            if (itemIndex === -1) {
                return res.status(400).json({ message: "Product not found in cart" });
            }
            console.log("here 7")
            cart.items.splice(itemIndex, 1);
            console.log("here 8")
            await cart.save();
            console.log("here 9")
            return res.status(200).json({ message: "Product removed from cart successfully",success:true });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports=cartController