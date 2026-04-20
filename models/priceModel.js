const mysqlPool = require("../config/mysqlDb");

class Price {
    static async getAll() {
        const [rows] = await mysqlPool.execute("SELECT id, subscription_id, duration_days, original_price, discount_price FROM prices");
        return rows;
    }

    static async getBySubscriptionId(subscriptionId) {
        const [rows] = await mysqlPool.execute("SELECT id, subscription_id, duration_days, original_price, discount_price FROM prices WHERE subscription_id = ?", [subscriptionId]);
        return rows;
    }

    static async getById(id) {
        const [rows] = await mysqlPool.execute("SELECT id, subscription_id, duration_days, original_price, discount_price FROM prices WHERE id = ?", [id]);
        return rows[0];
    }

    static async create({ subscription_id, duration_days, original_price, discount_price }) {
        const [result] = await mysqlPool.execute(
            "INSERT INTO prices (subscription_id, duration_days, original_price, discount_price) VALUES (?, ?, ?, ?)",
            [subscription_id, duration_days, original_price, discount_price]
        );
        return { id: result.insertId, subscription_id, duration_days, original_price, discount_price };
    }

    static async update(id, { subscription_id, duration_days, original_price, discount_price }) {
        await mysqlPool.execute(
            "UPDATE prices SET subscription_id = ?, duration_days = ?, original_price = ?, discount_price = ? WHERE id = ?",
            [subscription_id, duration_days, original_price, discount_price, id]
        );
        return true;
    }
    
    static async delete(id) {
        await mysqlPool.execute("DELETE FROM prices WHERE id = ?", [id]);
        return true;
    }
}

module.exports = Price;
