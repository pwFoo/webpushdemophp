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
		<p>Service Workers are NOT supported with Safari / IOS Safari at the moment!</p>

		<h2>Closed browser support</h2>
		<p>With delay configured (demo delay is 5 seconds) you have enough time to close the browser / tab after you activated the notifications. You should receive desktop / Android notifications pushed.
		Click the notification opens the demo again.</p>

		<h2>De-/Activate Notifications</h2>
		<p>Toggle notifications by clicking the bell icon. A test notification is send on each activation click (with a configured delay of 5 seconds on server side).
		Open the developer tools (network, console, application) for debugging un-/subscribe.</p>
		<div><input type="image" id="notifyToggle" src="images/notifications_off.png"></input></div>

        <h2>"Add to homescreen" support</h2>
        <p>Demo supports full screen mode if added to homescreen as app shortcut in Chrome for Android</p>

		<h2>ToDo</h2>
		<ul>
			<li>Add working indicator during de-/activate</li>
			<li>Rewrite and clean up code to build a standalone notification library</li>
			<li>Source code formatting and comments</li>
		</ul>

		<script src="scripts/notifications.js"></script>
		<script>
			var options = {
				"delay": 5,
			}

			notify('notifyToggle', options);
		</script>
	</body>
</html>
