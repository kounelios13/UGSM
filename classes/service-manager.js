const exec = require('child_process').exec;
const Binder = require('./binder.js');
class ServiceManager {
    constructor(emmiter) {
        if(emmiter === undefined || typeof emmiter != 'object'){
            throw new Error('Expected an instance of EventEmmiter as 1 argument');
        }
        this._services = [];
        this._emmiter = emmiter;
    }
    requestServices(event, data) {
        exec("service --status-all", (err, stdout, stderr) => {
            if (!err) {
                let services = stdout.split("\n");
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
                this._services = [...activeServices, ...inactiveServices];
            }
            this._emmiter.emit('receive-services', this._services);
        });
    }
    updateServiceStatus(serviceName, status) {
        //filter() returns an array
        //get that item using pop() and change its status
        this._services.filter(s => s.name == serviceName)
            .pop().status = status;
    }
    getActiveServices() {
        return this._services.filter(s => s.status == "active");
    }
    getInactiveServices() {
        return this._services.filter(s => s.status == "inactive");
    }
    getAllServices() {
        return this._services;
    }
    startService(service) {
        exec(`sudo service ${service} start`, (err, stdout, stderr) => {
            let response = {
                status: "success",
                name: service
            };
            if (err) {
                response.status = "failure";
            } else {
                this.updateServiceStatus(service, 'active');
            }
            this._emmiter.emit('service-activate-status', response);
        });
    }
    stopService(service) {
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
                if (!serviceStopped) {
                    response.status = "failure";
                } else {
                    this.updateServiceStatus(service, 'inactive');
                }
            }
            this._emmiter.emit('service-stop-status', response);
        });
    }
    restartService(service) {
        let command = `sudo service ${service} restart && service ${service} status | grep "Active"`;
        exec(command, (err, stdout, stderr) => {
            let response = {
                status: "failure",
                name:service
            };
            if (!err && stdout) {
                //stdout format
                //e.g. format of a running service
                //Active : active (running)
                status = stdout.split("(")[1].split(")")[0];
                let serviceRestarted = status == "running";
                if (serviceRestarted) {
                    response.status = "success";
                    this.updateServiceStatus(service, 'active');
                }
                this._emmiter.emit('service-restart-status', response);
            }
        });
    }
}
module.exports = ServiceManager;
