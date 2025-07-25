const { sql, poolPromise } = require("../config/db");

class Asset {
    static async getAllAssets(userId) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(`SELECT * FROM assets WHERE UserId = @UserId`);
        return result.recordset;
    }
    

    static async getAssetById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`SELECT * FROM assets WHERE AssetId = @id`);
        return result.recordset[0] || null;
    }

    static async createAsset({ UserId, Name, Amount, InterestRate, Note, Type }) {
        const pool = await poolPromise;
        await pool.request()
            .input("UserId", sql.Int, UserId)
            .input("Name", sql.NVarChar, Name)
            .input("Amount", sql.Decimal(18, 2), Amount)
            .input("InterestRate", sql.Decimal(5, 2), InterestRate ?? 0) // phòng trường hợp null
            .input("Note", sql.NVarChar, Note ?? '') // phòng trường hợp null
            .input("Type", sql.Int, Type ?? 0) // nếu có cột Type
            .input("CreatedAt", sql.DateTime, new Date())
            .input("UpdatedAt", sql.DateTime, new Date())
            .query(`
                INSERT INTO assets (UserId, Name, Amount, InterestRate, Note, Type, CreatedAt, UpdatedAt)
                VALUES (@UserId, @Name, @Amount, @InterestRate, @Note, @Type, @CreatedAt, @UpdatedAt)
            `);
    }

    static async updateAsset(id, { Name, Amount, InterestRate, Note, Type }) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input("id", sql.Int, id)
                .input("Name", sql.NVarChar(255), Name) // nên giới hạn NVARCHAR
                .input("Amount", sql.Decimal(18, 2), Amount ?? 0)
                .input("InterestRate", sql.Decimal(5, 2), InterestRate ?? 0)
                .input("Note", sql.NVarChar(sql.MAX), Note ?? '') // phòng trường hợp null
                .input("Type", sql.Int, Type ?? 0)
                .input("UpdatedAt", sql.DateTime, new Date())
                .query(`
                    UPDATE assets
                    SET 
                        Name = @Name,
                        Amount = @Amount,
                        InterestRate = @InterestRate,
                        Note = @Note,
                        Type = @Type,
                        UpdatedAt = @UpdatedAt
                    WHERE AssetId = @id
                `);
        } catch (err) {
            console.error('Error updateAsset:', err);
            throw err;
        }
    }
    

    static async deleteAsset(id) {
        const pool = await poolPromise;
        await pool.request().input("id", sql.Int, id).query(`DELETE FROM assets WHERE AssetId=@id`);
    }
    static async getTotalAsset(userId) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(
                `SELECT ISNULL(SUM(amount),0) AS total FROM assets WHERE UserId = @UserId`
            );
        return result.recordset[0].total;
    }

}
module.exports = Asset;
