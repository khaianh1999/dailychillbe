const Product = require("../models/productModel");

const productController = {
    async getAllProducts(req, res) {
        try {
            const products = await Product.getAllProducts();
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm", error });
        }
    },

    async getProductById(req, res) {
        try {
            const product = await Product.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm", error });
        }
    },

    async createProduct(req, res) {
        try {
            const newProduct = await Product.createProduct(req.body);
            res.status(201).json({ message: "Sản phẩm đã được tạo", newProduct });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi tạo sản phẩm", error });
        }
    },

    async updateProduct(req, res) {
        try {
            const updatedProduct = await Product.updateProduct(req.params.id, req.body);
            res.json({ message: "Sản phẩm đã được cập nhật", updatedProduct });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm", error });
        }
    },

    async deleteProduct(req, res) {
        try {
            await Product.deleteProduct(req.params.id);
            res.json({ message: "Sản phẩm đã được xóa" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error });
        }
    }
};

module.exports = productController;
