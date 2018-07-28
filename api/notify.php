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

$auth = [
    'GCM' => "AAAA7H1rE4g:APA91bEUrpqj9XHCke4j8vnclVWL-nVSx_qiCaJCKPt6-tu8F9zyhJhztRq1Q-w-PvhD_9saDx7A-FJ8bXAAYUdivb58YECrpzfjUT0svMRNPzrsdEZ3Iy7NEPS0__G3ttgukVGol7Ik",
    'VAPID' => [
        'subject' => 'mailto:andre.hoeg@gmail.com',
        'privateKey' => "3QUJQP9phGbphiTeLiCkt0OUXELkpFyOXurWbtGWUW0=",
        'publicKey' => "BOPswRthDusT8g51qmSwSd17gs7GOJMo3MNmUEgiV8fSv5sq0pwiuK6x55wW9YGhm4IT5WOKfoHleOqkZ6Ez7Ho=",
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
