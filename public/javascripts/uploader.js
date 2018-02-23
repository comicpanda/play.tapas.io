const R_URL = 'https://rdev.tapas.io/file/upload/HERO_CARTOON';
const upload = (form, files) => {
  const formData = new FormData(form);
  for (var i = 0; i < files.length; i++) {
    formData.append('files', files.item(i));
  }

  jQuery.ajax({
    type        : 'POST',
    url         : R_URL,
    data        : formData,
    complete    : (a) => {console.log('complete', a);},
    success     : (a) => {console.log('success', a);},
    error       : (a) => {console.log('error', a);},
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

