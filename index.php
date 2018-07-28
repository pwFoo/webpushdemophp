<!doctype html>
<html lang="en-us">
	<head>
		<meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="manifest" href="manifest.json">
		<title>Web Push Notifications Demo</title>
	</head>
	<body>
		<h1>Web Noticiation Demo</h1>
		<h2>Tested with Chrome, Edge, Opera, Firefox (all Win10) and Chrome for Android</h2>
		<p>Send subscription and notification (optional get browser permission & subscribe to browser dependent service) via php backend to local browser.</p>

		<h2>De-/Activate Notifications</h2>
		<div><input type="image" id="notifyToggle" src="images/notifications_off.png"></input></div>

        <h2>"Add to homescreen" support</h2>
        <p>Demo supports full screen mode if added to homescreen as app shortcut in Chrome for Android</p>
		<?php if (isset($_GET['notificationClick']) && $_GET['notificationClick'] == 1) { ?>

		<h2>Info about NotificationClick Event</h2>
		<p>Notification was clicked and a window opened!<br />
		<a href="<?=$_SERVER['PHP_SELF']?>">Delete notificationClick info</a></p>
		<?php } ?>
		<script src="scripts/notifications.js"></script>
		<script>
			var options = {
			}

			notify('notifyToggle', options);
		</script>
	</body>
</html>
