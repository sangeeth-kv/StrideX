const { find } = require("../../model/adminModel");
const userSchema = require("../../model/userModel");

const userController = {
  loadUserPage: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = 5;
      let skip = (page - 1) * limit;
      const searchQuery = req.query.search ? req.query.search.trim() : "";
      console.log(searchQuery);

      let filter = {};
      if (searchQuery) {
        filter.fullname = { $regex: new RegExp(searchQuery, "i") };
      }

      const totalCategories = await userSchema.countDocuments(filter);
      const totalPages = Math.ceil(totalCategories / limit);
      const users = await userSchema
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      console.log(users);

      res.render("admin/usermanagement", {
        users,
        currentPage: page,
        totalPages,
        search: searchQuery,
      });
    } catch (error) {
      res.status(500).send("server error");
    }
  },
  UserStatus: async (req, res) => {
    try {
      const id = req.params.id;
      console.log(id);
      const user = await userSchema.findById(id);
      if (!user) {
        return res.status({ message: "No user found", success: false });
      }
      user.isActive = !user.isActive;
      await user.save();
      res.status(200).json({ success: true, message: "User status updated" });
    } catch (error) {
      console.log(error);
      res.status(500).send("server error");
    }
  },
};

module.exports = userController;
