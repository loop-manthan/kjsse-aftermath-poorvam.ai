import Notification from '../models/Notification.model.js';

export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId, limit = 20) => {
  try {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    return await Notification.findByIdAndDelete(notificationId);
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ userId, isRead: false });
  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};
