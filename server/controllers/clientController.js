import Client from "../models/Clients.js";

// GET /api/clients — every client is shared across all accounts; `user`
// on the record is provenance ("who added this"), not an access filter.
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/clients/:id
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/clients
export const createClient = async (req, res) => {
  const { name, email, phone, company, address, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    const client = await Client.create({
      user: req.user._id,
      name,
      email,
      phone,
      company,
      address,
      notes,
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/clients/:id
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const fields = ["name", "email", "phone", "company", "address", "notes"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) client[f] = req.body[f];
    });

    const updated = await client.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/clients/:id
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
