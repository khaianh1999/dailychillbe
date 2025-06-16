// controllers/categoryController.js
const Category = require('../models/categoryModel');

class CategoryController {
    /**
     * Tạo một danh mục mới.
     * (POST /api/categories)
     */
    async createCategory(req, res) {
        try {
            const { name, type, updated_by } = req.body;
            
            const categoryData = {
                name,
                type,
                updated_by: updated_by ? parseInt(updated_by) : null
            };

            const newCategory = await Category.createCategory(categoryData);
            res.status(201).json({ message: 'Tạo danh mục thành công', data: newCategory });
        } catch (err) {
            console.error('Lỗi khi tạo danh mục:', err);
            res.status(500).json({ message: 'Lỗi khi tạo danh mục', error: err.message });
        }
    }

    /**
     * Lấy danh sách tất cả danh mục.
     * (GET /api/categories)
     */
    async getCategories(req, res) {
        try {
            const categories = await Category.getCategories();
            res.status(200).json({ message: 'Lấy danh sách danh mục thành công', data: categories });
        } catch (err) {
            console.error('Lỗi khi lấy danh sách danh mục:', err);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: err.message });
        }
    }

    /**
     * Lấy thông tin một danh mục bằng ID.
     * (GET /api/categories/:id)
     */
    async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await Category.getCategoryById(parseInt(id));
            if (!category) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục' });
            }
            res.status(200).json({ message: 'Lấy thông tin danh mục thành công', data: category });
        } catch (err) {
            console.error('Lỗi khi lấy danh mục bằng ID:', err);
            res.status(500).json({ message: 'Lỗi khi lấy danh mục bằng ID', error: err.message });
        }
    }

    /**
     * Cập nhật một danh mục.
     * (PUT /api/categories/:id)
     */
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, type, updated_by } = req.body;
            
            const categoryData = {
                name,
                type,
                updated_by: updated_by ? parseInt(updated_by) : null
            };
            
            const updatedCategory = await Category.updateCategory(parseInt(id), categoryData);
            if (!updatedCategory) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục để cập nhật' });
            }
            res.status(200).json({ message: 'Cập nhật danh mục thành công', data: updatedCategory });
        } catch (err) {
            console.error('Lỗi khi cập nhật danh mục:', err);
            res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: err.message });
        }
    }

    /**
     * Xóa mềm một danh mục.
     * (DELETE /api/categories/:id)
     */
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const success = await Category.deleteCategory(parseInt(id));
            if (!success) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục để xóa' });
            }
            res.status(200).json({ message: 'Xóa danh mục thành công' });
        } catch (err) {
            console.error('Lỗi khi xóa danh mục:', err);
            res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: err.message });
        }
    }
}

module.exports = new CategoryController();
