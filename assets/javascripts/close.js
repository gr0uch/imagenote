/* eslint-disable */

var dataActive = 'data-active'
var body = document.body
var header =  document.querySelector('body > header')
var checkboxes = document.querySelectorAll(
  'body > header input[type="checkbox"], .top-line input[type="checkbox"]')

function close () {
  Array.prototype.forEach.call(checkboxes, function (checkbox) {
    checkbox.checked = false
    body.removeAttribute(dataActive)
    header.removeAttribute(dataActive)
    close.unsetActiveCard()
  })
}

close.dataActive = 'data-active'

close.unsetActiveCard = function () {
  Array.prototype.forEach.call(document.querySelectorAll('.card'),
    function (element) { element.removeAttribute(dataActive) })
}

module.exports = close
