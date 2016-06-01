class FixedQueue<T> {

    items: T[];

    constructor (public length: number, initialItems: T[] = []) {
        this.items = [];

        initialItems.forEach(this.add, this);
    }

    add (item: T) {
        this.items.unshift(item);
        if (this.items.length > this.length) {
            this.items.pop();
        }
    }

    pop () {
        if (this.items.length) {
            return this.items.pop();
        }
        return null;
    }

    grow (size) {
        this.length = this.length + size;
    }
};


export default FixedQueue;
