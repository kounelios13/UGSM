/** Binder class will let us bind multiple 'on' events in an object
*/ 
class Binder {
    /**
    @constructor
    @param {Object}obj The object we are going to attach multiple 'on' events to
    @param {Object}events An object with keys being the name of the event we want to attach to
    * our object and the values being the callbacks
    */
    constructor(obj, events) {
        this.obj = obj
        for (let event in events) {
            if (events.hasOwnProperty(event)) {
                let callback = events[event];
                obj.on(event, callback);
            }
        }
    }
    /** Add new events to the object of the current Binder instance
    * @param {Object}events An object with keys being the name of the event we want to attach to
    * our object and the values being the callbacks
    */
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