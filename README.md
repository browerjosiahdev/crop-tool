#CropTool.js

CropTool.js is a lightweight JavaScript library used to take a DOM element you give it, and hook up the events
required to make cropping an image client side simple. There are some basic structural rules around how your
DOM element has to be setup, but other than that you can style as you desire.

**_NOTE: jQuery is required for this library to work._**

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
