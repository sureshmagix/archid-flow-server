// src/controllers/profile.controller.js
import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const { mobile } = req.params;
    if (!mobile) return res.status(400).json({ message: 'Mobile required' });

    const user = await User.findOne({ mobile }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { mobile, ...updateFields } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile required' });

    const allowed = ['name', 'email', 'gender', 'address', 'taluk', 'pincode', 'userType'];
    const $set = {};
    for (const key of allowed) if (key in updateFields) $set[key] = updateFields[key];

    const updatedUser = await User.findOneAndUpdate({ mobile }, { $set }, { new: true }).lean();
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ user: updatedUser });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
