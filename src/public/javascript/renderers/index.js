/**
 *@file This file is the main renderer used by the index view page
 */
const {
    success,
    error,
    info,
    confirm
} = require('../javascript/custom_modules/utils.js');
const jcache = require('../javascript/custom_modules/jquery-cache.js')($);
const {
    ipcRenderer
} = require('electron');
const lockr = require('lockr');
const {
    Search
} = require('../javascript/classes/search.js');
const EventEmmiter = require('events');
const ServiceManagerBuilder = require('../javascript/classes/service-manager.js');
const IllegalArgumentError = require('../javascript/classes/illegalArgumentError.js');
const ThemeManagerBuilder = require('../javascript/classes/theme-manager.js');
const themeManager = new ThemeManagerBuilder(lockr.get('theme-manager-files'));
const serviceEmmiter = new EventEmmiter();
const serviceManager = new ServiceManagerBuilder(serviceEmmiter);
let services = [];
const serviceSearch = new Search();

/**
 *@memberof! index
 *Utility function that will help us create the 3 types of links we need for our service list(Start, Stop,Restart) 
 *@param {String} type Type of link to create(start,stop,restart)
 *@param {String} name name of service (.e.g apache2 ,mysql etc.)
 *@returns {String} serviceLink the link we created
 */
const createServiceLink = (type, name) => {
    const allowedTypes = ['start', 'stop', 'restart'];
    if (allowedTypes.indexOf(type) == -1) {
        throw new IllegalArgumentError('Service link type must be one of the following:start,stop,restart');
    }
    const serviceLink = document.createElement('a');
    serviceLink.href = `javascript:${type}Service('${name}')`; //e.g. type start -> javascript:startService()
    serviceLink.innerText = `${type[0].toUpperCase()+type.slice(1)} Service` //Return first char of string capitalized and then return  the
        //rest of the string without the first char
    serviceLink.classList.add('center-block');
    return serviceLink;
};
/** Utility function that takes a list of services and creates a table with info from each service
 *@param {Object[]}data an array of service objects
 */
const createServiceListTable = (data) => {
    if (!data.length) {
        error('Something happened.No data received');
        return;
    }
    const fragment = document.createDocumentFragment();
    for (let i = 0, max = data.length; i < max; i++) {
        const {name} = data[i];
        let row = document.createElement("tr");
        row.id = name;
        let service = document.createElement("td");
        service.innerText = name;
        let status = document.createElement("td");
        status.innerText = name;
        let actionCell = document.createElement("td");
        let actionLink = document.createElement("a");
        let startServiceLink = createServiceLink('start', name);
        let stopServiceLink = createServiceLink('stop', name);
        let restartServiceLink = createServiceLink('restart', name);
        //Using append() instead of appendChild()
        //read more here: https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append

        try {
            actionCell.append(startServiceLink, stopServiceLink, restartServiceLink);
            row.append(service, status, actionCell);
        } catch (e) {
            //If we are here it means that chrome version is < 54 and append() is not supported
            [startServiceLink, stopServiceLink, restartServiceLink].forEach(node => actionCell.appendChild(node));
            [service, status, actionCell].forEach(node => {
                row.appendChild(node);
            });
        }
        fragment.appendChild(row);
    }
    document.querySelector("tbody").innerHTML = "";
    document.querySelector("tbody").appendChild(fragment);
};


serviceEmmiter.on('receive-services', (data) => {
    services = data;
    createServiceListTable(services);
    serviceSearch.setDB(data);
    //Hide only the startup dialog modal
    $('.dialog-info:not(.theme-selection-modal)').modal('hide');
});

serviceEmmiter.on('service-stop-status', ({status,name,err}=data) => {
    if (data.status == 'success') {
        success('Service has been stopped');
        updateServiceStatus(data.name, 'inactive');
    } else {
        error(data.err);
    }
});

serviceEmmiter.on('service-activate-status', ({status,name,err}=data) => {
    if (status == "success") {
        console.log(data)
        success('Service has been started');
        updateServiceStatus(name, "active");
    } else {
        error(err);
    }
});

serviceEmmiter.on('service-restart-status', ({status,name,err}=data) => {
    if (status == "success") {
        success('Service has been restarted');
        updateServiceStatus(name, 'active');
    } else {
        error(err);
    }
});

ipcRenderer.on('filter-services', (event, data) => {
    if (!services.length) {
        return;
    }
    const activeServices = 0,
        inactiveServices = 1,
        allServices = 2;
    let curServices = null;
    switch (data.view) {
        case activeServices:
            curServices = serviceManager.getActiveServices();
            break;
        case inactiveServices:
            curServices = serviceManager.getInactiveServices();
            break;
        case allServices:
            curServices = serviceManager.getAllServices();
            break;
    }
    createServiceListTable(curServices);
});

ipcRenderer.on('request-exit-confirmation', () => {
    confirm({
        message: 'Are you sure you want to quit UGSM?',
        callback: (answer) => {
            ipcRenderer.send('exit-confirmation-answer', answer);
        }
    });
});

ipcRenderer.on('apply-new-ui-settings', (event, data) => {
    let tableCellFontSize = data['table-cell-size'];
    jcache.get("body").css(data);
    jcache.get("table").css("font-size", `${tableCellFontSize}px`);
});

ipcRenderer.on('select-theme', () => {
    showAvailableThemes();
});

ipcRenderer.on('receive-selected-theme', (event, data) => {
    let themes = document.getElementById('theme-select').childNodes;
    //Check if theme exists by checking all available themes
    //.every() checks all element inside an array(or an array like object) to see if they pass the function
    //provided as callback.For our case if they don't it means that the theme already exists so we exit
    if (![...themes].every(theme => theme.text != data)) {
        return;
    }
    jcache.get('#theme-select').append(`<option>${data}</option>`);
    //Now we need to save that theme into localStorage
    themeManager.addTheme(data);
    themeManager.saveThemes();
});
/** Utility function that finds a service by its name and updates its status
 *@param {String} serviceName name of service to look for
 *@param {String} status The updated status of the service
 */
const updateServiceStatus = (serviceName, status) => {
    //.filter() returns an array
    //So first item in the array [0] will be our service object
    let service = services.filter(s => s.name == serviceName)[0];
    if (service) {
        service.status = status;
        //Now we also need to update the status cell in the table
        let serviceRow = document.getElementById(serviceName);
        let rowChildren = serviceRow.children;
        rowChildren[1].innerText = status;
        //Now we need to check if the user sees all services or sees them filtered
        //If filtered we need to remove the affected row
        let activeRows = document.querySelector("tbody").children;
        if (activeRows.length != services.length) {
            serviceRow.remove();
        }
    }
};

function startService(service) {
    serviceManager.startService(service);
}

function stopService(service) {
    confirm({
        message: `Are you sure you want to stop ${service} service?`,
        callback: (answer) => {
            if (answer) {
                serviceManager.stopService(service);
            }
        }
    });
}

function restartService(service) {
    serviceManager.restartService(service);
}
/**
 *Let the user choose a css file to use 
 *This way a user can create its own theme
 */
function showAvailableThemes() {
    /**
     *If theme-selection modal is open
     *we don't want to show it again
     */
    if ($(".theme-selection-modal").is(":visible")) {
        console.log('Theme selection modal is already open');
        return;
    }
    let themes = themeManager.getThemes();
    let selectedThemeIndex = themeManager.getSelectedThemeIndex();
    let selectBox = `<select class='form-control' id='theme-select'>`;
    themes.forEach((theme) => {
        selectBox += `<option>${theme}</option>`
    });
    selectBox += `</select>`;
    bootbox.dialog({
        title: 'Choose a theme',
        message: selectBox,
        buttons: {
            addTheme: {
                label: 'Add new theme',
                className: 'btn-primary',
                callback: () => {
                    //Talk to main
                    //Tell her that we need to select a theme file(css)
                    ipcRenderer.send('open-theme-selection-dialog');
                    return false;
                }
            },
            removeTheme: {
                label: 'Remove theme',
                className: 'btn-danger',
                callback: () => {
                    let themeSelect = document.getElementById('theme-select');
                    let themeIndex = themeSelect.selectedIndex;
                    let themeToRemove = themeSelect.value;
                    themeManager.removeTheme(themeToRemove);
                    //Remove theme from theme-selection modal
                    themeSelect.childNodes[themeIndex].remove();
                    //Don't close modal
                    return false;
                }
            },
            editTheme: {
                label: 'Edit theme',
                className: 'btn-info',
                callback: () => {
                    let theme = $("#theme-select").val();
                    if (theme) {
                        ipcRenderer.send('edit-theme', theme);
                    } else {
                        error('No theme selected');
                    }
                    return false;
                }
            },
            cancel: {
                label: 'Cancel'
            },
            ok: {
                label: 'Apply theme',
                className: 'btn-success',
                callback: () => {
                    let theme = $("#theme-select").val();
                    if (theme) {
                        themeManager.setSelectedTheme(theme)
                        themeManager.applySelectedTheme();
                        //We also need to apply theme to ui-preferences window
                        //by sending a message to main process
                        ipcRenderer.send('update-ui-settings-theme', theme);
                    }
                }
            }
        },
        size: 'large',
        className: 'dialog-info theme-selection-modal'
    });
}

$(document).ready(function() {
    //Make sure to apply themes before user settings
    themeManager.applySelectedTheme();
    if (lockr.get("ui-preferences")) {
        let cssData = lockr.get("ui-preferences");
        let cellFontSize = cssData['table-cell-size'];
        jcache.get("body").css(cssData);
        jcache.get("table").css("font-size", `${cellFontSize}px`);
    }
    //Loaded all css now show the window
    ipcRenderer.send('show-application');
    info('Please wait while loading system services');
    serviceManager.requestServices();
    $("#filter-by").click(function() {
        bootbox.alert({
            title: "Filter services",
            message: `
                <select id = "filter-select" class='form-control'>
                    <option>Active services</option>
                    <option>Inactive services</option>
                    <option>Show all</option>
                </select>
                `,
            callback: () => {
                const activeServices = 0,
                    inactiveServices = 1,
                    allServices = 2;
                const selectedIndex = $("#filter-select").prop("selectedIndex");
                //Check if service list is not empty
                if (services.length) {
                    let curServices = null;
                    if (selectedIndex == allServices) {
                        createServiceListTable(services);
                        return;
                    }
                    if (selectedIndex == activeServices) {
                        curServices = services.filter(service => service.status = "active");
                    } else if (selectedIndex == inactiveServices) {
                        curServices = services.filter(service => service.status == "inactive");
                    }
                    createServiceListTable(curServices);
                }
            }
        });
    });
    $("#search-btn").on('click', function() {
        let text = jcache.get("#search").val().trim();
        if (text.length < 1) {
            //Make sure that if the search input is empty all services will be shown
            createServiceListTable(services);
            return;
        }
        let results = serviceSearch.getMatches(text);
        if (results.length < 1) {
            bootbox.hideAll();
            error('No matches found');
            return;
        }
        createServiceListTable(results);
    });
    $("body").on('hide.bs.modal', '.theme-selection-modal', function() {
        //If theme-selection-modal is closed via the `x` button the event will fire twice
        //Investigate why and how to solve it
        themeManager.saveThemes();
    }).on('show.bs.modal', '.theme-selection-modal', function() {
        let selectedThemeIndex = themeManager.getSelectedThemeIndex();
        if (selectedThemeIndex == -1) {
            //We haven't selected any theme so we just exit this part of the program
            return;
        }
        //Find which option to make selected
        document.getElementById('theme-select')
            .childNodes[selectedThemeIndex].selected = true;
    });
});