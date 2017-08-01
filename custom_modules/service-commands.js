const {
    exec
} = require('child_process');
//This module
//will provide cross platform function to start stop and restart a service



//List all system services
//@param e An EventEmmiter that will be used to send services tp renderer process
function listAllServices(e) {
    //@TODO
    //Instead of writing exec 2 times just write it once and pass a variable 
    //that contains the command to be executed based on the process.platform
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
                    let status = service.slice(spaceIndex + 1).toString() == 'Running' ? 'Active' : 'Inactive';
                    return {
                        name,
                        status
                    };
                });
                services = [...services.filter(s => s.status == 'Active'), ...services.filter(s => s.status == 'Inactive')];
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
//@param service The service to stop
//@param callback A callback funtion that takes the status of a service as argument
function stopService(e, service, callback) {
    //@TODO
    //We will need a way to let service manager (not the renderer process) to know if requested
    //service has stopped so as for service manager to update its _services array
    if (process.platform == 'win32') {
        let command = `net stop ${service} 
            &&  sc query ${service} | findstr RUNNING`;
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

    }
}
module.exports = {
    listAllServices
};