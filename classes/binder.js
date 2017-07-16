class Binder {
    constructor(obj, events) {
        this.obj = obj
        for (let event in events) {
            if (events.hasOwnProperty(event)) {
                let callback = events[event];
                obj.on(event, callback);
            }
        }
    }
    addEvents(events) {
        //events should be an object
        //with key being the name of the event we want to add to our object 
        //and the value being the callback function
        //e.g.
        /*{
        *  destroy:()=>alert('help'),
        *  reborn:()=>throw new Error("One doesn't simply reborn")
        *}*/
        if (typeof(events) == "object" && !Array.isArray(events)) {
            for(let event in events){
                let callback = events[event];
                this.obj.on(event,callback);
            }
        }
    }
    getEvents(){
        return this.obj;
    }

}
module.exports = Binder;