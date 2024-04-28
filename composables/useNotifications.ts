export const useNotifications = () => {
  const requestPermission = () => {
    return Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission)
    })
  }

  const sendNotification = (title: string, options: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return
    }
    options = {
      ...options,
      icon: '/mostro-notification.png',
      vibrate: [100, 200, 100, 200, 100]
    }
    if (Notification.permission === 'granted') {
      new Notification(title, options)
    } else if (Notification.permission !== 'denied') {
      requestPermission().then(() => {
        if (Notification.permission === 'granted') {
          new Notification(title, options)
        }
      })
    } else {
      console.log('Notification permission denied')
    }
  }

  return { requestPermission, sendNotification }
}
