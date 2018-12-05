//Client side js here
// alert('Client Side js loaded');

function updateSearch() {
    var album = document.getElementById("filter-album").value.toLowerCase();
    var artist = document.getElementById("filter-artist").value.toLowerCase();
    var genre = document.getElementById("filter-genre").value.toLowerCase();
    var title = document.getElementById("filter-title").value.toLowerCase();
    var year = document.getElementById("filter-year").value.toLowerCase();

    var libraryContent = document.getElementById("library-content");
    var size = libraryContent.children.length;
    var tracks = [];

    for (var i = 0; i < size; i++) {
        if (album.length == 0 && artist.length == 0 && genre.length == 0 && title.length == 0 && year.length == 0) {
            alert("Please enter at least one field.");
            break;
        }

        var track = libraryContent.firstElementChild.firstElementChild.firstElementChild;
        if (track.getAttribute("data-title").toLowerCase() == title || title.length == 0) {
            //title pass
            if (track.getAttribute("data-artist").toLowerCase() == artist || artist.length == 0) {
                //artist pass
                if (track.getAttribute("data-album").toLowerCase() == album || album.length == 0) {
                    //album pass
                    if (track.getAttribute("data-genre").toLowerCase().includes(genre) || genre.length == 0) {
                        //genre pass
                        if (track.getAttribute("data-year") == year || year.length == 0) {
                            //year pass
                            //all criteria met
                            tracks.push(libraryContent.firstElementChild);
                        }
                    }
                }
            }
        }
        libraryContent.removeChild(libraryContent.firstElementChild);
    }

    //add all matching tracks to DOM
    for (var i = 0; i < tracks.length; i++) {
        libraryContent.appendChild(tracks[i]);
    }
}

function handleFileUpload() {
  //get the File object from <input>
  console.log('here');
  var file = document.querySelector('#file-input').files[0];

  // Only accpet mp3 files
  if (!file.name.includes('.mp3')) {
    alert("This application only accepts mp3 files");
  } else {
    // create FormData object from scratch
    var formData = new FormData();
    // give it two key:value pairs, name and track(File object)
    formData.append('name', file.name);
    formData.append('track', file);

    console.log('in handleFileUpload');

    // create XMLHttpRequest Object and set method to POST and url to root
    var postRequest = new XMLHttpRequest();
    postRequest.open('POST', '/', true);
    // when request is fully loaded report the status
    postRequest.onload = (event) => {
      if (postRequest.status == 200 || 201) {
        console.log("Uploaded!");
        window.location = "/library";
        hideModal();
      } else {
      console.log("Error " + postRequest.status + " occurred when trying to upload your file.");
      }
    }
    console.log('about to send formdata');
    postRequest.send(formData);
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

    var searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', updateSearch);
    }

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
