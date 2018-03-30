import Browser from './browser'
import Modal from './modal'

const Print = {
  send: (params, printFrame) => {
    // Append iframe element to document body
    document.getElementsByTagName('body')[0].appendChild(printFrame)

    // Get iframe element
    let iframeElement = document.getElementById(params.frameId)

    // Wait for iframe to load all content
    if (params.type === 'pdf' && (Browser.isIE() || Browser.isEdge())) {
      iframeElement.setAttribute('onload', finishPrint(iframeElement, params))
    } else {
      printFrame.onload = () => {
        if (params.type === 'pdf') {
          finishPrint(iframeElement, params)
        } else {
          // Get iframe element document
          let printDocument = (iframeElement.contentWindow || iframeElement.contentDocument)
          if (printDocument.document) printDocument = printDocument.document

          // Inject printable html into iframe body
          printDocument.body.innerHTML = params.htmlData

          // If printing image, wait for it to load inside the iframe (skip firefox)
          if (params.type === 'image') {
            loadIframeImages(printDocument, params).then(() => {
              finishPrint(iframeElement, params)
            })
          } else {
            finishPrint(iframeElement, params)
          }
        }
      }
    }
  }
}

function finishPrint (iframeElement, params) {
  iframeElement.focus()

  // If Edge or IE, try catch with execCommand
  if (Browser.isEdge() || (Browser.isIE())) {
    try {
      iframeElement.contentWindow.document.execCommand('print', false, null)
    } catch (e) {
      iframeElement.contentWindow.print()
    }
  }

  // Other browsers
  if (!Browser.isIE() && !Browser.isEdge()) {
    iframeElement.contentWindow.print()
  }

  // Remove embed on IE (just because it isn't 100% hidden when using h/w = 0)
  if (Browser.isIE() && params.type === 'pdf') {
    setTimeout(() => {
      iframeElement.parentNode.removeChild(iframeElement)
    }, 2000)
  }

  // If we are showing a feedback message to user, remove it
  if (params.showModal) {
    Modal.close()
  }
  if (params.onLoadingEnd) {
    params.onLoadingEnd()
  }
}

function loadIframeImages (printDocument, params) {
  let promises = []

  params.printable.forEach((image, index) => {
    promises.push(loadIframeImage(printDocument, index))
  })

  return Promise.all(promises)
}

function loadIframeImage (printDocument, index) {
  return new Promise(resolve => {
    let image = printDocument ? printDocument.getElementById('printableImage' + index) : null

    if (!image || typeof image.naturalWidth === 'undefined' || image.naturalWidth === 0) {
      setTimeout(() => {
        loadIframeImage(printDocument, index)
      }, 500)
    } else {
      resolve()
    }
  })
}

export default Print