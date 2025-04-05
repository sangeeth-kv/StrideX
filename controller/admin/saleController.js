const orderSchema=require("../../model/orderModel")
const couponController=require("../../model/coupenModel")
const moment = require("moment");
const PDFDocument = require("pdfkit"); // For PDF generation
const ExcelJS = require("exceljs");
const saleController={

    
    loadSaleReport: async (req, res) => {
      try {
        let { day, startDate, endDate } = req.query;
        day = day || "salesToday";
        let page = parseInt(req.query.page) || 1;
        let limit = 5;
        let skip = (page - 1) * limit;
    
        let filter = {};
    
        // Date-based filtering
        const today = moment().startOf("day");
        switch (day) {
          case "salesToday":
            filter.orderDate = { $gte: today.toDate(), $lte: moment(today).endOf("day").toDate() };
            break;
          case "salesWeekly":
            filter.orderDate = { $gte: moment().subtract(7, "days").toDate() };
            break;
          case "salesMonthly":
            filter.orderDate = { $gte: moment().subtract(1, "months").toDate() };
            break;
          case "salesYearly":
            filter.orderDate = { $gte: moment().subtract(1, "years").toDate() };
            break;
        }
    
        if (startDate && endDate) {
          filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
    
        // Get matching orders
        const orders = await orderSchema
          .find(filter)
          .populate("userId", "fullname")
          .populate("items.productId", "name")
          .lean();
    
        // Extract and filter only 'delivered' items
        let deliveredItems = [];
    
        for (let order of orders) {
          const user = order.userId;
          const orderId = order.orderId;
          const paymentMethod = order.paymentMethod;
          const orderDate = order.orderDate;
    
          for (let item of order.items) {
            if (item.itemStatus === "delivered") {
              deliveredItems.push({
                orderId,
                user: user.fullname,
                paymentMethod,
                orderDate,
                product: item.productId?.name || "Product Deleted",
                size: item.size,
                quantity: item.quantity,
                itemSalePrice: item.itemSalePrice,
                totalSale: item.itemSalePrice * item.quantity,
              });
            }
          }
        }
    
        // Pagination
        const totalItems = deliveredItems.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedItems = deliveredItems.slice(skip, skip + limit);
    
        // Totals
        const overallSaleAmount = deliveredItems.reduce((sum, item) => sum + item.totalSale, 0);

        console.log("paginanted items :",paginatedItems)
        console.log("delivered items : ",deliveredItems)
    
        res.render("admin/salesreport", {
          data: paginatedItems,
          overallSalesCount: deliveredItems.length,
          overallOrderAmount: overallSaleAmount,
          totalOrders: totalItems,
          totalPaid: overallSaleAmount,
          currentPage: page,
          totalPages,
          startDate: startDate || "",
          endDate: endDate || "",
          selectedDay: day || "",
        });
    
      } catch (err) {
        console.error("Error in loadSaleReport:", err);
        res.status(500).send("Server Error");
      }
    },
    
    generatePDF:async (req,res) => {
        try {
            const salesData = req.body;
            console.log("sales data in the generate pdf ccontroler : ",salesData)
        const doc = new PDFDocument();
        res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);
        doc.fontSize(16).text("Sales Report", { align: "center" }).moveDown();

        salesData.forEach((sale) => {
            doc.fontSize(12).text(`Order ID: ${sale.orderId}`);
            doc.text(`Customer: ${sale.name}`);
            doc.text(`Date: ${sale.date}`);
            doc.text(`Total Amount: ${sale.totalAmount}`);
            doc.text(`Payment Method : ${sale.paymentMethod}`)
            doc.moveDown();
        });

        doc.fontSize(14).text(`Grand Total: ${salesData.reduce((sum, sale) => sum + sale.totalAmount, 0)}`, { align: "right" });
        doc.end();
        } catch (error) {
            console.log(error)
        }
    },generateExecl:async (req,res) => {
        try {
            const salesData = req.body;
            console.log("sale data of req body : ",req.body)
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        worksheet.columns = [
            { header: "Order ID", key: "orderId", width: 20 },
            { header: "Customer Name", key: "name", width: 20 },
            { header: "Date", key: "date", width: 15 },
            { header: "Total Amount", key: "totalAmount", width: 15 },
            { header: "Payment Method", key: "paymentMethod", width: 15 },
        ];

        salesData.forEach((sale) => {
            worksheet.addRow(sale);
        });

        worksheet.addRow(["Grand Total", "", "", salesData.reduce((sum, sale) => sum + sale.totalAmount, 0), ""]);

        res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        await workbook.xlsx.write(res);
        res.end();
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=saleController