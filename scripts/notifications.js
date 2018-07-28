/*** HELPER FUNCTIONS ***/
const obj2fd = (obj, form, namespace) => {
    let fd = form || new FormData();
    let formKey;

    for (let property in obj) {
        //if (obj.hasOwnProperty(property) && obj[property]) {
        if (obj.hasOwnProperty(property)) {
            if (namespace) {
                formKey = namespace + '[' + property + ']';
            } else {
                formKey = property;
            }

            if (obj[property]instanceof Date) {
                fd.append(formKey, obj[property].toISOString());
            } else if (typeof obj[property] === 'object' && !(obj[property]instanceof File)) {
                obj2fd(obj[property], fd, formKey)
            } else { // if it's a string or a File object
                fd.append(formKey, obj[property])
            }
        }
    }

    return fd;
}

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

function getPublicKey(keyUrl) {
    return fetch(keyUrl)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            return urlB64ToUint8Array(data.key);
        });
}
/*** END HELPER FUNCTIONS ***/


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

function subscribePush(registration, keyUrl) {
    return getPublicKey(keyUrl).then(function(key) {
        return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        });
    });
}

function updateSubscription(url , subscription) {
    console.log("FUNCTION: ", "updateSubscription", "\nURL: ", url, "\nSUBSCRIPTION: ", subscription);
	return fetch(url, {
        method: 'post',
        body: obj2fd(subscription.toJSON())
    });
}

function registerPush(subscribeUrl, keyurl) {
    return navigator.serviceWorker.ready
        .then(function(registration) {
            return registration.pushManager.getSubscription().then(function(subscription) {
                if (subscription) {
                    // renew subscription if we're within 5 days of expiration
                    if (subscription.expirationTime && Date.now() > subscription.expirationTime - 432000000) {
                        return unsubscribePush().then(function() {
                            return subscribePush(registration, keyurl);
                        });
                    }
                    return subscription;
                }
                return subscribePush(registration, keyurl);
            });
        })
        .then(function(subscription) {
            updateSubscription(subscribeUrl, subscription);
            return subscription;
        });
}

function sendMessage(url, sub, title, message, icon = null, clickUrl = null, delay = null) {
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
                icon: icon,
                url: clickUrl, clickUrl
            }
    }

    if (delay) {
        body.delay = delay;
    }

    return fetch(url, {
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

function unsubscribePush(unsubscribeUrl) {
    return getPushSubscription().then(function(subscription) {
        return subscription.unsubscribe().then(function() {
            updateSubscription(unsubscribeUrl, subscription);
        });
    });
}

var notify = function(elem, options = {}) {
    elem = document.getElementById(elem);
    options = Object.assign({},{
        url: './api/notify.php',
        subscribeUrl: './api/subscribe.php',
        unsubscribeUrl: './api/unsubscribe.php',
        keyUrl: "./api/key.php",
        title: 'Cool!',
        message: 'It works',
        icon: 'images/toast-image.jpg',
        clickUrl: "index.php?notificationClick=1",
        on: 'images/notifications_on.png',
        off: 'images/notifications_off.png',
        delay: null
    }, options);

    // check browser for serviceWorker & PushManager support
    if (!(navigator.serviceWorker && 'PushManager' in window)) {
        // service worker is not supported, so it won't work!
        console.log('SW & Push are Not Supported');
        elem.setAttribute('title', 'SW & Push are Not Supported');
        elem.style.opacity = 0.5;
        return;
    }

    // check and set initial state icon
    registerServiceWorker().then(function() {
        getPushSubscription().then(function(subscription) {
            if (subscription) {
                elem.setAttribute('src', options.on);
                elem.setAttribute('title', 'Click to deactivate');
            } else {
                elem.setAttribute('title', 'Click to activate');
            }
        });

        // add event listener for notification de-/activation click
        elem.addEventListener('click', function(event) {
            event.preventDefault();
            if (elem.getAttribute('src') == options.on) {
                unsubscribePush(options.unsubscribeUrl).then(function() {
                    elem.setAttribute('src', options.off);
                    elem.setAttribute('title', 'Click to activate');
                });
            } else {
                registerPush(options.subscribeUrl, options.keyUrl).then(function(sub) {
                    elem.setAttribute('src', options.on);
                    elem.setAttribute('title', 'Click to deactivate');
                    sendMessage(options.url, sub, options.title, options.message, options.icon, options.clickUrl, options.delay);
                });
            }
        });
    });
}
