const mysqlPool = require("../config/mysqlDb");

class Token {
    static async getAll() {
        const [rows] = await mysqlPool.execute("SELECT token_id, subscription_id, token, created_at, expired_at, status FROM tokens");
        return rows;
    }

    static async getBySubscriptionId(subscriptionId) {
        const [rows] = await mysqlPool.execute("SELECT token_id, subscription_id, token, created_at, expired_at, status FROM tokens WHERE subscription_id = ?", [subscriptionId]);
        return rows;
    }

    static async getByTokenId(tokenId) {
        const [rows] = await mysqlPool.execute("SELECT token_id, subscription_id, token, created_at, expired_at, status FROM tokens WHERE token_id = ?", [tokenId]);
        return rows[0];
    }

    static async getByTokenString(tokenString) {
        const [rows] = await mysqlPool.execute("SELECT token_id, subscription_id, token, created_at, expired_at, status FROM tokens WHERE token = ?", [tokenString]);
        return rows[0];
    }

    static async create({ subscription_id, token, expired_at, status = 1 }) {
        const [result] = await mysqlPool.execute(
            "INSERT INTO tokens (subscription_id, token, expired_at, status) VALUES (?, ?, ?, ?)",
            [subscription_id, token, expired_at, status]
        );
        return { token_id: result.insertId, subscription_id, token, expired_at, status };
    }

    static async updateStatus(tokenId, status) {
        await mysqlPool.execute("UPDATE tokens SET status = ? WHERE token_id = ?", [status, tokenId]);
        return true;
    }

    static async delete(tokenId) {
        await mysqlPool.execute("DELETE FROM tokens WHERE token_id = ?", [tokenId]);
        return true;
    }
}

module.exports = Token;
