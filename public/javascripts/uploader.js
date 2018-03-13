const R_URL = 'https://rdev.tapas.io/file/upload/HERO_CARTOON';

class Uploader {
  deleteFiles() {
    const checkboxs = $('.js-check:checked');
    if (checkboxs.length  === 0) {
      return;
    }

    if (window.confirm('Do you want to delete them?')) {
      checkboxs.each((index, checkbox) => {
        checkbox.closest('li').remove();
      });
    }
  }

  shortFilename(filename) {
    const length = filename.length;
    if (length > 20) {
      return `${filename.substring(0, 10)}...${filename.substring(length - 7)}`;
    }
    return filename;
  }

  drawPreview(previewData) {
    let data = previewData;
    if (previewData.length === undefined) {
      data = [previewData];
    }

    this.$toolbar.removeClass('d-none');
    data.forEach(d => {
      const fileData = {};
      const eFile = `<a target="_blank" href="${d.s3.url}" title="${d.filename}">${this.shortFilename(d.filename)}</a>`;
      const eHidden = `<input type="hidden" name="contents" value="${d.s3.desc_keys[1]}"/>
        <input type="hidden" name="filenames" value="${d.filename}"/>
        <input type="hidden" name="src_keys" value="${d.s3.src_keys[1]}"/>`;
      this.$preview.append(`<li><input type="checkbox" class="js-check"> ${eFile} ${eHidden}</li>`);
    });
  }

  upload (form, files) {
    if (files.length === 0) {
      return;
    }
    this.progressBar.set(0);
    const formData = new FormData(form);
    for (var i = 0; i < files.length; i++) {
      formData.append('files', files.item(i));
    }
    this.progressToggleModal(true);

    jQuery.ajax({
      type        : 'POST',
      url         : R_URL,
      data        : formData,
      complete    : xhr => { 
        this.$file.val(''); 
        this.progressToggleModal(false);
      },
      success     : res => { this.drawPreview(res); },
      error       : xhr => { alert((xhr.responseJSON || {}).message || xhr.statusText); },
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
          xhr.upload.addEventListener('progress', evt => {
            if (evt.lengthComputable) {
              this.progressBar.animate(evt.loaded / evt.total);
            }
          }, false);
          return xhr;
        }
      }
    });
  }

  progressToggleModal(on) {
    const $backdrop = $('.js-modal-backdrop');
    const $modal = $('.js-progress-modal');
    if (on) {
        $backdrop.removeClass('d-none').addClass('show');
        $modal.addClass('show d-block');
    } else {
      $modal.removeClass('show d-block');
      $backdrop.removeClass('show').addClass('d-none');
    }
  }

  initProgressBar(container) {
    return new ProgressBar.Line(container, {
      strokeWidth: 2,
      easing: 'easeInOut',
      color: '#007bff',
      trailColor: '#EEE',
      trailWidth: 1,
      svgStyle: { width: '100%', height: '100%' }
    });
  }

  initToolbar() {
    const $toolbar = $('.js-toolbar');
    $toolbar.find('.js-delete-file').on('click', this.deleteFiles);
    return $toolbar;
  }

  constructor() {
    const $uploaderForm = $('#uploader');
    this.$file = $('#file');
    this.progressBar = this.initProgressBar('#progress-bar');
    this.$toolbar = this.initToolbar();
    this.$preview = $('.js-preview');

    this.$file.on('change', e => {
      this.upload($uploaderForm[0], this.$file[0].files);
    });

    $('.js-post').on('click', e => {
      if (this.$preview.find('li').length > 0) {
        $('.js-upload-form').submit();
      } else {
        alert('Please add file(s).');
      }
    });

    const contents = JSON.parse($('.js-contents').val() || '[]');
    if (contents.length > 0) {
      this.drawPreview(contents);
    }
    $('.js-delete-form').on('submit', () => {
      return confirm('Are you sure?');
    });
  }
}

$(() => {
  new Uploader();
});

