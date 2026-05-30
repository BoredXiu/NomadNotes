import * as profileService from '../services/profileService.js';

async function getProfile(req, res, next) {
  try {
    const user = await profileService.getProfile(req.userId);
    res.json({
      success: true,
      data: user,
      message: 'success',
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await profileService.updateProfile(req.userId, req.body);
    res.json({
      success: true,
      data: user,
      message: '个人资料已更新',
    });
  } catch (error) {
    next(error);
  }
}

export { getProfile, updateProfile };