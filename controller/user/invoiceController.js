const orderSchema=require("../../model/orderModel")
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");


const InvoiceController={
    downloadInvoice:async (req,res) => {
        try {
            const orderId=req.params.id 
            console.log(orderId)
        
       

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.log("mess")
        }

        const order = await orderSchema.findOne({ _id: new mongoose.Types.ObjectId(orderId) }).populate("items.productId").populate("address")

        if (!order) {
            console.log("error here")
        }

        const doc = new PDFDocument();
        const fileName = `invoice_${order.orderId}.pdf`;
        const filePath = path.join(__dirname, `../public/invoices/${fileName}`);

        if (!fs.existsSync(path.join(__dirname, "../public/invoices"))) {
            fs.mkdirSync(path.join(__dirname, "../public/invoices"), { recursive: true });
        }
        console.log(order.address)
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Invoice Header
        doc.fontSize(20).text("Stridex Invoice", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text(`Order ID: ${order.orderId}`);
        doc.text(`Customer ID: ${order.userId}`);
        doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Final Amount: ₹${order.total}`);
        doc.moveDown();
        doc.text("Shipping Address:", { underline: true });
        doc.text(`${order.address.place}, ${order.address.city}, ${order.address.state} - ${order.address.pinCode} , (${order.address.address})`);
        doc.moveDown();

        // Ordered Items
        doc.text("Ordered Products:", { underline: true });
        order.items.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.productId.name} (Size: ${item.size}) - ₹${item.productId.variants.find(v => v.size === item.size).regularPrice} x ${item.quantity}`);
        });

        doc.moveDown();
        doc.text(`Total: ₹${order.total}`, { bold: true });

        // End the document
        doc.end();

        writeStream.on("finish", () => {
            res.download(filePath, fileName);
        });


        } catch (error) {
           console.log(error) 
        }

    }
}

module.exports=InvoiceController