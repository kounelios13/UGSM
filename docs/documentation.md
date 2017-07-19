UGSM 
=====
#How does UGSM works?
Under the hood UGSM is a wrapper for 4 shell comands
1. `service status--all`
2. `service foo start`
3. `service foo stop`
4. `service foo restart` 

It's dead simple.

1st command is used to gather all system services(active and inactive)

2nd command starts `foo` service

3rd command stops `foo` service

4th command restarts `foo` service

Now at first `UGSM` user interface might look ugly but don't worry.There are 2 solutions:

1.Change UI Settings

From the menu go to `Preferences` and choose `UI settings`
.There you can change the background color or image of `UGSM`.You can also change `UGSM` font and set a different font size for the table which displays system services.Then press `Apply Settings`

2.Add a theme

A theme is a simple css file that can be added to `UGSM`.
To add a theme you can do the following:

* Go to `Preferences > Select Theme`
* Press `Add new theme` and find the theme you want

To write a theme you can open the `Developer Tools` and use the `Element Inspector`
to see the elements of the page you want to style




