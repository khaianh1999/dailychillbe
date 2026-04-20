const mysqlPool = require("../config/mysqlDb");

class Subscription {
    static async getAll() {
        const [rows] = await mysqlPool.execute("SELECT id, name FROM subscriptions");
        return rows;
    }

    static async getById(id) {
        const [rows] = await mysqlPool.execute("SELECT id, name FROM subscriptions WHERE id = ?", [id]);
        return rows[0];
    }

    static async create(name) {
        const [result] = await mysqlPool.execute("INSERT INTO subscriptions (name) VALUES (?)", [name]);
        return { id: result.insertId, name };
    }

    static async update(id, name) {
        await mysqlPool.execute("UPDATE subscriptions SET name = ? WHERE id = ?", [name, id]);
        return true;
    }

    static async delete(id) {
        await mysqlPool.execute("DELETE FROM subscriptions WHERE id = ?", [id]);
        return true;
    }
}

module.exports = Subscription;
