const {
    exec
} = require('child_process');
const sudoExec = require('sudo-prompt').exec;

/**
*A class used for stoping ,starting and restarting Ubuntu services
*/
class ServiceManager {
    /**
    *@constructor
    *@param {EventEmmiter} emmiter An EventEmmter that will be used for sending custom messages
    */
    constructor(emmiter) {
        if (emmiter === undefined || typeof emmiter != 'object') {
            throw new Error('Expected an instance of EventEmmiter as 1 argument');
        }
        this._services = [];
        this._emmiter = emmiter;
        this.sudoOptions = {
            name: 'UGSM'
        };
    }
    /**
    * Request all system services
    * @param {Event} event The event occured from the ipcRenderer protocol 
    */
    requestServices(event) {
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
    /**
    * Update the status of a system service
    * @param {String} serviceName The name of the service you want to update its status
    * @param {String} status The new status of the service
    */
    updateServiceStatus(serviceName, status) {
        //filter() returns an array
        //get that item using pop() and change its status
        this._services.filter(s => s.name == serviceName)
            .pop().status = status;
    }
    /**
    * Get all active services
    * @returns {Array} activeServices An array containing the active services
    */
    getActiveServices() {
        let activeServices = this._services.filter(s => s.status == "active");
        return activeServices;
    }
    /**
    * Get all inactive services
    * @returns {Array} inactiveServices An array containing all inactive services
    */
    getInactiveServices() {
        let inactiveServices = this._services.filter(s => s.status == "inactive");
        return inactiveServices
    }
    getAllServices() {
        return this._services;
    }

    /**
    * Start a system service 
    * @param {String} service The name of the service to start
    */
    startService(service) {
        sudoExec(`service ${service} start`, this.sudoOptions, (err, stdout, stderr) => {
            let response = {
                status: "success",
                name: service
            };
            if (err) {
                response.status = "failure";
                response.err = err.includes('Access Denied') ? `Failed to start ${service}.Make sure you run this app as root` : err;
            } else {
                this.updateServiceStatus(service, 'active');
            }
            this._emmiter.emit('service-activate-status', response);
        });
    }
     /**
    * Stop a system service 
    * @param {String} service The name of the service to stop
    */
    stopService(service) {
        let command = `
            service ${service} stop && service ${service} status | grep "Active"
        `;
        sudoExec(command, this.sudoOptions, (err, stdout, stderr) => {
            let response = {
                status: "success",
                //Send name of process that was asked to be terminated
                name: service
            };
            if (err) {
                response.status = "failure";
                response.err = err.includes('Access Denied') ? 
                    `Failed to stop ${service}.Make sure you run this app as root or you  provide root password when prompted` : err;
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
     /**
    * Restart a system service 
    * @param {String} service The name of the service to restart
    */
    restartService(service) {
        let command = `service ${service} restart && service ${service} status | grep "Active"`;
        sudoExec(command, this.sudoOptions, (err, stdout, stderr) => {
            let response = {
                status: "failure",
                name: service
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
            } else {
                response.err = err.include('Access Denied') ? `Failed to restart ${service}.Make sure you run this app as root` : err;
            }
            this._emmiter.emit('service-restart-status', response);
        });
    }
}
module.exports = ServiceManager;