# Ubuntu Graphical Service Manager (U.G.S.M.) v1.0.6
Ubuntu Graphical Service Manager is an electron app
that helps me manage my active services in Ubuntu 17.04 and 16.04
Simple and clear code

This code was part of a private repo of mine

How to run:
* Clone the repo
* Install dependencies

**In order for this app to work make sure that `electon` is installed using globally by using `npm install -g electron`**

<code>git clone https://github.com/kounelios13/UGSM.git && cd UGSM && npm install</code>

To start `UGSM`:
* cd into UGSM directory
* open a terminal and type `npm start`

# Generate a deb file
You can generate a deb file by running `npm run make`
You will find the generated file in the `out` directory that lies in the root of the project folder



**See `UGSM` documentation [here](src/docs/documentation.md)**

# Generate code documentation 
Code documentation(not to be confused with `UGSM` documentation) can be generated using the following command :

`npm run documentation`

This will create a folder called `jsdoc` in the root of the project.Navigate there and open the `index.html`