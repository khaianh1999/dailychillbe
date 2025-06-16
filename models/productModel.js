const { sql, poolPromise } = require("../config/db");

class Product {
    static async getAllProducts() {
        try {
            const pool = await poolPromise;
            const query = `
                SELECT 
                    p.id, p.name, p.type, p.description, p.quantity, p.price, p.price_old, 
                    p.deleted, p.update_by, p.created_at, p.updated_at, 
                    pi.image_url
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                WHERE p.deleted = 0
            `;
            const result = await pool.request().query(query);
            
            // Nhóm ảnh theo product_id
            const productsMap = new Map();
    
            result.recordset.forEach(row => {
                if (!productsMap.has(row.id)) {
                    productsMap.set(row.id, {
                        id: row.id,
                        name: row.name,
                        type: row.type,
                        description: row.description,
                        quantity: row.quantity,
                        price: row.price,
                        price_old: row.price_old,
                        deleted: row.deleted,
                        update_by: row.update_by,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        image_urls: [] // Mảng chứa tất cả ảnh của sản phẩm
                    });
                }
                if (row.image_url) {
                    productsMap.get(row.id).image_urls.push(row.image_url);
                }
            });
    
            return Array.from(productsMap.values());
        } catch (err) {
            throw err;
        }
    }
    
    

    static async getProductById(id) {
        try {
            const pool = await poolPromise;
            const query = `
                SELECT 
                    p.id, p.name, p.type, p.description, p.quantity, p.price, p.price_old, 
                    p.deleted, p.update_by, p.created_at, p.updated_at, 
                    pi.image_url
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                WHERE p.id = @id AND p.deleted = 0
            `;
    
            const result = await pool.request().input("id", sql.Int, id).query(query);
            
            if (result.recordset.length === 0) {
                return null; // Không tìm thấy sản phẩm
            }
    
            // Tạo object product từ recordset
            const product = {
                id: result.recordset[0].id,
                name: result.recordset[0].name,
                type: result.recordset[0].type,
                description: result.recordset[0].description,
                quantity: result.recordset[0].quantity,
                price: result.recordset[0].price,
                price_old: result.recordset[0].price_old,
                deleted: result.recordset[0].deleted,
                update_by: result.recordset[0].update_by,
                created_at: result.recordset[0].created_at,
                updated_at: result.recordset[0].updated_at,
                image_urls: [] // Mảng chứa ảnh của sản phẩm
            };
    
            // Thêm tất cả image_url vào mảng
            result.recordset.forEach(row => {
                if (row.image_url) {
                    product.image_urls.push(row.image_url);
                }
            });
    
            return product;
        } catch (err) {
            throw err;
        }
    }
    

    static async createProduct({ name, type, description, quantity, price, price_old, update_by }) {
        try {
            const pool = await poolPromise;
            await pool
                .request()
                .input("name", sql.NVarChar, name)
                .input("type", sql.Int, type)
                .input("description", sql.NVarChar, description)
                .input("quantity", sql.Int, quantity)
                .input("price", sql.Decimal(10, 2), price)
                .input("price_old", sql.Decimal(10, 2), price_old)
                .input("update_by", sql.Int, update_by)
                .input("created_at", sql.DateTime, new Date())
                .input("updated_at", sql.DateTime, new Date())
                .query(`
                    INSERT INTO products (name, type, description, quantity, price, price_old, update_by, created_at, updated_at) 
                    VALUES (@name, @type, @description, @quantity, @price, @price_old, @update_by, @created_at, @updated_at)
                `);
        } catch (err) {
            throw err;
        }
    }

    static async updateProduct(id, { name, type, description, quantity, price, price_old, update_by }) {
        try {
            const pool = await poolPromise;
            await pool
                .request()
                .input("id", sql.Int, id)
                .input("name", sql.NVarChar, name)
                .input("type", sql.Int, type)
                .input("description", sql.NVarChar, description)
                .input("quantity", sql.Int, quantity)
                .input("price", sql.Decimal(10, 2), price)
                .input("price_old", sql.Decimal(10, 2), price_old)
                .input("update_by", sql.Int, update_by)
                .input("updated_at", sql.DateTime, new Date())
                .query(`
                    UPDATE products 
                    SET name = @name, type = @type, description = @description, quantity = @quantity, 
                        price = @price, price_old = @price_old, update_by = @update_by, updated_at = @updated_at 
                    WHERE id = @id
                `);
        } catch (err) {
            throw err;
        }
    }
        
    static async deleteProduct(id) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input("id", sql.Int, id)
                .query("UPDATE products SET deleted = 1 WHERE id = @id");
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Product;
