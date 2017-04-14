// jshint esversion: 6
// vim: sw=4 ts=4 sts=4

const SwitcherPopup = imports.ui.switcherPopup;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;

const POPUP_DELAY_TIMEOUT = 0; // milliseconds

let old_show;

function primaryModifier(mask) {
    if (mask == 0)
        return 0;

    let primary = 1;
    while (mask > 1) {
        mask >>= 1;
        primary <<= 1;
    }
    return primary;
}

function init() {
    old_show = SwitcherPopup.SwitcherPopup.prototype.show;
}

function enable() {
    SwitcherPopup.SwitcherPopup.prototype.show = function(backward, binding, mask) {
        if (this._items.length == 0)
            return false;

        if (!Main.pushModal(this.actor)) {
            // Probably someone else has a pointer grab, try again with keyboard only
            if (!Main.pushModal(this.actor, { options: Meta.ModalOptions.POINTER_ALREADY_GRABBED })) {
                return false;
            }
        }
        this._haveModal = true;
        this._modifierMask = primaryModifier(mask);

        this.actor.connect('key-press-event', Lang.bind(this, this._keyPressEvent));
        this.actor.connect('key-release-event', Lang.bind(this, this._keyReleaseEvent));

        this.actor.connect('button-press-event', Lang.bind(this, this._clickedOutside));
        this.actor.connect('scroll-event', Lang.bind(this, this._scrollEvent));

        this.actor.add_actor(this._switcherList.actor);
        this._switcherList.connect('item-activated', Lang.bind(this, this._itemActivated));
        this._switcherList.connect('item-entered', Lang.bind(this, this._itemEntered));

        // Need to force an allocation so we can figure out whether we
        // need to scroll when selecting
        this.actor.opacity = 0;
        this.actor.show();
        this.actor.get_allocation_box();

        this._initialSelection(backward, binding);

        // There's a race condition; if the user released Alt before
        // we got the grab, then we won't be notified. (See
        // https://bugzilla.gnome.org/show_bug.cgi?id=596695 for
        // details.) So we check now. (Have to do this after updating
        // selection.)
        let [x, y, mods] = global.get_pointer();
        if (!(mods & this._modifierMask)) {
            this._finish(global.get_current_time());
            return false;
        }

        // We delay showing the popup so that fast Alt+Tab users aren't
        // disturbed by the popup briefly flashing.
        this._initialDelayTimeoutId = Mainloop.timeout_add(POPUP_DELAY_TIMEOUT,
                                                           Lang.bind(this, function () {
                                                               Main.osdWindowManager.hideAll();
                                                               this.actor.opacity = 255;
                                                               this._initialDelayTimeoutId = 0;
                                                               return GLib.SOURCE_REMOVE;
                                                           }));
        GLib.Source.set_name_by_id(this._initialDelayTimeoutId, '[gnome-shell] Main.osdWindow.cancel');
        return true;
    };
}

function disable() {
    SwitcherPopup.SwitcherPopup.prototype.show = old_show;
}
