const Store = require("../models/store");

module.exports = async function validateStore(req, res, next) {
  const { storeId } = req.params;
  if (!storeId) {
    return res.status(400).json({ error: "storeId is required" });
  }
  try {
    const store = await Store.findOne({ slug: storeId, active: true });
    if (!store) {
      return res.status(404).json({ error: "Store not found or inactive" });
    }
    req.store = store;
    req.storeId = storeId;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
