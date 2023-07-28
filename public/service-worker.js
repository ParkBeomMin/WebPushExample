// 웹 푸쉬 수신 시
self.addEventListener('push', (event) => {
    const text = event.data.text();
    event.waitUntil(
        self.registration.showNotification('웹 푸쉬!', {
            body: text,
            data: {
                url: 'https://github.io/ParkBeomMin/WebPushExample',
            },
        })
    );
});

// 푸쉬 알림 클릭 시
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});
