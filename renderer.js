const {
    ipcRenderer
} = require('electron');
const Binder = require('./classes/binder.js');
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
        bootbox.alert({
            title: "Error",
            message: "Fuck something happened",
            className: "dialog-error"
        })
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
var ipcRendererBinder = new Binder(ipcRenderer, {
    'receive-services': (event, data) => {
        services = data;
        createServiceListTable(data);
        bootbox.hideAll();
    },
    'service-stop-status': (event, data) => {
        let options = {
            title: data.status == "success" ? "Success" : "Error",
            message: data.status == "success" ? "Service has been stopped" : "Couldn't stop service",
            className: `dialog-${data.status=="success"?"success":"error"}`
        };
        bootbox.alert(options);
        if (data.status == "success") {
            updateServiceStatus(data.name, "inactive");
        }
    },
    'service-activate-status': (event, data) => {
        let options = {
            title: data.status == "success" ? "Success" : "Error",
            message: data.status == "success" ? "Service has been started" : "Couldn't start service",
            className: `dialog-${data.status=="success"?"success":"error"}`
        };
        bootbox.alert(options);
        if (data.status == "success") {
            updateServiceStatus(data.name, "active");
        }
    },
    'service-restart-status': (event, data) => {
        let options = {
            title: data.status == "success" ? "Success" : "Error",
            message: data.status == "success" ? "Service has been restarted" : "Couldn't restart service",
            className: `dialog-${data.status=="success"?"success":"error"}`
        };
        bootbox.alert(options);
    }
});
ipcRendererBinder.addEvents({
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
                curServices = services.filter(s => s.status == "active");
                break;
            case inactiveServices:
                curServices = services.filter(s => s.status == "inactive");
                break;
            case allServices:
                curServices = services;
                break;
        }
        createServiceListTable(curServices);
    },
    'request-exit-confirmation': () => {
        bootbox.confirm({
            title: 'Warning',
            message: 'Are you sure you want to quit UGSM?',
            className: 'dialog-warning',
            callback: (answer) => {
                ipcRenderer.send('exit-confirmation-answer', answer);
            }
        })
    },
    'apply-new-ui-settings': (event, data) => {
        $("html,body").css(data)
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
        //If filtered we need to remobe the affected row
        let activeRows = document.querySelector("tbody").children;
        if (activeRows.length != services.length) {
            serviceRow.remove()
        }
    }
};
function startService(service) {
    ipcRenderer.send('start-service', service);
}
function stopService(service) {
    bootbox.confirm({
        title: "Warning",
        message: `Are you sure you want to stop ${service} service?`,
        callback: (answer) => {
            if (answer) {
                ipcRenderer.send('stop-service', service);
            }
        },
        className: "dialog-warning"
    })
}
function restartService(service) {
    ipcRenderer.send('restart-service', service);
}
$(document).ready(function() {
    if (localStorage.getItem("ui-preferences")) {
        let cssData = JSON.parse(localStorage.getItem("ui-preferences"));
        $("html,body").css(cssData);
    }
    bootbox.alert({
        title: "Info",
        message: "Please wait while loading system services",
        className: "dialog-info"
    });
    ipcRenderer.send('request-services');
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
});
