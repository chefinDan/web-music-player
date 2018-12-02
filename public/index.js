//Client side js here
// alert('Client Side js loaded');

function handleFileUpload() {

  var filePath = document.getElementById('file-input').value;

  if (!filePath.includes('/')) {
    alert("Enter a valid path!");
  } else {
    var postRequest = new XMLHttpRequest();
    postRequest.open('POST', '/songs/upload');

    var requestBody = JSON.stringify({
      path: filePath,
    });

    postRequest.setRequestHeader('Content-Type', 'application/json');
    postRequest.send(requestBody);

    postRequest.onreadystatechange=(e)=>{
      if(postRequest.readyState == 4) {
        console.log('ready');
        var getRequest = new XMLHttpRequest();
        // var requestURL = '/library';
        getRequest.open('GET', '/library');
        getRequest.send();
      }
      else {
        console.log('not ready');
      }
    }
    hideModal();
  }

}


function showModal() {

  var modal = document.getElementById('add-photo-modal');
  var modalBackdrop = document.getElementById('modal-backdrop');

  modal.classList.remove('hidden');
  modalBackdrop.classList.remove('hidden');

}


function clearModalInputs() {

  var modalInputElements = document.querySelectorAll('#add-photo-modal input')
  for (var i = 0; i < modalInputElements.length; i++) {
    modalInputElements[i].value = '';
  }

}


function hideModal() {
  // var getRequest = new XMLHttpRequest();
  // var requestURL = '/';
  // getRequest.open('GET', '/', true);
  // getRequest.send();
  // console.log(getRequest.readyState);

  // var requestBody

  // postRequest.setRequestHeader('Content-Type', 'text/plain');

  var modal = document.getElementById('add-photo-modal');
  var modalBackdrop = document.getElementById('modal-backdrop');

  modal.classList.add('hidden');
  modalBackdrop.classList.add('hidden');

  clearModalInputs();



}


/*
 * Wait until the DOM content is loaded, and then hook up UI interactions, etc.
 */
window.addEventListener('DOMContentLoaded', function () {



  var addPhotoButton = document.getElementById('add-photo-button');
  if (addPhotoButton) {
    addPhotoButton.addEventListener('click', showModal);
  }

  var modalAcceptButton = document.getElementById('modal-accept');
  if (modalAcceptButton) {
    modalAcceptButton.addEventListener('click', handleFileUpload);
  }

  var modalHideButtons = document.getElementsByClassName('modal-hide-button');
  for (var i = 0; i < modalHideButtons.length; i++) {
    modalHideButtons[i].addEventListener('click', hideModal);
  }

});
