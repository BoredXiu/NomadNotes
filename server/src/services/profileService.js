import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] },
  });
  if (!user) {
    throw new AppError('用户不存在', 404);
  }
  return user;
}

async function updateProfile(userId, { username, bio, address, gender, avatarUrl }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  if (username && username !== user.username) {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      throw new AppError('用户名已被占用', 409);
    }
  }

  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (address !== undefined) updateData.address = address;
  if (gender !== undefined) updateData.gender = gender;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  await user.update(updateData);

  const { passwordHash, ...userData } = user.toJSON();
  return userData;
}

export { getProfile, updateProfile };