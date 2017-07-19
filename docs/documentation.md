UGSM 
=====
# How does UGSM works?
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

Last 3 commands require `root(sudo) access`.That's why you will be prompted  for your root password if you start `UGSM` using `npm start`.If you start `UGSM` without `root` it won't work

# Now at first `UGSM` user interface might look ugly but don't worry.There are 2 solutions:

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

#### Assuming you have added some themes

If you have added some themes before they will show up in a select box.From there choose the one you want and then press `Apply theme`

# Notes 

## localStorage
All user preferences (ui settings,and user theme file paths) are saved into
`localStorage`

To find out more about `localStorage` and its limitations click [here](https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage)

## UGSM themes

`UGSM` themes are just simple css files.When you add a new theme you don't add their content to `UGSM`.What you do is to tell to the program to store a reference to the path of the css file.That's why If you delete the original css file you lose your theme.




