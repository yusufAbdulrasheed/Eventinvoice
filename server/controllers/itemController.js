import Item from "../models/Item.js";

// GET /api/items — list all inventory items for the logged-in user
export const getItems = async (req, res) => {
  try {
    const items = await Item.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/items/:id
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/items
export const createItem = async (req, res) => {
  const { name, category, imageUrl, totalStock, availableStock, dailyRate, maintenanceFlag, notes } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: "Name and category are required" });
  }
  if (totalStock === undefined || totalStock < 0) {
    return res.status(400).json({ message: "Total stock must be 0 or greater" });
  }
  if (dailyRate === undefined || dailyRate < 0) {
    return res.status(400).json({ message: "Daily rate must be 0 or greater" });
  }

  try {
    const item = await Item.create({
      user: req.user._id,
      name,
      category,
      imageUrl,
      totalStock,
      // New items start fully available unless the caller says otherwise.
      availableStock: availableStock === undefined ? totalStock : availableStock,
      dailyRate,
      maintenanceFlag,
      notes,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/items/:id
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const fields = ["name", "category", "imageUrl", "totalStock", "availableStock", "dailyRate", "maintenanceFlag", "notes"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
