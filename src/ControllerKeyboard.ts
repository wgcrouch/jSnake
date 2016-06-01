import EventBus from './EventBus';

const dirs = {37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN'};
const menuOptions = {89: 'YES', 78: 'NO'};

class ControllerKeyboard {
    init () {
        window.onkeydown = ((evt) => {

            if (dirs[evt.keyCode]) {
                evt.preventDefault();
                EventBus.trigger('controller.direction', dirs[evt.keyCode]);
            }

            if (menuOptions[evt.keyCode]) {
                evt.preventDefault();
                EventBus.trigger('controller.menu', menuOptions[evt.keyCode]);
            }

        });
    }
}

export default ControllerKeyboard;
