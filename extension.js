// jshint esversion: 6
// vim: sw=4 ts=4 sts=4

// The code here is almost exclusively copy-paste from
// ui/SwitcherPopup.js as extracted from libgnome-shell.so.
//
// The "show" method of SwitcherPopup is replaced with a slightly
// modified version to show the popup instantly instead of after a delay
// of 150ms.

const SwitcherPopup = imports.ui.switcherPopup;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;

let originalShow;
let primaryModifier;

function alteredShow(backward, binding, mask) {
    if (this._items.length == 0)
        return false;

    if (!Main.pushModal(this)) {
        // Probably someone else has a pointer grab, try again with keyboard only
        if (!Main.pushModal(this, { options: Meta.ModalOptions.POINTER_ALREADY_GRABBED }))
            return false;
    }
    this._haveModal = true;
    this._modifierMask = primaryModifier(mask);

    this.connect('key-press-event', this._keyPressEvent.bind(this));
    this.connect('key-release-event', this._keyReleaseEvent.bind(this));

    this.connect('button-press-event', this._clickedOutside.bind(this));
    this.connect('scroll-event', this._scrollEvent.bind(this));

    this.add_actor(this._switcherList);
    this._switcherList.connect('item-activated', this._itemActivated.bind(this));
    this._switcherList.connect('item-entered', this._itemEntered.bind(this));
    this._switcherList.connect('item-removed', this._itemRemoved.bind(this));

    // Need to force an allocation so we can figure out whether we
    // need to scroll when selecting
    this.opacity = 0;
    this.visible = true;
    this.get_allocation_box();

    this._initialSelection(backward, binding);

    // There's a race condition; if the user released Alt before
    // we got the grab, then we won't be notified. (See
    // https://bugzilla.gnome.org/show_bug.cgi?id=596695 for
    // details.) So we check now. (Have to do this after updating
    // selection.)
    if (this._modifierMask) {
        let [x, y, mods] = global.get_pointer();
        if (!(mods & this._modifierMask)) {
            this._finish(global.get_current_time());
            return false;
        }
    } else {
        this._resetNoModsTimeout();
    }

    // THE FOLLOWING PART WAS MODIFIED FOR THIS EXTENSION
    // ------------------------------------------------------------
    Main.osdWindowManager.hideAll();
    this.opacity = 255;
    // ------------------------------------------------------------
    return true;
}

function init() {
    originalShow = SwitcherPopup.SwitcherPopup.prototype.show;
    primaryModifier = SwitcherPopup.primaryModifier;
}

function enable() {
    SwitcherPopup.SwitcherPopup.prototype.show = alteredShow;
}

function disable() {
    SwitcherPopup.SwitcherPopup.prototype.show = originalShow;
}
