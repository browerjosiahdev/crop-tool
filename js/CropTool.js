var CropTool = Class.extend(function () {
  this.CROPCOMPLETE = 'CROP_COMPLETE'; // Event fired when the crop is complete.

  var _dataUrl; // Handle to the data url from the latest crop.
  var _debug; // Should we show the debug logs?
  var _mask; // Handle to the image mask jquery element.
  var _moveOffset; // Left/top values defining the offset of the mouse (touch) to the image top/left when moving.
  var _image; // Handle to the image jquery element.
  var _initialScale; // Value of what the image is initially scaled to in order to fit the crop area.
  var _initialDimensions; // Height/width dimensions of the origin image size.
  var _scale; // Value of the current image scale.
  var _scope; // jquery handle to the DOM element being used as the crop tool.
  var _rotation; // Value of the current image rotation in degrees.

  /**
   * @method initializeEvents (private)
   *
   * Initialize the events on the supported crop tools.
  **/
  function initializeEvents () {
    this.handleCrop           = onCropBtnClick.bind(this);
    this.handleRotateLeft     = onRotateLeftBtnClick.bind(this);
    this.handleRotateRight    = onRotateRightBtnClick.bind(this);
    this.handleScaleDown      = onScaleDownBtnClick.bind(this);
    this.handleScaleFull      = onScaleFullBtnClick.bind(this);
    this.handleScaleReset     = onScaleResetBtnClick.bind(this);
    this.handleScaleUp        = onScaleUpBtnClick.bind(this);
    this.handleImageMouseDown = onImageMouseDown.bind(this);
    this.handleMouseMove      = onMouseMove.bind(this);
    this.handleMouseUp        = onMouseUp.bind(this);

    _scope.find('.btn-crop').on('click', this.handleCrop);
    _scope.find('.btn-rotate-left').on('click', this.handleRotateLeft);
    _scope.find('.btn-rotate-right').on('click', this.handleRotateRight);
    _scope.find('.btn-scale-down').on('click', this.handleScaleDown);
    _scope.find('.btn-scale-full').on('click', this.handleScaleFull);
    _scope.find('.btn-scale-reset').on('click', this.handleScaleReset);
    _scope.find('.btn-scale-up').on('click', this.handleScaleUp);
    _image.on('mousedown touchstart', this.handleImageMouseDown);
  }

  /**
   * @method initializeImage (private)
   *
   * Initialize the image being cropped.
  **/
  function initializeImage () {
    _mask  = _scope.find('.crop-mask');
    _image = _mask.find('.crop-image');

    if (!_mask.length) {
      console.error('CropTool.initializeImage() => no mask found. Make sure you have an element with class of "crop-mask" within the scope you passed in to the constructor.');
    }
    if (!_image.length) {
      console.error('CropTool.initializeImage() => no image found. Make sure you have an element with class of "crop-image" within the "crop-mask" element.');
    }

    var domImage = _image.get(0);
    _initialDimensions = {
      height: Math.max(_image.height(), domImage.height, domImage.clientHeight, domImage.naturalHeight),
      width: Math.max(_image.width(), domImage.width, domImage.clientWidth, domImage.naturalWidth)
    };
    _initialScale;

    var widthScale  = _mask.width() / _initialDimensions.width,
        heightScale = _mask.height() / _initialDimensions.height;

    _initialScale = Math.max(widthScale, heightScale);

    if (_debug) {
        console.log('CropTool.initializeImage() => ');
        console.log('widthScale == ' + widthScale);
        console.log('heightScale == ' + heightScale);
        console.log('_initialDimensions == ');
        console.dir(_initialDimensions);
    }

    _rotation = 0;
    this.setScale(_initialScale);
    this.centerImage();
  }

  /**
   * @method onCropBtnClick (private)
   *
   * Called when the crop tool is clicked in order to calculate the crop, and generate the data url.
   *
   * @param e - Handle to the click event data.
  **/
  function onCropBtnClick (e) {
    this.crop();
  }

  /**
   * @method onImageMouseDown (private)
   *
   * Called when a mousedown or touchstart event is fired on the image.
   *
   * @param e - Handle to the event data.
  **/
  function onImageMouseDown (e) {
    e.preventDefault();

    var imageOffset = _image.offset(),
        maskOffset  = _mask.offset();

    _moveOffset = {
      left: (
        e.originalEvent && e.originalEvent.touches
          ? e.originalEvent.touches[0].pageX - (imageOffset.left - maskOffset.left)
          : e.clientX - (imageOffset.left - maskOffset.left)
      ),
      top: (
        e.originalEvent && e.originalEvent.touches
          ? e.originalEvent.touches[0].pageY - (imageOffset.top - maskOffset.top)
          : e.clientY - (imageOffset.top - maskOffset.top)
      )
    };

    $(document).on('mousemove touchmove', this.handleMouseMove);
    $(document).on('mouseup touchend', this.handleMouseUp);
  }

  /**
   * @method onMouseMove (private)
   *
   * Called when the mouse moves on the document while the image is being dragged.
   *
   * @param e - Handle to the event data.
  **/
  function onMouseMove (e) {
    var mousePos = {
      left: (
        e.originalEvent && e.originalEvent.touches
          ? e.originalEvent.touches[0].pageX
          : e.clientX
      ),
      top: (
        e.originalEvent && e.originalEvent.touches
          ? e.originalEvent.touches[0].pageY
          : e.clientY
      )
    };

    _image.css({
      left: ((mousePos.left - _moveOffset.left) + 'px'),
      top: ((mousePos.top - _moveOffset.top) + 'px')
    });
  }

  /**
   * @method onMouseUp (private)
   *
   * Called when the mouse down ends while the image is being dragged.
   *
   * @param e - Handle to the event data.
  **/
  function onMouseUp (e) {
    $(document).off('mousemove touchmove', this.handleMouseMove);
    $(document).off('mouseup touchend', this.handleMouseUp);
  }

  /**
   * @method onRotateLeftBtnClick (private)
   *
   * Called when the rotate left tool is clicked to rotate the tool to rotate the image 90 degrees counter-clockwise.
   *
   * @param e - Handle to the event data.
  **/
  function onRotateLeftBtnClick (e) {
    var degrees = Math.max(Math.min((parseInt($(e.currentTarget).data('rotate-by')) || 90), 360), 0);

    if (_debug) {
      console.log('CropTool.onRotateLeftBtnClick() => ');
      console.log('rotate by == ' + degrees);
    }

    _rotation -= degrees;
    if (_rotation < 0) {
      _rotation += 360;
    }
    this.setRotation(_rotation);
  }

  /**
   * @method onRotateRightBtnClick (private)
   *
   * Called when the rotate right tool is clicked to rotate the tool to rotate the image 90 degrees clockwise.
   *
   * @param e - Handle to the event data.
  **/
  function onRotateRightBtnClick (e) {
    var degrees = Math.max(Math.min((parseInt($(e.currentTarget).data('rotate-by')) || 90), 360), 0);

    if (_debug) {
      console.log('CropTool.onRotateRightBtnClick() => ');
      console.log('rotate by == ' + degrees);
    }

    _rotation += degrees;
    if (_rotation > 360) {
      _rotation -= 360;
    }
    this.setRotation(_rotation);
  }

  /**
   * @method onScaleDownBtnClick (private)
   *
   * Called when the scale down tool is clicked to scale the image down by the defined percent.
   *
   * @param e - Handle to the event data.
  **/
  function onScaleDownBtnClick (e) {
    var scalePercent = parseFloat($(e.currentTarget).data('scale-by')) || 0.1;

    if (_debug) {
      console.log('CropTool.onScaleDownBtnClick() => ');
      console.log('scale by == ' + scalePercent);
    }

    this.setScale(_scale - (_scale * scalePercent));
  }

  /**
   * @method onScaleFullBtnClick (private)
   *
   * Called when the scale full tool is clicked to scale the image to full size.
   *
   * @param e - Handle to the event data.
  **/
  function onScaleFullBtnClick (e) {
    this.setScale(1);

    // Set the image back to 0x0, otherwise it might go
    // off screen depending on how much it is being scaled.
    _image.css({ left: 0, top: 0 });
  }

  /**
   * @method onScaleResetBtnClick (private)
   *
   * Called when the scale reset tool is clicked to scale the image to the initial state.
   *
   * @param e - Handle to the event data.
  **/
  function onScaleResetBtnClick (e) {
    this.setScale(_initialScale);
    this.centerImage();
  }

  /**
   * @method onScaleUpBtnClick (private)
   *
   * Called when the scale up tool is clicked to scale the image up by the defined percent.
   *
   * @param e - Handle to the event data.
  **/
  function onScaleUpBtnClick (e) {
    var scalePercent = parseFloat($(e.currentTarget).data('scale-by')) || 0.1;

    if (_debug) {
      console.log('CropTool.onScaleUpBtnClick() => ');
      console.log('scale by == ' + scalePercent);
    }

    this.setScale(_scale + (_scale * scalePercent));
  }

  /**
   * @method centerImage (public)
   *
   * Called to center the image in the mask area.
  **/
  this.centerImage = function () {
    var imageDetails = this.getImageDetails();
    _image.css({
      left: (((_mask.width() - imageDetails.width) / 2) + 'px'),
      top: (((_mask.height() - imageDetails.height) / 2) + 'px')
    });
  };

  /**
   * @method constructor (public)
   *
   * Called when a new instance of the class is initialized.
   *
   * @param toolDom - Handle to the DOM element to be used as the crop tool.
   * @param debug - (false) true/false value of whether the debug logs should be shown.
  **/
  this.constructor = function (toolDom, debug) {
    if (toolDom) {
      _debug = !!debug; // Make sure the debug value is a boolean.
      _scope = toolDom.length
        ? toolDom
        : $(toolDom);

      initializeImage.call(this);
      initializeEvents.call(this);
    } else {
      console.error('CropTool.constructor() => invalid DOM element given.');
    }
  };

  /**
   * @method crop (public)
   *
   * Called to generate the data url for the cropped image.
  **/
  this.crop = function () {
    if (!_image.length) {
      console.error('CropTool.crop() => trying to crop image when no image exists.');
      return;
    }

    // Create a canvas to draw the cropped image on.
    var canvas = document.createElement('canvas');
    canvas.height         = _mask.height();
    canvas.style.left     = '-1000%';
    canvas.style.position = 'absolute';
    canvas.style.top      = '-1000%';
    canvas.width          = _mask.width();
    $(document.body).append(canvas);

    if (canvas) {
      var context = canvas.getContext('2d');
      var imageDetails = this.getImageDetails();
      var canvasDetails = { // Calculate the details for how to draw the image on the canvas.
        height: 0,
        image: _image.get(0),
        sheight: Math.round((imageDetails.height - imageDetails.top) / _scale),
        swidth: Math.round((imageDetails.width - imageDetails.left) / _scale),
        sx: Math.round(
          imageDetails.left < 0
            ? Math.abs(imageDetails.left / _scale)
            : 0
        ),
        sy: Math.round(
          imageDetails.top < 0
            ? Math.abs(imageDetails.top / _scale)
            : 0
        ),
        width: 0,
        x: Math.round(
          imageDetails.left > 0
            ? imageDetails.left
            : 0
        ),
        y: Math.round(
          imageDetails.top > 0
            ? imageDetails.top
            : 0
        )
      };
      canvasDetails.height = Math.round(canvasDetails.sheight * _scale);
      canvasDetails.width  = Math.round(canvasDetails.swidth * _scale);

      if (_debug) {
        console.log('CropTool.crop() => ');
        console.log('image == ' + canvasDetails.image);
        console.log('sx == ' + canvasDetails.sx);
        console.log('sy == ' + canvasDetails.sy);
        console.log('swidth == ' + canvasDetails.swidth);
        console.log('sheight == ' + canvasDetails.sheight);
        console.log('x == ' + canvasDetails.x);
        console.log('y == ' + canvasDetails.y);
        console.log('width == ' + canvasDetails.width);
        console.log('height == ' + canvasDetails.height);
      }

      // Draw the image.
      context.drawImage(
        canvasDetails.image,
        canvasDetails.sx,
        canvasDetails.sy,
        canvasDetails.swidth,
        canvasDetails.sheight,
        canvasDetails.x,
        canvasDetails.y,
        canvasDetails.width,
        canvasDetails.height
      );

      // Get the data url.
      _dataUrl = canvas.toDataURL('image/png', 1);

      // Trigger a crop complete event.
      _scope.trigger(this.CROPCOMPLETE);

      // Remove the canvas from the DOM.
      $(canvas).remove();
    }
  };

  /**
   * @method getDataUrl (public)
   *
   * Called to get the most recent data url generated by the crop.
   *
   * @returns the data url string.
  **/
  this.getDataUrl = function () {
    return _dataUrl;
  };

  /**
   * @method getImageDetails (public)
   *
   * Called to get the image details such as left, top, etc.
   *
   * @returns current details for the image.
  **/
  this.getImageDetails = function () {
    var position = _image.position();
    return {
      height: _image.height(),
      left: position.left,
      top: position.top,
      width: _image.width()
    };
  };

  /**
   * @method getInitialScale (public)
   *
   * Called to get the initial scale applied to the image
   *
   * @returns the initial scale number
  **/
  this.getInitialScale = function () {
    return _initialScale;
  };

  /**
   * @method getScale/setScale (public)
   *
   * Called to get/set the current scale applied to the image.
   *
   * @param scale - One based number for the new scale to be applied to the image
   *
   * @returns current scale applied to the image.
  **/
  this.getScale = function () {
    return _scale;
  };
  this.setScale = function (scale) {
    _scale = scale;
    if (_image.length) {
      _image.css({
          height: ((_initialDimensions.height * _scale) + 'px'),
          width: ((_initialDimensions.width * _scale) + 'px')
      });

      if (_debug) {
        console.log('CropTool.setScale() => ');
        console.log('_scale == ' + _scale);
      }
    } else {
      console.warn('CropTool.setScale() => trying to set scale when no image is defined.');
    }
  };

  /**
   * @method getRotation/setRotation (public)
   *
   * Called to get/set the current rotation (in degrees) applied to the image.
   *
   * @param degrees - Rotation in degrees to apply to the image.
   *
   * @returns current rotation applied to the image.
  **/
  this.getRotation = function () {
    return _rotation;
  };
  this.setRotation = function (degrees) {
    _rotation = Math.max(Math.min(degrees, 360), 0);
    if (_image.length) {
      _image.css({
        mozTransform: 'rotateZ(' + degrees + 'deg)',
        msTransform: 'rotateZ(' + degrees + 'deg)',
        oTransform: 'rotateZ(' + degrees + 'deg)',
        transform: 'rotateZ(' + degrees + 'deg)',
        webkitTransform: 'rotateZ(' + degrees + 'deg)'
      });

      if (_debug) {
        console.log('CropTool.setRotation() => ');
        console.log('_rotation == ' + _rotation);
      }
    } else {
      console.warn('CropTool.setRotation() => trying to set rotation when no image is defined.');
    }
  };
});
