const {
    exec
} = require('child_process');
//This module
//will provide cross platform function to start stop and restart a service
//List all system services
//@param e An EventEmmiter that will be used to send services tp renderer process
function listAllServices(e) {
    //@TODO
    //Sort services depending on their status and their name
    let services = [];
    if (process.platform == 'win32') {
        exec('wmic service get name,state', (err, stdout, stderr) => {
            if (!err) {
                services = stdout.split('\r\n');
                //First item of services is the following line
                //Name       Service
                //We don't need it
                services.shift();
                services = services.map(service => {
                    //Really important
                    service = service.trim();
                    let spaceIndex = service.lastIndexOf(' ');
                    //Example of how a service item looks like
                    //mongodb         RUNNING
                    let name = service.slice(0, spaceIndex).toString().trim();
                    let status = service.slice(spaceIndex + 1).toString() == 'Running' ? 'active' : 'inactive';
                    return {
                        name,
                        status
                    };
                });
                services = [...services.filter(s => s.status == 'active'), ...services.filter(s => s.status == 'inactive')];
            }
            e.emit('receive-services', services);
        });
    } else {
        exec('service --status -all', (err, stdout, stderr) => {
            if (!err) {
                services = stdout.split("\n");
                let service = null;
                let activeServices = services.filter(service => service.indexOf("+") != -1)
                    .map(srv => {
                        let status = "active";
                        let name = srv.split("]")[1].trim();
                        service = {
                            name,
                            status
                        };
                        return service;
                    }).sort((a, b) => {
                        a = a.name.toUpperCase();
                        b = b.name.toUpperCase();
                        return a < b ? -1 : a > b ? 1 : 0;
                    });
                let inactiveServices = services.filter(service => service.indexOf("-") != -1)
                    .map(srv => {
                        let status = "inactive";
                        let name = srv.split("]")[1].trim();
                        service = {
                            name,
                            status
                        };
                        return service;
                    }).sort((a, b) => {
                        a = a.name.toUpperCase();
                        b = b.name.toUpperCase();
                        return a < b ? -1 : a > b ? 1 : 0;
                    });
                services = [...activeServices, ...inactiveServices];
                e.emit('receive-services', services);
            }
        });
    }
}
//stop a given service
//@param e An instance of EventEmmiter
//@param service The service to stop
//@param callback A callback funtion that takes the status of a service as argument
function stopService(e, service, callback) {
    if (process.platform == 'win32') {
        let command = `net stop ${service} 
            &&  sc query ${service} | findstr RUNNING`;
        //Why do we use findstr RUNNING instead of STOPPED?
        //The reason is simple 
        //When a service is stopped and you do a query which tries to find that the service is RUNNING
        //but since this service is now stopped checking against RUNNING will return an empty string
        //which means that the service is no longer running
        exec(command, (err, stdout, stderr) => {
            let response = {
                status: 'failure'
            };
            if (!stdout.length && !err) {
                response.status = 'success';
            }
            e.emit('service-stop-status', response);
            callback(response);
        });
    } else {
        let command = `
            sudo service ${service} stop && service ${service} status | grep "Active"
        `;
        exec(command, (err, stdout, stderr) => {
            let response = {
                status: "success",
                //Send name of process that was asked to be terminated
                name: service
            };
            if (err) {
                response.status = "failure";
            }
            if (!err && stdout) {
                //stdout format
                //e.g. format of a running service
                //Active : active (running)
                let status = stdout.split("(")[1].split(")")[0];
                let serviceStopped = status == "dead";
            }
            e.emit('service-stop-status', response);
            callback(response);
        });
    }
}
//start a given service
//@param e An instance of EventEmmiter
//@param service The service to start
//@param callback A callback funtion that takes the status of a service as argument
function startService(e, service, callback) {
    let command = null;
    if (process.platform == 'win32') {
        //Why do we use findstr STOPPED instead of RUNNING?
        //The reason is simple 
        //When a service is started and you do a query which tries to find that the service is STOPPED
        //but since this service is now started checking against STOPPED will return an empty string
        //which means that the service is no longer running
        command = `net start ${service} && sc query ${service} | findstr STOPPED`
        exec(command, (err, stdout, stderr) => {
            let response = {
                status: 'failure',
                name: service
            };
            //If service is started when we check it status against STOPPED we should not get any output just an empty string
            if (!err && !stdout.length) {
                response.status = 'success';
            }
            e.emit('service-activate-status', response);
            callback(response);
        });
    } else {
        command = `sudo service ${service} start`;
        exec(command, (err, stdout, stderr) => {
            let response = {
                status: 'failure',
                name: service
            };
            if (!err) {
                response.status = 'success';
            }
            e.emit('service-start-status', response);
            callback(response);
        });
    }
}
//This function restarts a service
//It firsts stops it and then starts it
//@param e An instance of EventEmmiter
//@param service Service to restart
//@param callback A function to execute at the end
function restartService(e, service, callback) {
    //Because restarting a service on windows involve 2 different function calls
    //check if we are not using windows
    if (process.platform != 'win32') {
        exec(`sudo service ${service} restart`, (err, stdout, stderr) => {
            let response = {};
            if (err == null) {
                response.status = 'success';
            } else {
                response.status = 'failure';
            }
            e.emit('service-restart-status', response);
            callback(response);
        });
    } else {
        stopService(e, service, (response) => {
            if (response.status == 'success') {
                //Service stopped.Now try to start it
                startService(e, service, (response) => {
                    e.emit('service-restart-status', response);
                    callback(response);
                });
            } else {
                //Failed to stop service
                e.emit('service-restart-status', response);
                callback(response);
            }
        });
    }
}
module.exports = {
    listAllServices,
    stopService,
    startService,
    restartService
};
