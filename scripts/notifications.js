/*** HELPER FUNCTIONS ***/
const obj2fd = (obj, form, namespace) => {
    let fd = form || new FormData();
    let formKey;

    for (let property in obj) {
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


/*** ServiceWorker de-/registration ***/
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
/*** END ServiceWorker de-/registration ***/


/*** Push Subscription handling ***/
function subscribePush(registration, keyUrl) {
    // get public key from backend server
    return getPublicKey(keyUrl).then(function(key) {
            // subscribe to notification service
            return registration.pushManager.subscribe({
                userVisibleOnly: true,      // needed!
                applicationServerKey: key   // backend server validation by pubkey
            });
    });
}

function getPushSubscription() {
    // wait until ServiceWorker is ready
    return navigator.serviceWorker.ready
        .then(function(registration) {
            // Get current subscription state
            return registration.pushManager.getSubscription();
        });
}

function updateSubscription(url , subscription) {
    console.log("FUNCTION: ", "updateSubscription", "\nURL: ", url, "\nSUBSCRIPTION: ", subscription);
    // body (getPushSubscription object) converted to JSON and FormData object to populate PHP $_POST with fetch()
    return fetch(url, {
        method: 'post',
        body: obj2fd(subscription.toJSON())
    });
}

function registerPush(subscribeUrl, keyurl) {
    // wait until ServiceWorker is ready
    return navigator.serviceWorker.ready
        .then(function(registration) {
            // get current subscription state
            return registration.pushManager.getSubscription()
            .then(function(subscription) {
                // verify subscription
                if (subscription) {
                    if (subscription.expirationTime && Date.now() > subscription.expirationTime - 432000000) {
                        // renew subscription if we're within 5 days of expiration
                        return unsubscribePush().then(function() {
                            // return renewed subscription
                            return subscribePush(registration, keyurl);
                        });
                    }
                    // return existing subscription
                    return subscription;
                }
                // get a new subscription
                return subscribePush(registration, keyurl);
            });
        })
        .then(function(subscription) {
            // send update to backend server to update database
            updateSubscription(subscribeUrl, subscription);
            // return subscription
            return subscription;
        });
}

function unsubscribePush(unsubscribeUrl) {
    // get current subscription
    return getPushSubscription().then(function(subscription) {
        // unsubscribe from subscription
        return subscription.unsubscribe().then(function() {
            // send update to backend server to update database
            updateSubscription(unsubscribeUrl, subscription);
        });
    });
}
/*** END Push Subscription handling ***/


/*** Test notification send ***/
function sendMessage(url, sub, title, message, icon = null, clickUrl = null, delay = null) {
    var publicKey = sub.getKey('p256dh'),
        authToken = sub.getKey('auth'),
        contentEncoding = (PushManager.supportedContentEncodings || ['aesgcm'])[0];
    // notifiation
    var body = {
            // prepared subscription array
            subscription: {
                endpoint: sub.endpoint,
                publicKey: publicKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(publicKey))) : null,
                authToken: authToken ? btoa(String.fromCharCode.apply(null, new Uint8Array(authToken))) : null,
                contentEncoding
            },
            // payload array with data
            payload: {
                title: title,
                message: message,
                icon: icon,
                url: clickUrl, clickUrl
            }
    }
    // optional debugging / testing notifiation delay (done server side)
    if (delay) {
        body.delay = delay;
    }
    // body converted to FormData object to populate $_POST with fetch()
    return fetch(url, {
        method: 'post',
        body: obj2fd(body)
    });
}
/*** END Test notification send ***/


/*** Initialize notification handling ***/
var notify = function(elem, options = {}) {
    elem = document.getElementById(elem);
    // default options and merge with param options
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
    // register ServiceWorker
    registerServiceWorker().then(function() {
        // get subscription state
        getPushSubscription().then(function(subscription) {
            //check and set initial state icon
            if (subscription) {
                elem.setAttribute('src', options.on);
                elem.setAttribute('title', 'Click to deactivate');
            } else {
                elem.setAttribute('title', 'Click to activate');
            }
        });

        // add click event listener for notification de-/activation
        elem.addEventListener('click', function(event) {
            event.preventDefault();
            if (elem.getAttribute('src') == options.on) {
                // unsubscribe push
                unsubscribePush(options.unsubscribeUrl).then(function() {
                    elem.setAttribute('src', options.off);
                    elem.setAttribute('title', 'Click to activate');
                });
            } else {
                // subscribe push
                registerPush(options.subscribeUrl, options.keyUrl).then(function(sub) {
                    elem.setAttribute('src', options.on);
                    elem.setAttribute('title', 'Click to deactivate');
                    sendMessage(options.url, sub, options.title, options.message, options.icon, options.clickUrl, options.delay);
                });
            }
        });
    });
}
/*** END Initialize notification handling ***/
