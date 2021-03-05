/*
* cropper.js -- v0.1
* Copyright 2012 Oscar Key
* A simple image cropping library which uses pure Javascript and the <canvas> tag in order to crop images in the browser.
*/

/*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const COLORS = {
	white: "#ffffff",
	black: "#000000",
	overlay: "rgba(0, 0, 0, 0.6)"
};

HTMLCanvasElement.prototype.getMouseCoords = function(event){
	// loop through this element and all its parents to get the total offset
	let totalOffsetX = 0;
	let totalOffsetY = 0;
	let canvasX = 0;
	let canvasY = 0;
	let currentElement = this;

	do {
		totalOffsetX += currentElement.offsetLeft;
		totalOffsetY += currentElement.offsetTop;
	}
	while(currentElement = currentElement.offsetParent)

	canvasX = event.pageX - totalOffsetX;
	canvasY = event.pageY - totalOffsetY + window.scrollY;


	return {x:canvasX, y:canvasY}
}


class Canvas
{
	constructor(element, ratioX, ratioY)
	{
		this.element = element;
		this.image = undefined;
		this.restoreImage = undefined;
		this.cropping = false;
		this.context = this.element.getContext("2d");
		this.currentDimens = {};
		this.ratioX = ratioX || 1;
		this.ratioY = ratioY || 1;

		this.overlay =
		{
			x: 50,
			y: 50,
			width: this.element.width * 0.6 * Math.min(1, this.ratioX / this.ratioY),
			height: this.element.height * 0.6 * Math.min(1, this.ratioY / this.ratioX),
			resizerSide: 10,
			ratioXY: this.ratioY / this.ratioX
		};

		this.drag = {
			type: "", // options: "moveOverlay", "resizeOverlay"
			inProgress: false,
			originalOverlayX: 0,
			originalOverlayY: 0,
			originalX: 0,
			originalY: 0,
			originalOverlayWidth: 0,
			originalOverlayHeight: 0
		};

	};

	startCropping() {
		// only continue if an image is loaded
		if(this.image === undefined) {
			return false;
		}

		// save the current state
		this.restoreImage = new Image();
		this.restoreImage.src = this.image.src;

		this.cropping = true;
		this.draw();

		return true;
	};


	start(ratio)
	{
		if (!this.element.getContext)
		{
			return;
		}

		this.context = this.element.getContext("2d");

		// set up the overlay ratio
		if(this.ratio) {
			this.setRatio(ratio);
		}

		// setup mouse stuff
		this.addEventListeners();

	};


	// Set default overlay position
	// set up the overlay ratio


	draw()
	{
		// clear the canvas
		this.context.clearRect(0, 0, this.element.width, this.element.height);

		// if we don't have an image file, abort the draw at this point
		if(this.image === undefined) {
			return;
		}

		// draw the image
		let dimens = this.currentDimens;
		this.context.drawImage(this.image, 0, 0, dimens.width, dimens.height);

		// draw cropping stuff if we are cropping
		if(this.cropping) {
			// draw the overlay
			this.drawOverlay();

			// draw the resizer
			let x = this.overlay.x + this.overlay.width - 5,
			y = this.overlay.y + this.overlay.height - 5,
			w = this.overlay.resizerSide,
			h = this.overlay.resizerSide;

			this.context.save();
			this.context.fillStyle = COLORS.black;
			this.context.strokeStyle = COLORS.white;
			this.context.fillRect(x, y, w, h);
			this.context.strokeRect(x, y, w, h);
			this.context.restore();
		}
	}

	drawOverlay() {
		// draw the overlay using a path made of 4 trapeziums (ahem)
		this.context.save();

		this.context.fillStyle = COLORS.overlay;
		this.context.beginPath();
		this.context.moveTo(0, 0);
		this.context.lineTo(this.overlay.x, this.overlay.y);
		this.context.lineTo(this.overlay.x + this.overlay.width, this.overlay.y);
		this.context.lineTo(this.element.width, 0);
		this.context.moveTo(this.element.width, 0);
		this.context.lineTo(this.overlay.x + this.overlay.width, this.overlay.y);
		this.context.lineTo(this.overlay.x + this.overlay.width, this.overlay.y + this.overlay.height);
		this.context.lineTo(this.element.width, this.element.height);
		this.context.moveTo(this.element.width, this.element.height);
		this.context.lineTo(this.overlay.x + this.overlay.width, this.overlay.y + this.overlay.height);
		this.context.lineTo(this.overlay.x, this.overlay.y + this.overlay.height);
		this.context.lineTo(0, this.element.height);
		this.context.moveTo(0, this.element.height);
		this.context.lineTo(this.overlay.x, this.overlay.y + this.overlay.height);
		this.context.lineTo(this.overlay.x, this.overlay.y);
		this.context.lineTo(0, 0);

		this.context.fill();
		this.context.restore();
	}

	setRatio(ratio) {
		this.overlay.ratioXY = ratio;
		this.overlay.height = Math.floor(this.overlay.width * ratio);
	}

	getScaledImageDimensions(width, height) {
		// choose the dimension to scale to, depending on which is "more too big"
		let factor = 1;
		if((this.element.width - width) < (this.element.height - height)) {
			// scale to width
			factor = this.element.width / width;
		} else {
			// scale to height
			factor = this.element.height / height;
		}
		// important "if,else" not "if,if" otherwise 1:1 images don't scale

		let dimens = {
			width: Math.floor(width * factor),
			height: Math.floor(height * factor),
			factor: factor
		};

		return dimens;
	}

	getTouchPos(touchEvent) {
		let rect = this.element.getBoundingClientRect();

		return {
			x: touchEvent.touches[0].clientX - rect.left,
			y: touchEvent.touches[0].clientY - rect.top
		};
	}

	/**
	* @param {Number} x position mouse / touch client event
	* @param {Number} y position mouse / touch client event
	*/
	getClickPos({x, y}) {
		return {
			x : x - window.scrollX,
			y : y - window.scrollY
		}
	}
	isInOverlay(x, y) {
		return x > this.overlay.x && x < (this.overlay.x + this.overlay.width) && y > this.overlay.y && y < (this.overlay.y + this.overlay.height);
	}

	isInHandle(x, y) {
		return x > (this.overlay.x + this.overlay.width - this.overlay.resizerSide) && x < (this.overlay.x + this.overlay.width + this.overlay.resizerSide) && y > (this.overlay.y + this.overlay.height - this.overlay.resizerSide) && y < (this.overlay.y + this.overlay.height + this.overlay.resizerSide);
	}
	initialCropOrMoveEvent({x, y}) {
		// if the mouse clicked in the overlay
		if(this.isInOverlay(x, y)) {
			this.drag.type = "moveOverlay";
			this.drag.inProgress = true;
			this.drag.originalOverlayX = x - this.overlay.x;
			this.drag.originalOverlayY = y - this.overlay.y;
		}

		if(this.isInHandle(x, y)) {
			this.drag.type = "resizeOverlay";
			this.drag.inProgress = true;
			this.drag.originalX = x;
			this.drag.originalY = y;
			this.drag.originalOverlayWidth = this.overlay.width;
			this.drag.originalOverlayHeight = this.overlay.height;
		}
	}

	startCropOrMoveEvent({x, y}) {

		// Set current cursor as appropriate
		if(this.isInHandle(x, y) || (this.drag.inProgress && this.drag.type === "resizeOverlay")) {
			this.element.style.cursor = 'nwse-resize'
		} else if(this.isInOverlay(x, y)) {
			this.element.style.cursor = 'move'
		} else {
			this.element.style.cursor = 'auto'
		}

		// give up if there is no drag in progress
		if(!this.drag.inProgress) {
			return;
		}

		// check what type of drag to do
		if(this.drag.type === "moveOverlay") {
			this.overlay.x = x - this.drag.originalOverlayX;
			this.overlay.y = y - this.drag.originalOverlayY;
			// Limit to size of canvas.
			let xMax = this.element.width - this.overlay.width;
			let yMax = this.element.height - this.overlay.height;

			if(this.overlay.x < 0) {
				this.overlay.x = 0;
			} else if(this.overlay.x > xMax) {
				this.overlay.x = xMax;
			}

			if(this.overlay.y < 0) {
				this.overlay.y = 0;
			} else if(this.overlay.y > yMax) {
				this.overlay.y = yMax;
			}

			this.draw();
		} else if(this.drag.type === "resizeOverlay") {
			this.overlay.width = this.drag.originalOverlayWidth + (x - this.drag.originalX);

			// do not allow the overlay to get too small
			if(this.overlay.width < 10) {
				this.overlay.width = 10;
			}

			// Don't allow crop to overflow
			if(this.overlay.x + this.overlay.width > this.element.width) {
				this.overlay.width = this.element.width - this.overlay.x;
			}

			this.overlay.height = this.overlay.width * this.overlay.ratioXY;

			if(this.overlay.y + this.overlay.height > this.element.height) {
				this.overlay.height = this.element.height - this.overlay.y;
				this.overlay.width = this.overlay.height / this.overlay.ratioXY;
			}

			this.draw();
		}
	}

	 addEventListeners() {
		// add mouse listeners to the canvas
		this.element.addEventListener("mousedown", event => {
			// depending on where the mouse has clicked, choose which type of event to fire
			let coords = this.element.getMouseCoords(event);
			this.initialCropOrMoveEvent(this.getClickPos(coords));
		});

		this.element.addEventListener("mouseup", event => {

			// cancel any drags
			this.drag.inProgress = false;
		});

		this.element.addEventListener("mouseout", event => {

			// cancel any drags
			this.drag.inProgress = false;
		});


		this.element.addEventListener("mousemove", event => {

			let coords = this.element.getMouseCoords(event);
			this.startCropOrMoveEvent(this.getClickPos(coords));
		})


		this.element.addEventListener('touchstart', event => {
			this.initialCropOrMoveEvent(this.getTouchPos(event));
		});

		this.element.addEventListener('touchmove', event => {
			this.startCropOrMoveEvent(this.getTouchPos(event));
		});

		this.element.addEventListener('touchend', event => {
			this.drag.inProgress = false;
		})
	}

	/* CROPPING FUNCTIONS */
	cropImage(entire) {
		// if we don't have an image file, abort at this point
		if(this.image === undefined) {
			return false;
		}

		// if we aren't cropping, ensure entire is tru
		if(!this.cropping) {
			entire = true;
		}

		// assume we want to crop the entire image, this will be overriden below
		let x = 0;
		let y = 0;
		let width = this.image.width;
		let height = this.image.height;

		if(!entire) {
			// work out the actual dimensions that need cropping
			let factor = this.currentDimens.factor;
			x = Math.floor(this.overlay.x / factor);
			y = Math.floor(this.overlay.y / factor);
			width = Math.floor(this.overlay.width / factor);
			height = Math.floor(this.overlay.height / factor);

			// check the values are within range of the image
			if(x < 0){ x = 0; }
			if(x > this.image.width){ x = this.image.width; }
			if(y < 0){ y = 0; }
			if(y > this.image.height){ y = this.image.height; }

			if(x + width > this.image.width){ width = this.image.width - x; }
			if(y + height > this.image.height){ height = this.image.height - y; }
		}

		// load the image into the cropping canvas
		let cropCanvas = document.createElement("canvas");
		cropCanvas.setAttribute("width", width);
		cropCanvas.setAttribute("height", height);

		let cropContext = cropCanvas.getContext("2d");
		cropContext.drawImage(this.image, x, y, width, height, 0, 0, width, height);

		return cropCanvas;
	}

	dataUrlToBlob(dataURI) {
		// convert base64 to raw binary data held in a string
		let byteString = atob(dataURI.split(',')[1]);

		// separate out the mime component
		let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// write the bytes of the string to an ArrayBuffer
		let ab = new ArrayBuffer(byteString.length);
		let ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		// write the ArrayBuffer to a blob, and you're done
		return new Blob([ia], {type: mimeString});
	}

	showImage(src) {
		this.cropping = false;
		this.image = new Image();
		this.image.addEventListener("load", () => {

			this.currentDimens = this.getScaledImageDimensions(this.image.width, this.image.height) ; // work out the scaling
			this.draw();
		});

		this.image.src = src;
	};

	getCroppedImageSrc() {
		if(this.image) {
			// return the cropped image
			let cropCanvas = this.cropImage(!this.cropping); // cropping here controls if we get the entire image or not, desirable if the user is not cropping
			let url = cropCanvas.toDataURL("png");

			let valueSize = (this.overlay.width * this.image.width / this.currentDimens.width);
			let valueX = (this.overlay.x * this.image.width / this.currentDimens.width);
			let valueY = (this.overlay.y * this.image.height / this.currentDimens.height);

			console.log(valueSize);
			console.log(valueX);
			console.log(valueY);

			const canvasDiv = this.element.parentElement;

			// canvasDiv.querySelector(".size").value = Math.round(valueSize);
			// canvasDiv.querySelector(".picture-x").value = Math.round(valueX);
			// canvasDiv.querySelector(".picture-y").value = Math.round(valueY);

			// show the new image, only bother doing this if it isn't already displayed, ie, we are cropping
			if(this.cropping) {
				this.showImage(url);
			}

			this.cropping = false;
			return url;
		} else {
			return false;
		}
	};



	getCroppedImageBlob(type) {
		if(this.image) {
			// return the cropped image
			let cropCanvas = this.cropImage(!this.cropping); // cropping here controls if we get the entire image or not, desirable if the user is not cropping
			let url = cropCanvas.toDataURL(type || "png");

			// show the new image, only bother doing this if it isn't already displayed, ie, we are cropping
			if(this.cropping) {
				this.showImage(url);
			}

			this.cropping = false;

			// convert the url to a blob and return it
			return dataUrlToBlob(url);
		} else {
			return false;
		}
	};



	restore() {
		if(this.restoreImage === undefined) {
			return false;
		}

		this.cropping = false;

		// show the saved image
		this.showImage(this.restoreImage.src);
		this.startCropping();
		return true;
	};
}


function main()
{
	const croppers = document.querySelectorAll('._cropper');


	for (let i = 0; i < croppers.length; i++)
	{
		// Create the canvas element
		const dimensions = window.getComputedStyle(croppers[i]);
		const cropperHeight = (parseInt(dimensions.height) == 0) ? 600 : 0.7 * parseInt(dimensions.height);
		const cropperWidth = (parseInt(dimensions.width) == 0) ? 600 : 0.7 * parseInt(dimensions.width);

		const dimension = Math.max(100, Math.min(cropperHeight, cropperWidth));
		const canvasElement = document.createElement('canvas');

		const ratioX = croppers[i].dataset.ratiox || 1;
		const ratioY = croppers[i].dataset.ratioy || 1;

		canvasElement.width = dimension;
		canvasElement.height = dimension;
		canvasElement.style.border = '1px solid black';

		const buttonContainer = document.createElement('div');


		// Create the inputs
		const crop = document.createElement('button');
		const cropSpan = document.createElement('span');
		const cropContent = document.createElement('span');

		const restore = document.createElement('button');
		const restoreSpan = document.createElement('span');
		const restoreContent = document.createElement('span');

		const input = document.createElement('input');
		const label = document.createElement('label');
		const labelContent = document.createElement('span');
		const labelSpan = document.createElement('span');

		// Input name
		input.name = croppers[i].dataset.name || `croppedImage${i}`;
		input.id = input.name;

		// Adding types
		crop.type = 'button';
		restore.type = 'button';
		input.type = 'file';
		label.htmlFor = input.id;


		// class names
		cropSpan.className = 'material-icons';
		restoreSpan.className = 'material-icons';
		labelSpan.className = 'material-icons';

		// Inner HTML
		cropContent.innerHTML = 'Crop';
		cropSpan.innerHTML = 'crop';


		restoreContent.innerHTML = 'Restore';
		restoreSpan.innerHTML = 'restore';

		labelContent.innerHTML = 'Upload Image';
		labelSpan.innerHTML = 'file_upload';


		// Appending
		label.append(labelSpan);
		label.append(labelContent);

		crop.append(cropSpan);
		crop.append(cropContent);

		restore.append(restoreSpan);
		restore.append(restoreContent);

		// Appending all the elements to the main div
		croppers[i].append(canvasElement);
		croppers[i].append(buttonContainer);

		buttonContainer.append(input);
		buttonContainer.append(label);
		buttonContainer.append(crop);
		buttonContainer.append(restore);


		const canvas = new Canvas(canvasElement, ratioX, ratioY);
		canvas.start(1);

		// Input event Listeners
		input.onchange = () => {
			// this function will be called when the file input below is changed
			let file = input.files[0];  // get a reference to the selected file

			let reader = new FileReader(); // create a file reader
			// set an onload function to show the image in cropper once it has been loaded
			reader.onload = function(event) {
				let data = event.target.result; // the "data url" of the image
				canvas.showImage(data); // hand this to cropper, it will be displayed
				canvas.startCropping();
			};

			reader.readAsDataURL(file); // this loads the file as a data url calling the function above once done

		}

		crop.onclick = () => {
			canvas.getCroppedImageSrc();
		}

		restore.onclick = () => {
			canvas.restore();
		}
	}
}

main();
