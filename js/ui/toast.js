import { NOTIFICATION_DISPLAY_DURATION, NOTIFICATION_FADE_DELAY } from '../config.js';

export function showNotification(message) {
    const notif = document.createElement('div');
    notif.className   = 'editor-notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), NOTIFICATION_FADE_DELAY);
    }, NOTIFICATION_DISPLAY_DURATION);
}
