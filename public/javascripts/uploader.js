const R_URL = 'https://rdev.tapas.io/file/upload/HERO_CARTOON';

class Uploader {
  deleteFiles() {
    console.log($('.js-check'));
  }

  shortFilename(filename) {
    const length = filename.length;
    if (length > 20) {
      return `${filename.substring(0, 10)}...${filename.substring(length - 7)}`;
    }
    return filename;
  }

  success(response) {
    const $preview = $('.js-preview');
    this.$toolbar.removeClass('d-none');

    let data = response;
    if (!response.length) {
      data = [response];
    }

    data.forEach(d => {
      const eFile = `<a target="_blank" href="${d.s3.url}" title="${d.filename}">${this.shortFilename(d.filename)}</a>`;
      $preview.append(`<li><input type="checkbox" class="js-check"> ${eFile}</li>`);
      // console.log(d.filename, d.s3.bucket_name, d.s3.src_keys[1], d.s3.src_keys[1], d.s3.desc_keys[1], d.s3.url);
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
    // this.progressToggleModal(true);
    const t = [{"s3":{"src_keys":["tmp/20180226/pc/f0/096bf966-4acd-4d00-b843-d226c87e100e.jpg","tmp/20180226/pc/f0/096bf966-4acd-4d00-b843-d226c87e100e_z.jpg"],"desc_keys":["pc/f0/096bf966-4acd-4d00-b843-d226c87e100e.jpg","pc/f0/096bf966-4acd-4d00-b843-d226c87e100e_z.jpg"],"url":"https://s3-us-west-2.amazonaws.com/r.tapas.io/tmp/20180226/pc/f0/096bf966-4acd-4d00-b843-d226c87e100e.jpg","bucket_name":"r.tapas.io","desc_bucket_name":"r.tapas.io"},"width":940,"height":1785,"size":46358,"filename":"c7ca14af_9dc3_470a_851c_615521044bb9_0.jpg","type":"HERO_CARTOON","rgb_hex":null},{"s3":{"src_keys":["tmp/20180226/pc/07/c9d053ee-54f9-406b-af83-a96132cd73c2.jpg","tmp/20180226/pc/07/c9d053ee-54f9-406b-af83-a96132cd73c2_z.jpg"],"desc_keys":["pc/07/c9d053ee-54f9-406b-af83-a96132cd73c2.jpg","pc/07/c9d053ee-54f9-406b-af83-a96132cd73c2_z.jpg"],"url":"https://s3-us-west-2.amazonaws.com/r.tapas.io/tmp/20180226/pc/07/c9d053ee-54f9-406b-af83-a96132cd73c2.jpg","bucket_name":"r.tapas.io","desc_bucket_name":"r.tapas.io"},"width":940,"height":1785,"size":116449,"filename":"c7ca14af_9dc3_470a_851c_615521044bb9_2.jpg","type":"HERO_CARTOON","rgb_hex":null}];
    this.success(t);
    this.$file.val('');

  //   jQuery.ajax({
  //     type        : 'POST',
  //     url         : R_URL,
  //     data        : formData,
  //     complete    : xhr => { console.log('complete', xhr); },
  //     success     : res => { console.log('success', res); },
  //     error       : xhr => { this.progressToggleModal(false); },
  //     processData : false,
  //     contentType : false,
  //     dataType    : 'json',
  //     xhr         : () => {
  //       let xhr;
  //       try {
  //         xhr = new window.XMLHttpRequest();
  //       } catch (e) {
  //       }
  //       if (xhr) {
  //         xhr.upload.addEventListener('progress', evt => {
  //           if (evt.lengthComputable) {
  //             const progress = evt.loaded / evt.total;
  //             this.progressBar.animate(progress, progress < 1 ? () => {} : () => {
  //               this.progressToggleModal(false);
  //             });
  //           }
  //         }, false);
  //         return xhr;
  //       }
  //     }
  //   });
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

    this.$file.on('change', (e) => {
      this.upload($uploaderForm[0], this.$file[0].files);
    });
  }
}

$(() => {
  new Uploader();
});

