const exec = require('child_process').exec;
const Binder = require('./binder.js');
let initMonitor = Symbol();
class ServiceManager{
    constructor(){
        this._services = [];
    }
    requestServices(event,data){
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
            event.sender.send('receive-services',this._services);
        });
    }
    getActiveServices(){
        return this._services.filter(s=>s.status == "active")
    }
    getInactiveServices(){
        return this._services.filter(s=>s.status == "inactive")
    }
    startService(event,service){
        exec(`sudo service ${service} start`, (err, stdout, stderr) => {
            let response = {
                status: "success",
                name: service
            };
            if (err) {
                response.status = "failure";
            }
            event.sender.send('service-activate-status', response);
        });       
    }
    stopService(event,service){
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
                }
            }
            event.sender.send('service-stop-status', response);
        });
    }
    restartService(event,service){
         exec(`sudo service ${service} restart`, (err, stdout, stderr) => {
            let response = {
                status: "failure"
            };
            exec(`service ${service} status | grep "Active"`, (err, stdout, stderr) => {
                if (!err && stdout) {
                    //stdout format
                    //e.g. format of a running service
                    //Active : active (running)
                    status = stdout.split("(")[1].split(")")[0];
                    let serviceRestarted = status == "running";
                    if (serviceRestarted) {
                        response.status = "success";
                    }
                    event.sender.send('service-restart-status', response);
                }
            });
        });    
    }
}
module.exports = ServiceManager;