const {exec} = require('child_process');
const Binder = require('./binder.js');
const serviceCommands = require('../custom_modules/service-commands.js');
class ServiceManager {
    constructor(emmiter) {
        if(emmiter === undefined || typeof emmiter != 'object'){
            throw new Error('Expected an instance of EventEmmiter as 1 argument');
        }
        this._services = [];
        this._emmiter = emmiter;
    }
    requestServices(event, data) {
        serviceCommands.listAllServices(this._emmiter);
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
        serviceCommands.startService(this._emmiter,service,(response)=>{
            if(response.status == 'success'){
                this.updateServiceStatus(service,'active');
            }
        });
    }
    stopService(service) {
        serviceCommands.stopService(this._emmiter,service,(response)=>{
            if(response.status == 'success'){
                this.updateServiceStatus(service,'inactive');
            }
        });
    }
    restartService(service){
        serviceCommands.restartService(this._emmiter,service,(response)=>{
            if(response.status == 'success'){
                this.updateServiceStatus(service,'active');
            }
        });
    }
}
module.exports = ServiceManager;
