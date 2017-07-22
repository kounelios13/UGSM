const {
    success,
    error,
    info
    //Path must be relative to pages folder
} = require('../custom_modules/utils.js');
const {
    ipcRenderer
} = require('electron');
const EventEmmiter = require('events');
const Binder = require('../classes/binder.js');
const ServiceManagerBuilder = require('../classes/service-manager.js');
const IllegalArgumentError = require('../classes/illegalArgumentError.js');
const ThemeManagerBuilder = require('../classes/themeManager.js');
const themeManager = new ThemeManagerBuilder(JSON.parse(localStorage.getItem('theme-manager-files')));
var serviceEmmiter = new EventEmmiter();
var serviceManager = new ServiceManagerBuilder(serviceEmmiter);
var services = [];
//Utility function that will help us
//create the 3 types of links we need for our service list(Start, Stop,Restart)
//@param type Type of link to create(start,stop,restart)
//@param name name of servie (.e.g apache2 ,mysql etc.)
//@return serviceLink the link we created
var createServiceLink = (type, name) => {
    let allowedTypes = ['start', 'stop', 'restart'];
    if (allowedTypes.indexOf(type) == -1) {
        throw new IllegalArgumentError('Service link type must be one of the following:start,stop,restart');
    }
    let serviceLink = document.createElement('a');
    serviceLink.href = `javascript:${type}Service('${name}')`; //e.g. type start -> javascript:startService()
    serviceLink.innerText = `${type[0].toUpperCase()+type.slice(1)} Service` //Return first char of string capitallized and then return  the
        //rest of the string without the first char
    serviceLink.classList.add('center-block');
    return serviceLink;
};
//Utility function that takes a list of services and creates a table with info from each service
//@param data an array of service objects
var createServiceListTable = (data) => {
    if (!data.length) {
        error('Something happened.No data received.Probably unsupported platform');
        return;
    }
    var fragment = document.createDocumentFragment();
    for (let i = 0, max = data.length; i < max; i++) {
        let row = document.createElement("tr");
        row.id = data[i].name;
        let service = document.createElement("td");
        service.innerText = data[i].name;
        let status = document.createElement("td");
        status.innerText = data[i].status;
        let actionCell = document.createElement("td");
        let actionLink = document.createElement("a");
        let startServiceLink = createServiceLink('start', data[i].name);
        let stopServiceLink = createServiceLink('stop', data[i].name);
        let restartServiceLink = createServiceLink('restart', data[i].name);
        actionCell.appendChild(startServiceLink);
        actionCell.appendChild(stopServiceLink);
        actionCell.appendChild(restartServiceLink);
        row.appendChild(service);
        row.appendChild(status);
        row.appendChild(actionCell);
        fragment.appendChild(row);
    }
    document.querySelector("tbody").innerHTML = "";
    document.querySelector("tbody").appendChild(fragment);
};
serviceEmmiter.on('receive-services', (data) => {
    services = data;
    createServiceListTable(services);
    //Hide only the startup dialog modal
    $('.dialog-info:not(.theme-selection-modal)').modal('hide');
});
var serviceEmmiterBinder = new Binder(serviceEmmiter, {
    'service-stop-status': (data) => {
        if (data.status == 'success') {
            success('Service has been stopped');
            updateServiceStatus(data.name, 'inactive');
        } else {
            error(`Couldn't stop service`);
        }
    },
    'service-activate-status': (data) => {
        if (data.status == "success") {
            console.log(data)
            success('Service has been started');
            updateServiceStatus(data.name, "active");
        } else {
            error(`Couldn't start service`);
        }
    },
    'service-restart-status': (data) => {
        if (data.status == "success") {
            success('Service has been restarted');
        } else {
            error(`Couldn't restart service`);
        }
    }
});
var ipcRendererBinder = new Binder(ipcRenderer, {
    'filter-services': (event, data) => {
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
    },
    'request-exit-confirmation': () => {
        confirm({
            message: 'Are you sure you want to quit UGSM?',
            callback: (answer) => {
                ipcRenderer.send('exit-confirmation-answer', answer);
            }
        });
    },
    'apply-new-ui-settings': (event, data) => {
        let tableCellFontSize = data['table-cell-size'];
        $("body").css(data);
        $("table").css("font-size", `${tableCellFontSize}px`);

    },
    'select-theme': () => {
        showAvailableThemes();
    },
    'receive-selected-theme': (event, data) => {
        let themes = document.getElementById('theme-select').childNodes;
        //Check if theme exists by checking all available themes
        //.every() checks all element inside an array(or an array like object) to see if they pass the function
        //provided as callback.For our case if they don't it means that the theme already exists so we exit
        if (![...themes].every(theme => theme.text != data)) {
            return;
        }
        $('#theme-select').append(`<option>${data}</option>`);
        //Now we need to save that theme into localStorage
        themeManager.addTheme(data);
        themeManager.saveThemes();
    }
});
//Utility function that finds a service by its name and updates its status
//@param serviceName name of service to look for
//@param status The updated status of the service
var updateServiceStatus = (serviceName, status) => {
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
            serviceRow.remove()
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
//Let the user choose a css file to use 
//This way a user can create its own theme
function showAvailableThemes() {
    //If theme-selection modal is open
    //we don't wan't to reshow it
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
                    }
                }
            }
        },
        size: 'large',
        className: 'dialog-info theme-selection-modal'
    });
}
$(document).ready(function() {
    themeManager.applySelectedTheme();
    if (localStorage.getItem("ui-preferences")) {
        let cssData = JSON.parse(localStorage.getItem("ui-preferences"));
        let cellFontSize = cssData['table-cell-size'];
        $("body").css(cssData);
        $("table").css("font-size", `${cellFontSize}px`);
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
                var selectedIndex = $("#filter-select").prop("selectedIndex");
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
    $("body").on('hide.bs.modal', '.theme-selection-modal', function() {
        //If theme-selection-modal is closed via the `x` button the event will fire twice
        //Investigate why and how to solve it
        themeManager.saveThemes();
    }).on('show.bs.modal', '.theme-selection-modal', function() {
        let selectedThemeIndex = themeManager.getSelectedThemeIndex();
        if(selectedThemeIndex == -1){
            //We haven't selected any theme so we just exit this part of the program
            return;
        }
        //Find which option to make selected
        document.getElementById('theme-select')
            .childNodes[selectedThemeIndex].selected = true;
    });
});