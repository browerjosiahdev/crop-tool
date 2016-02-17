var CropTool = Class.extend(function () {
  this.CROPCOMPLETE = 'CROP_COMPLETE'; // Event fired when the crop is complete.

  var _dataUrl; // Handle to the data url from the latest crop.
  var _mask; // Handle to the image mask jquery element.
  var _moveOffset; // Left/top values defining the offset of the mouse (touch) to the image top/left when moving.
  var _image; // Handle to the image jquery element.
  var _initialScale; // Value of what the image is initially scaled to in order to fit the crop area.
  var _initialDimensions; // Height/width dimensions of the origin image size.
  var _scale; // Value of the current image scale.
  var _scope; // jquery handle to the DOM element being used as the crop tool.

  /**
   * @method initializeEvents (private)
   *
   * Initialize the events on the supported crop tools.
  **/
  function initializeEvents () {
    this.handleCrop           = onCropBtnClick.bind(this);
    this.handleScaleDown      = onScaleDownBtnClick.bind(this);
    this.handleScaleReset     = onScaleResetBtnClick.bind(this);
    this.handleScaleUp        = onScaleUpBtnClick.bind(this);
    this.handleImageMouseDown = onImageMouseDown.bind(this);
    this.handleMouseMove      = onMouseMove.bind(this);
    this.handleMouseUp        = onMouseUp.bind(this);

    _scope.find('.btn-crop').on('click', this.handleCrop);
    _scope.find('.btn-scale-down').on('click', this.handleScaleDown);
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

    if (_mask.width() != _image.width()) {
      _initialScale      = _mask.width() / _image.width();
      _initialDimensions = { height: _image.height(), width: _image.width() };

      this.setScale(_initialScale);
    }
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
   * @method onScaleDownBtnClick (private)
   *
   * Called when the scale down tool is clicked to scale the image down by the defined percent.
   *
   * @param e - Handle to the event data.
  **/
  function onScaleDownBtnClick (e) {
    var scalePercent = parseInt($(e.currentTarget).data('scale-by')) || 0.1;
    this.setScale(_scale - (_scale * scalePercent));
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
  }

  /**
   * @method onScaleUpBtnClick (private)
   *
   * Called when the scale up tool is clicked to scale the image up by the defined percent.
   *
   * @param e - Handle to the event data.
  **/
  function onScaleUpBtnClick (e) {
    var scalePercent = parseInt($(e.currentTarget).data('scale-by')) || 0.1;
    this.setScale(_scale + (_scale * scalePercent));
  }

  /**
   * @method constructor (public)
   *
   * Called when a new instance of the class is initialized.
   *
   * @param toolDom - Handle to the DOM element to be used as the crop tool.
  **/
  this.constructor = function (toolDom) {
    if (toolDom) {
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
      var imageDetails = { // Get the current image details.
        height: _image.height(),
        left: _image.position().left,
        top: _image.position().top,
        width: _image.width()
      };
      var canvasDetails = { // Calculate the details for how to draw the image on the canvas.
        height: 0,
        image: _image.get(0),
        sheight: Math.round((imageDetails.height - imageDetails.top) / _scale),
        swidth: Math.round((imageDetails.width - imageDetails.left) / _scale),
        sx: (
          imageDetails.left < 0
            ? Math.abs(imageDetails.left / _scale)
            : 0
        ),
        sy: (
          imageDetails.top < 0
            ? Math.abs(imageDetails.top / _scale)
            : 0
        ),
        width: 0,
        x: (
          imageDetails.left > 0
            ? imageDetails.left
            : 0
        ),
        y: (
          imageDetails.top > 0
            ? imageDetails.top
            : 0
        )
      };
      canvasDetails.height = Math.round(canvasDetails.sheight * _scale);
      canvasDetails.width  = Math.round(canvasDetails.swidth * _scale);

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
    } else {
      console.error('CropTool.setScale() => trying to set scale when no image is defined.');
    }
  };
});
