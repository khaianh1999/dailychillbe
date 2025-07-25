const Asset = require("../models/assetModel");

const assetController = {
    async getAll(req, res) {
        try {
            // Lấy userId từ query string
            const userId = req.query.userId;
            if (!userId) {
                return res.status(400).json({ message: "Thiếu userId" });
            }
            res.json(await Asset.getAllAssets(userId));
        } catch (e) { res.status(500).json(e); }
    },
    async getById(req, res) { try { const x = await Asset.getAssetById(req.params.id); if (!x) return res.status(404).json({ message: "Not found" }); res.json(x); } catch (e) { res.status(500).json(e); } },
    async create(req, res) { try { await Asset.createAsset(req.body); res.status(201).json({ message: "Tạo thành công" }); } catch (e) { res.status(500).json(e); } },
    async update(req, res) { try { await Asset.updateAsset(req.params.id, req.body); res.json({ message: "Cập nhật thành công" }); } catch (e) { res.status(500).json(e); } },
    async remove(req, res) { try { await Asset.deleteAsset(req.params.id); res.json({ message: "Xóa thành công" }); } catch (e) { res.status(500).json(e); } },
    async getSummary(req, res) {
        console.log("getSummary");
        try {
            // Lấy userId từ query string
            const userId = req.query.userId;
            if (!userId) {
                return res.status(400).json({ message: "Thiếu userId" });
            }

            const total = await Asset.getTotalAsset(userId);

            res.json({
                total_asset: total,
                growth_percent: 10.5 // ví dụ, bạn có thể tính theo logic của bạn
            });
        } catch (err) {
            console.error("Lỗi getSummary:", err);
            res.status(500).json({ message: "Lỗi server khi lấy summary" });
        }
    }
};
module.exports = assetController;
