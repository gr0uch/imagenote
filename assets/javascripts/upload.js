/* eslint-disable */

var id = 'file-upload'
var upload = document.querySelector('.upload input[type="file"]')
var label = document.createElement('label')

if (upload) {
  upload.style.opacity = 0
  upload.setAttribute('id', id)
  label.setAttribute('for', id)
  setLabel()

  upload.parentNode.insertBefore(label, upload)
  upload.addEventListener('change', setLabel)
}

function setLabel () {
  label.innerHTML = upload.files.length ? upload.files.length === 1 ?
    upload.files[0].name : (upload.files.length + ' files selected.') :
    'Select files...'

  label.setAttribute('class', 'file-text' +
    (upload.files.length ? ' selected' : ''))
}
