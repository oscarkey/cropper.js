# cropper.js
Copyright 2012 Oscar Key
Licensed under GPL v3. See below and COPYING.
A simple image cropping library which uses pure Javascript and the `<canvas>` tag in order to crop images in the browser.

Cropper draws an image cropper to a canvas.
It will display an image, correctly scaled to fit the given canvas. When in cropping mode, the user can then select which area of the image they want, at an aspect ratio you (the developer) chooses. You can then display the image elsewhere, or upload it to a server.

The example probably provides the best documentation, see `example.html`.

**Important note:** if you provide cropper with a local image, or one from another domain, a security exception will probably be raised by the browser. See the example for how to load the image from a file input to get around this.

## API
**cropper.showImage(src)**
*src*: the url to the image, it is probably best to use a "data uri"
Cropper will display the image provided in the canvas, scaled to fit. If the image did not exist, it will crash.

**cropper.startCropping()**
*returns*: true if cropping started, false if no image present
This will display the area selector thus allowing the user to select which bit of the image to keep. It also sets a restore point.

**cropper.getCroppedImageSrc()**
*returns*: the src (in data uri form) of the cropped image, false if there was no image present
This gets the data uri of the cropped image that the user has selected. It also displays this new cropped image in the canvas, replacing the existing image. The area selector is hidden.

**cropper.start(canvas, ratio)**
*canvas*: a canvas object to display the cropper in
*ratio*: the aspect ratio of the output, height = width * ratio
This initializes cropper. Visually, nothing appears to happen.

**cropper.restore()**
*returns*: true if restore successful, false if there was no image present
This is an undo function. It returns the cropper state to when startCropping() was last called. Mutliple undo may be in a future version.

## LICENSE
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.