<?php

//$subscription = json_decode($_POST['subscription'], true);

//print_r($subscription); //($_POST); //['subscription']['endpoint']));
//die();

require __DIR__ . '/../webpush/autoload.php';
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// delay?
if (isset($_POST['delay'])) {
    sleep ($_POST['delay']);
}

// gcm auth
$auth = [
    'GCM' => "",
    'VAPID' => [
        'subject' => 'mailto:<EMAIL_ADDRESS>',
        'privateKey' => "<PRIVKEY>",
        'publicKey' => "<PUBKEY>",
    ],
];

$webPush = new WebPush($auth);

//print_r($_POST);
//die();

$sub = Subscription::create($_POST['subscription']);
$payload = json_encode($_POST['payload']);

//print_r($sub);
//die();


$res = $webPush->sendNotification(
    $sub,
    $payload, // optional (defaults null)
    true // optional (defaults false)
);

if ($res == true) {
    print_r($_POST);
    die();
}

print_r($res);
die();
