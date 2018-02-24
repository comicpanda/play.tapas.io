const R_URL = 'https://rdev.tapas.io/file/upload/HERO_CARTOON';
const upload = (form, files) => {
  const formData = new FormData(form);
  for (var i = 0; i < files.length; i++) {
    formData.append('files', files.item(i));
  }
  var bar = new ProgressBar.Line('#progress-bar', {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 1400,
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {width: '100%', height: '100%'}
  });

bar.animate(1.0);  // Number from 0.0 to 1.0

  jQuery.ajax({
    type        : 'POST',
    url         : R_URL,
    data        : formData,
    complete    : xhr => {console.log('complete', xhr);},
    success     : (res) => {console.log('success', res);},
    error       : xhr => {console.log('error', xhr);},
    processData : false,
    contentType : false,
    dataType    : 'json',
    xhr         : () => {
      let xhr;
      try {
        xhr = new window.XMLHttpRequest();
      } catch (e) {
      }
      if (xhr) {
        xhr.upload.addEventListener('progress', function (evt) {
          if (evt.lengthComputable) {
            console.log('addEventListener', evt)
          }
        }, false);
        return xhr;
      }
    }
  });
}

$(() => {
  const $file = $('#file');
  const $uploaderForm = $('#uploader');
  $file.on('change', (e) => {
    upload($uploaderForm.remove()[0], $file[0].files);
  });
});

