#CropTool.js

CropTool.js is a lightweight JavaScript library used to take a DOM element you give it, and hook up the events
required to make cropping an image client side simple. There are some basic structural rules around how your
DOM element has to be setup, but other than that you can style as you desire.

**_NOTE: [jQuery](http://jquery.com/) and [Extendjs](http://extendjs.org/) are required for this library to work._**

Here is a basic example of how you element can be structured
```html
<div class="ImageCropper">
  <div class="tools-area">
    <div class="tool-bar">
      <div class="tools-container">
        <button class="btn-crop tool" type="button">
          <span class="icon icon-crop"></span>
        </button>
        <button class="btn-scale-up tool" type="button">
          <span class="icon icon-scale-up"></span>
        </button>
        <button class="btn-scale-down tool" type="button">
          <span class="icon icon-scale-down"></span>
        </button>
        <button class="btn-scale-reset tool" type="button">
          <span class="icon icon-scale-reset"></span>
        </button>
      </div>
    </div>
    <div class="crop-area">
      <div class="crop-mask">
        <img alt="crop image" class="crop-image" draggable="false" src="./files/images/image.jpg" />
        <div class="crop-definer"></div>
      </div>
    </div>
  </div>
</div>
```

The only structure that must stay the same is that `crop-image` must be a child of `crop-mask`. `crop-mask` should be the height/width of
the desired crop output, and `crop-image` should be positioned absolutely, relative to the containing `crop-mask`.

Particular classes applied to elements will force those elements to have particular events hooked up:
- `btn-crop` will hook up the event to produce the cropped image.
- `btn-scale-up` will hook up the event to scale the image up.
  - A `data-scale-by` attribute can be added to this element to define the percent (0-1 not 0-100) to scale by.
- `btn-scale-down` will hook up the event to scale the image down.
  - A `data-scale-by` attribute can be added to this element to define the percent (0-1 not 0-100) to scale by.
- `btn-scale-reset` will hook up the event to reset the image to the initial scale.

**_NOTE: The image is initially scaled to fit the width of the crop area_**

The below example is based on the example HTML structure defined above:

```javascript
// Handle to the DOM element to hook the events up to (doesn't have to be a jQuery object).
var cropper  = $('.ImageCropper');
// Initialize a new CropTool instance and pass in the DOM element.
var cropTool = new CropTool(cropper);

// You can add a 'CROPCOMPLETE' event listener to the DOM element given which will be fired
// every time a crop is performed and a new data URL is ready to get.
cropper.on(cropTool.CROPCOMPLETE, function (e) {});
```

The following are valid getters

```javascript
// Get the latest data URL.
cropper.getDataUrl();

// Get the initial scale applied to the image to get it to fit
// the width of the mask.
cropper.getInitialScale();

// Get the current scale applied to the image.
cropper.getScale();
```

The following are valid setters:

```javascript
// Set the scale to be applied to the image (0-1 not 0-100)
cropper.setScale(1);
```

The following are valid methods that can be called:

```javascript
// Call to run the crop, and get a new data URL.
cropper.crop();
```
