/* eslint-disable */

var close = require('./close')
var body = document.body
var checkboxLabels = document.querySelectorAll(
  '.dropdown > label, .info .line > label')
var header =  document.querySelector('body > header')
var editLabels =  document.querySelectorAll('.info .line label')
var checkboxes = document.querySelectorAll(
  'body > header input[type="checkbox"], .info .line input[type="checkbox"]')
var dropdowns = document.querySelectorAll(
  '.dropdown, .info .line .popup')
var focusInputs = document.querySelectorAll(
  '#filter-tag ~ form input[name="tag"], #filter-id ~ form input[name="id"]')
var focusLabels = document.querySelectorAll(
  'label[for="filter-tag"], label[for="filter-id"]')

// Uncheck checkboxes.
Array.prototype.forEach.call(checkboxes, function (checkbox) {
  checkbox.addEventListener('click', function (event) {
    var current = this

    if (this.checked) {
      body.setAttribute(close.dataActive, 'true')
      close.unsetActiveCard()

      if (this.parentNode.className === 'line')
        this.parentNode.parentNode.parentNode.setAttribute(close.dataActive, 'true')
      if (this.parentNode.className === 'dropdown')
        header.setAttribute(close.dataActive, 'true')
      else header.removeAttribute(close.dataActive)

      event.isHandled = true
    }
    else body.removeAttribute(close.dataActive)


    Array.prototype.forEach.call(checkboxes, function (checkbox) {
      if (checkbox !== current) checkbox.checked = false
    })
  })
})

// Prevent closing on labels and dropdowns.
Array.prototype.forEach.call(checkboxLabels, stop)
Array.prototype.forEach.call(dropdowns, stop)

// Mouse hover over dropdown.
Array.prototype.forEach.call(checkboxLabels, function (element) {
  var timer

  element.addEventListener('mouseover', function () {
    if (body.hasAttribute(close.dataActive) &&
      header.hasAttribute(close.dataActive) &&
      !element.parentNode.firstChild.checked && !element.className)
      timer = setTimeout(function () {
        element.click()
      }, 100)
  })

  element.addEventListener('mouseout', function () {
    clearTimeout(timer)
  })
})

// Close dropdowns on outside click.
window.addEventListener('click', close)

// Autofocus input.
if (focusLabels.length)
  Array.prototype.forEach.call(focusLabels, function (element, i) {
    element.addEventListener('click', function () {
      setTimeout(function () { focusInputs[i].focus() }, 0)
    })
  })

// Edit label autofocus.
Array.prototype.forEach.call(editLabels, function (element) {
  element.addEventListener('click', function () {
    const className = element.className
    setTimeout(function () {
      element.parentNode.querySelector('.popup.' + className +
        ' input:first-of-type').focus()
    }, 0)
  })
})

// Escape key.
window.addEventListener('keydown', function (event) {
  if (event.keyCode === 27) close()
})

function stop (element) {
  element.addEventListener('click', function (event) {
    event.isHandled = true
  })
}
