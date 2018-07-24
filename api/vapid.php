<?php
require __DIR__ . '/../webpush/autoload.php';
use Minishlink\WebPush\VAPID;

var_dump(VAPID::createVapidKeys());
