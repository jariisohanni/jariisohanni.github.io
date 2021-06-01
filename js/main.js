window.onload = () => {
    'use strict';
  
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
               .register('./sw.js');
    }
  }

    var takePhotoButton = document.querySelector('#take-photo');
    var imageCapture = null
    takePhotoButton.onclick = takePhoto;



  document.querySelector('#get-access').addEventListener('click', async function init(e) 
  {
    document.querySelector('#results').style.display = 'none';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            mandatory: { minAspectRatio: 1.333, maxAspectRatio: 1.334 /*, /facingMode: ‘user’*/},
    optional: [
      { minFrameRate: 60 },
      { maxWidth: 640 },
      { maxHeigth: 480 }
    ]
          }
      }) .then(gotMedia)

    } catch (error) {
      alert(`${error.name}`)
      console.error(error)
    }
  })

  function gotMedia(mediaStream) {
    const mediaStreamTrack = mediaStream.getVideoTracks()[0];
    imageCapture = new ImageCapture(mediaStreamTrack);

    document.querySelector('video').srcObject = mediaStream
    document.querySelector('#get-access').style.display = 'none';
    document.querySelector('#take-photo').style.display = '';
    document.querySelector('#video').style.display = '';
    document.querySelector('#canvas').style.display = 'none';

  }

// Get a Blob from the currently selected camera source and
// display this with an img element.
function takePhoto() {
  imageCapture.takePhoto().then(function(blob) {
    
    console.log('Took photo:', blob);
    url = URL.createObjectURL(blob);

    img = new Image();                         // create a temp. image object
    
    img.onload = function()                     // handle async image loading
    {                    
      URL.revokeObjectURL(this.src);             // free memory held by Object URL
     postImage(blob)
    };

    img.src = url; 

    document.querySelector('#results').style.display = 'none';
    document.querySelector('#video').style.display = 'none';

    document.querySelector('#get-access').style.display = '';
    document.querySelector('#take-photo').style.display = 'none';

  }).catch(function(error) {
    console.log('takePhoto() error: ', error);
  });
}

function postImage(blobData)
{

    const formData = new FormData()
    formData.append('file', blobData, 'test')

    var localServer = "http://127.0.0.1:8000/recognise"
    var remoteServer = "https://cryptic-springs-43803.herokuapp.com/recognise"

    fetch(remoteServer, {method:"POST", body:formData})
            .then(response => {
                if (response.ok) return response;
                else throw Error(`Server returned ${response.status}: ${response.statusText}`)
            })
            .then(r => r.json())
            .then(data => {
                processReply(data)
              })
            .catch(err => {
                alert(err);
            });
}

function processReply(data)
{
    var div = document.getElementById('results');
    document.querySelector('#results').style.display = '';

    var json_data = JSON.parse(data);

    if(json_data.items.length == 0)
        div.innerHTML = "No results";
    else
    {
        var img_data = base64toBlob(json_data.img)
        var objectURL = URL.createObjectURL(img_data);

        document.querySelector('#canvas').style.display = '';
        var canvas = document.querySelector('#canvas');
        canvas.src = objectURL
        
        div.innerHTML = "Results:<br>";
        
        json_data.items.forEach(Element => {


            
            div.innerHTML += Element.label;

        });

    }
    
    
}

function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}