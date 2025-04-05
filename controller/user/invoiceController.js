const orderSchema = require("../../model/orderModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const InvoiceController = {
  downloadInvoice: async (req, res) => {
    try {
      const orderId = req.params.id;
      console.log("Generating invoice for order:", orderId);
  
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid order ID format" });
      }
  
      const order = await orderSchema.findOne({ _id: new mongoose.Types.ObjectId(orderId) })
        .populate("items.productId")
        .populate("address")
        .populate("couponId");
  
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      const doc = new PDFDocument();
      const fileName = `invoice_${order.orderId}.pdf`;
      const filePath = path.join(__dirname, `../public/invoices/${fileName}`);
  
      if (!fs.existsSync(path.join(__dirname, "../public/invoices"))) {
        fs.mkdirSync(path.join(__dirname, "../public/invoices"), { recursive: true });
      }
  
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
  
      // =============================================
      // INVOICE HEADER
      // =============================================
      doc.fontSize(24).text("Stridex", { align: "center" });
      doc.fontSize(14).text("Invoice", { align: "center" });
      doc.moveDown();
  
      // =============================================
      // ORDER & CUSTOMER DETAILS
      // =============================================
      doc.fontSize(10);
      
      // Order details box
      const orderDetailsY = doc.y;
      doc.rect(50, orderDetailsY, 250, 100).stroke();
      doc.fontSize(12).text("Order Details", 60, orderDetailsY + 10, { bold: true });
      doc.fontSize(10);
      doc.text(`Order ID: ${order.orderId}`, 60, orderDetailsY + 30);
      doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, 60, orderDetailsY + 45);
      doc.text(`Status: ${order.status}`, 60, orderDetailsY + 60);
      doc.text(`Payment Method: ${order.paymentMethod}`, 60, orderDetailsY + 75);
      
      // Customer info box - expanded for more info
      doc.rect(310, orderDetailsY, 250, 170).stroke(); 
      doc.fontSize(12).text("Customer Information", 320, orderDetailsY + 10, { bold: true });
      doc.fontSize(10);
      doc.text(`Customer ID: ${order.userId}`, 320, orderDetailsY + 30);
      doc.text("Shipping Address:", 320, orderDetailsY + 45);
      doc.text(`${order.address.place}, ${order.address.city},`, 320, orderDetailsY + 60);
      doc.text(`${order.address.state} - ${order.address.pinCode}`, 320, orderDetailsY + 75);
      doc.text(`(${order.address.address})`, 320, orderDetailsY + 90);
      
      // Optional contact information
    //   doc.text(`Contact: ${order.address.mobile_number || 'N/A'}`, 320, orderDetailsY + 110);
      
      // Optional email if available
      if (order.address.email) {
        doc.text(`Email: ${order.address.email}`, 320, orderDetailsY + 125);
      }
      
      // Extra notes or placeholder
      doc.text(`Mobile number : - ${order.address.mobile_number || 'N/A'} `, 320, orderDetailsY + 140);
      
      // Move down to create space after the boxes
      doc.moveDown(10);
  
      // =============================================
      // PRODUCTS TABLE
      // =============================================
      doc.fontSize(12).text("Ordered Products", { underline: true });
      doc.moveDown();
      
      // Table headers
      const tableHeaders = ["#", "Product", "Size", "Price", "Qty", "Status", "Total"];
      const columnWidths = [30, 180, 50, 80, 40, 80, 80];
      
      // Draw table header with background
      let xPosition = 50;
      let currentY = doc.y;
      
      // Header background
      doc.rect(xPosition, currentY, 540, 20).fill("#f0f0f0").stroke();
      
      // Header text
      xPosition = 50;
      tableHeaders.forEach((header, i) => {
        doc.fontSize(10)
          .fillColor("#000000")
          .text(
            header, 
            xPosition + 5, 
            currentY + 5, 
            { width: columnWidths[i], align: "left" }
          );
        xPosition += columnWidths[i];
      });
      
      // Draw table rows
      currentY += 20;
      
      order.items.forEach((item, index) => {
        // Alternate row colors for better readability
        const rowColor = index % 2 === 0 ? "#ffffff" : "#f9f9f9";
        doc.rect(50, currentY, 540, 20).fill(rowColor).stroke();
        
        xPosition = 50;
        
        // Item number
        doc.fontSize(9)
          .fillColor("#000000")
          .text(
            (index + 1).toString(),
            xPosition + 5,
            currentY + 5,
            { width: columnWidths[0], align: "left" }
          );
        xPosition += columnWidths[0];
        
        // Product name
        doc.text(
          item.productId.name,
          xPosition + 5,
          currentY + 5,
          { width: columnWidths[1], align: "left" }
        );
        xPosition += columnWidths[1];
        
        // Size
        doc.text(
          item.size,
          xPosition + 5,
          currentY + 5,
          { width: columnWidths[2], align: "left" }
        );
        xPosition += columnWidths[2];
        
        // Price
        doc.text(
          `₹${item.itemSalePrice}`,
          xPosition + 5,
          currentY + 5,
          { width: columnWidths[3], align: "left" }
        );
        xPosition += columnWidths[3];
        
        // Quantity
        doc.text(
          item.quantity.toString(),
          xPosition + 5,
          currentY + 5,
          { width: columnWidths[4], align: "left" }
        );
        xPosition += columnWidths[4];
        
        // Status
        doc.text(
          item.itemStatus,
          xPosition + 5,
          currentY + 5,
          { width: columnWidths[5], align: "left" }
        );
        xPosition += columnWidths[5];
        
        // Total
        doc.text(
          `₹${(item.itemSalePrice * item.quantity).toFixed(2)}`,
          xPosition + 5,
          currentY + 5,
          { width: columnWidths[6], align: "left" }
        );
        
        currentY += 20;
      });
      
      // Add a line after the table
      doc.moveTo(50, currentY).lineTo(590, currentY).stroke();
      currentY += 20;
      
      // =============================================
      // SUMMARY SECTION
      // =============================================
      const summaryX = 400;
      
      // Summary heading
      doc.fontSize(12).text("Summary", summaryX, currentY, { underline: true });
      currentY += 15;
      
      // Subtotal
      doc.fontSize(10);
      doc.text("Subtotal:", summaryX, currentY);
      doc.text(`₹${calculateSubtotal(order.items).toFixed(2)}`, summaryX + 100, currentY, { align: "right" });
      currentY += 15;
      
      // Coupon discount if applicable
      if (order.couponId) {
        // Coupon details
        doc.text(`Coupon (${order.couponId.couponCode}):`, summaryX, currentY);
        
        // Format discount based on type
        let discountText = "";
        let discountAmount = 0;
        
        if (order.couponId.discountType === "percent") {
          discountText = `${order.couponId.discountValue}%`;
          discountAmount = (calculateSubtotal(order.items) * order.couponId.discountValue / 100).toFixed(2);
          doc.text(`-${discountText} (-₹${discountAmount})`, summaryX + 100, currentY, { align: "right" });
        } else {
          discountText = `₹${order.couponId.discountValue.toFixed(2)}`;
          doc.text(`-${discountText}`, summaryX + 100, currentY, { align: "right" });
        }
        
        currentY += 15;
      }
      
      // Shipping cost (if applicable)
      if (order.shippingCost) {
        doc.text("Shipping:", summaryX, currentY);
        doc.text(`₹${order.shippingCost.toFixed(2)}`, summaryX + 100, currentY, { align: "right" });
        currentY += 15;
      }
      
      // Taxes (if applicable)
      if (order.tax) {
        doc.text("Tax:", summaryX, currentY);
        doc.text(`₹${order.tax.toFixed(2)}`, summaryX + 100, currentY, { align: "right" });
        currentY += 15;
      }
      
      // Add a line before the total
      doc.moveTo(summaryX, currentY).lineTo(summaryX + 140, currentY).stroke();
      currentY += 10;
      
      // Final total
      doc.fontSize(12).text("Total:", summaryX, currentY, { bold: true });
      doc.fontSize(12).text(`₹${order.total.toFixed(2)}`, summaryX + 100, currentY, { bold: true, align: "right" });
      currentY += 20;
      
      // Payment information
      if (order.amountPaid !== undefined) {
        doc.fontSize(10);
        doc.text("Amount Paid:", summaryX, currentY);
        doc.text(`₹${order.amountPaid.toFixed(2)}`, summaryX + 100, currentY, { align: "right" });
        currentY += 15;
        
        if (order.amountPaid < order.total) {
          const balance = order.total - order.amountPaid;
          doc.text("Balance Due:", summaryX, currentY);
          doc.text(`₹${balance.toFixed(2)}`, summaryX + 100, currentY, { align: "right" });
        }
      }
      
      // =============================================
      // FOOTER
      // =============================================
      doc.fontSize(10).text(
        "Thank you for shopping with Stridex!",
        50,
        doc.page.height - 70,
        { align: "center" }
      );
      
      doc.fontSize(8).text(
        "This is a computer-generated invoice and does not require a signature.",
        50,
        doc.page.height - 50,
        { align: "center", color: "#666666" }
      );
      
      // End the document
      doc.end();
      
      writeStream.on("finish", () => {
        res.download(filePath, fileName);
      });
      
      writeStream.on("error", (error) => {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Error generating invoice" });
      });
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ message: "Error generating invoice", error: error.message });
    }
  }
};

// Helper function to calculate subtotal
function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    return total + (item.itemSalePrice * item.quantity);
  }, 0);
}

module.exports = InvoiceController;