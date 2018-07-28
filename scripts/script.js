function registerServiceWorker() {
    return navigator.serviceWorker.register('service-worker.js');
}

function resetServiceWorkerAndPush() {
    return navigator.serviceWorker.getRegistration()
        .then(function(registration) {
            if (registration) {
                return registration.unregister();
            }
        })
        .then(function() {
            return registerServiceWorker().then(function(registration) {
                return registerPush();
            });
        });
}

function subscribePushAndUpdateButtons(registration) {
    return subscribePush(registration).then(function(subscription) {
        updateUnsubscribeButtons();
        return subscription;
    });
}

function registerPush() {
    return navigator.serviceWorker.ready
        .then(function(registration) {
            return registration.pushManager.getSubscription().then(function(subscription) {
                if (subscription) {
                    // renew subscription if we're within 5 days of expiration
                    if (subscription.expirationTime && Date.now() > subscription.expirationTime - 432000000) {
                        return unsubscribePush().then(function() {
                            updateUnsubscribeButtons();
                            return subscribePushAndUpdateButtons(registration);
                        });
                    }

                    return subscription;
                }

                return subscribePushAndUpdateButtons(registration);
            });
        })
        .then(function(subscription) {
            saveSubscription(subscription);
            return subscription;
        });
}

function sendMessage(sub, title, message, delay) {
    var key = sub.getKey('p256dh'),
        token = sub.getKey('auth'),
        contentEncoding = (PushManager.supportedContentEncodings || ['aesgcm'])[0];

    var body = {
            subscription: {
                endpoint: sub.endpoint,
                publicKey: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : null,
                authToken: token ? btoa(String.fromCharCode.apply(null, new Uint8Array(token))) : null,
                contentEncoding
            },
            payload: {
                title: title,
                message: message,
                url: "index.php?notificationClick=1"
            }
    }

    if (delay) {
        body.delay = delay;
    }

    return fetch('./api/notify.php', {
        method: 'post',
        body: obj2fd(body)
    });
}

function getPushSubscription() {
    return navigator.serviceWorker.ready
        .then(function(registration) {
            return registration.pushManager.getSubscription();
        });
}

function unsubscribePush() {
    return getPushSubscription().then(function(subscription) {
        return subscription.unsubscribe().then(function() {
            deleteSubscription(subscription);
        });
    });
}

function updateUnsubscribeButtons() {
    const unsubBtn2 = document.getElementById('unsubscribe-push-2');

    if (!(navigator.serviceWorker && 'PushManager' in window)) {
        // service worker is not supported, so it won't work!
        unsubBtn2.innerText = 'SW & Push are Not Supported';
        return;
    }

    const fn = function(event) {
        event.preventDefault();
        unsubscribePush().then(function() {
            updateUnsubscribeButtons();
        });
    };

    return getPushSubscription()
        .then(function(subscription) {
            if (subscription) {
                unsubBtn2.removeAttribute('disabled');
                unsubBtn2.innerText = 'Unsubscribe from push';
                unsubBtn2.addEventListener('click', fn);
            } else {
                unsubBtn2.setAttribute('disabled', 'disabled');
                unsubBtn2.innerText = 'Not subscribed';
                unsubBtn2.removeEventListener('click', fn);
            }
        });
}

document.addEventListener('DOMContentLoaded', function(event) {
    const pushBtn2 = document.getElementById('initiate-push-2');

    if (!(navigator.serviceWorker && 'PushManager' in window)) {
        // service worker is not supported, so it won't work!
        pushBtn2.innerText = 'SW & Push are Not Supported';
        return;
    }

    registerServiceWorker().then(function() {
        pushBtn2.removeAttribute('disabled');
        pushBtn2.innerText = 'Initiate push';
        pushBtn2.addEventListener('click', function(event) {
            event.preventDefault();
            registerPush().then(function(sub) {
                sendMessage(sub, 'Cool!', 'It works', DELAY);
            });
        });
        updateUnsubscribeButtons();
    });
});
