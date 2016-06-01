import Event from './Event';

/**
 * Event bus to handle events that may occur asyncronoulsy
 */

export class EventBus {

    private events: Event[] = [];

    trigger (name: string, value: any) {
        this.events.unshift(new Event(name, value));
    }

    pop (): Event {
        return this.events.pop();
    }
}

let instance = new EventBus();

export default instance;
