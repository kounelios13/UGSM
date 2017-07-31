const {exec} = require('child_process');
//This module
//will provide cross platform function to start stop and restart a service



//List all system services
//@param e An EventEmmiter that will be used to send services tp renderer process
function listAllServices(e){
    //@TODO
    //Sort services depending on their status and their name
    let services = [];
    console.log('Will it be')
    if(process.platform == 'win32'){
        exec('wmic service get name,state',(err,stdout,stderr)=>{
            if(!err){
                services = stdout.split('\r\n');
                //First item of services is the following line
                //Name       Service
                //We don't need it
                services.shift();
                services = services.map(service=>{
                    //Really important
                    service = service.trim();
                    let spaceIndex = service.lastIndexOf(' ');
                    //Example of how a service item looks like
                    //mongodb         RUNNING
                    let name = service.slice(0,spaceIndex).toString().trim();
                    let status = service.slice(spaceIndex+1).toString() == 'Running'?'Active':'Inactive';
                    return {
                        name,status
                    };
                });
                services = [...services.filter(s=>s.status == 'Active'),...services.filter(s=>s.status == 'Inactive')];
            }
            e.emit('receive-services',services);
        });
    }else{
        exec('service --status -all',(err,stdout,stderr)=>{
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
                e.emit('receive-services',services);
            }
        });
    }
}
module.exports = {
    listAllServices
};