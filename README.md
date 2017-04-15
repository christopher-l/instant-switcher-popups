# Instant Switcher Popups

This is a Gnome Shell extension to remove the delay of popups like the
Alt-Tab switcher.
It modifies a method of the `switcherPopup` class, which is shipped with
the Gnome Shell, by copy/pasting most of its code.
Thus, its support is limited to a specific version of the Gnome Shell for
now (see [metadata.json](metadata.json)).

## Installation

    git clone https://github.com/christopher-l/instant-switcher-popups.git ~/.local/share/gnome-shell/extensions/instant-switcher-popups@christopher.luebbemeier.gmail.com

Then restart the Shell and activate with Gnome Tweak Tool or via
<https://extensions.gnome.org/local/>.

## Maintenance

A list of embedded Javascript files can be obtained with

    gresource list /usr/lib64/gnome-shell/libgnome-shell.so

Relevant files can be extracted like this:

    gresource extract /usr/lib64/gnome-shell/libgnome-shell.so /org/gnome/shell/ui/switcherPopup.js > switcherPopup.js

## Licence

[GPLv2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
or above.
