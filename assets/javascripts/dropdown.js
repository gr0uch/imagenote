/* eslint-disable */

var close = require('./close')
var body = document.body
var checkboxLabels = document.querySelectorAll(
  '.dropdown > label, .top-line > label')
var header =  document.querySelector('body > header')
var editLabels =  document.querySelectorAll('.top-line label')
var checkboxes = document.querySelectorAll(
  'body > header input[type="checkbox"], .top-line input[type="checkbox"]')
var dropdowns = document.querySelectorAll(
  '.dropdown, .top-line form')
var tagInput = document.querySelector(
  '#filter-tag ~ form input[name="tag"]')
var tagLabel = document.querySelector(
  'label[for="filter-tag"]')

// Uncheck checkboxes.
Array.prototype.forEach.call(checkboxes, function (checkbox) {
  checkbox.addEventListener('click', function (event) {
    var current = this

    if (this.checked) {
      body.setAttribute(close.dataActive, 'true')
      close.unsetActiveCard()
      if (this.parentNode.className === 'top-line')
        this.parentNode.parentNode.setAttribute(close.dataActive, 'true')
      if (this.parentNode.className === 'dropdown')
        header.setAttribute(close.dataActive, 'true')
      else header.removeAttribute(close.dataActive)
    }
    else body.removeAttribute(close.dataActive)


    Array.prototype.forEach.call(checkboxes, function (checkbox) {
      if (checkbox !== current) checkbox.checked = false
    })

    event.stopPropagation()
  })
})

// Prevent event propagation on labels and dropdowns.
Array.prototype.forEach.call(checkboxLabels, stop)
Array.prototype.forEach.call(dropdowns, stop)

// Mouse hover over dropdown.
Array.prototype.forEach.call(checkboxLabels, function (element) {
  element.addEventListener('mouseover', function () {
    if (body.hasAttribute(close.dataActive) &&
    !element.parentNode.children[0].checked) element.click()
  })
})

// Close dropdowns on outside click.
window.addEventListener('click', close)

// Autofocus input.
if (tagLabel)
  tagLabel.addEventListener('click', function () {
    setTimeout(function () { tagInput.focus() }, 0)
  })

// Edit label autofocus.
Array.prototype.forEach.call(editLabels, function (element) {
  element.addEventListener('click', function () {
    setTimeout(function () {
      element.parentNode.lastChild.firstChild.focus()
    }, 0)
  })
})

// Escape key.
window.addEventListener('keydown', function (event) {
  if (event.keyCode === 27) close()
})

function stop (element) {
  element.addEventListener('click', function (event) {
    event.stopPropagation()
  })
}
