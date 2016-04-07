/* eslint-disable */

var c = require('./close')
var body = document.body
var zoom = document.createElement('div')
var imageContainers = document.querySelectorAll('.overlay a')
var index

zoom.setAttribute('id', 'zoom')
body.appendChild(zoom)

Array.prototype.forEach.call(imageContainers, function (a, i) {
  a.addEventListener('click', function (event) {
    index = i
    setImage()
    body.setAttribute(c.dataActive, 'true')
    zoom.setAttribute(c.dataActive, 'true')
    event.preventDefault()
    event.isHandled = true
  })
})

window.addEventListener('keydown', function (event) {
  // Escape key.
  if (event.keyCode === 27) {
    c()
    close()
  }

  // Arrow left.
  if (event.keyCode === 37) {
    if (index > 0) index--
    setImage()
  }

  // Arrow right.
  if (event.keyCode === 39) {
    if (index < imageContainers.length - 1) index++
    setImage()
  }
})

window.addEventListener('click', close)

function close (event) {
  if (event && event.isHandled) return null
  zoom.removeAttribute(c.dataActive)
}

function setImage () {
  var a = imageContainers[index]
  zoom.innerHTML =
    '<img src="' + a.firstChild.getAttribute('src') + '">' +
    '<img src="' + a.getAttribute('href') + '">'
}
