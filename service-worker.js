'use strict';
/*
importScripts('./scripts/toFormData.js');
importScripts('./scripts/util.js');
*/

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
    const data = JSON.parse(event.data.text());
    console.log(data);
    event.waitUntil(
        registration.showNotification(data.title, {
            body: data.message,
            data: data.url,
            icon: data.icon
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                if (clientList.length > 0) {
                    let client = clientList[0];

                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i].focused) {
                            client = clientList[i];
                        }
                    }
                    console.log("FOCUS CLIENT: ", client);
                    return client.focus();
                }
                console.log(clients);
                return clients.openWindow(event.notification.data);
            })
    );
});
/*
self.addEventListener('pushsubscriptionchange', function(event) {
    event.waitUntil(
        Promise.all([
            Promise.resolve(event.oldSubscription ? deleteSubscription(event.oldSubscription) : true),
            Promise.resolve(event.newSubscription ? event.newSubscription : subscribePush(registration))
                .then(function(sub) { return saveSubscription(sub); })
        ])
    );
});
*/
