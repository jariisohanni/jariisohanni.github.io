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
      { maxWidth: 640*4 },
      { maxHeigth: 480*4 }
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
     postImage(blob,url)
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

function postImage(blobData,file,imageB64)
{

    document.querySelector('#results').style.display = '';
    document.querySelector('#results').innerHTML = "Processing...";


    const API_ENDPOINT = "https://vast-peak-10418.herokuapp.com/detectLabels";
    const request = new XMLHttpRequest();
    
    request.open("POST", API_ENDPOINT, true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = () =>
    {
      if (request.readyState === 4 && request.status === 200) 
      {
        const obj = JSON.parse(request.responseText)

        console.log(request.responseText);
        if(obj.CustomLabels != undefined)
        {
 
          processReply(blobData,obj)
        }
        else
        {
          document.querySelector('#results').style.display = '';
          document.querySelector('#results').innerHTML = "error: " + obj.message;
  
        }
      }
      else if(request.status != 200) 
      {
        document.querySelector('#results').style.display = '';
        document.querySelector('#results').innerHTML = "error: " + request.status +", " + request.statusText;
      }
    };
    var data = JSON.stringify({"key": "1", "engine": "AWS", "b64image": blobData});
    request.send(data);

}

function processReply(imageb64, json_data)
{
    var div = document.getElementById('results');
    document.querySelector('#results').style.display = '';
    document.querySelector('#canvas').style.display = '';



    //Make image from source
    var image = new Image();
    //img = new Image();

    image.onload = function() 
    {
      //Make new canvas and paint image to it
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
  
      var MAX_WIDTH = 640;
      var MAX_HEIGHT = 480;
  
      var width = image.width;
      var height = image.height;
  
      // Change the resizing logic
      if (width > height) {
          if (width > MAX_WIDTH) {
              height = height * (MAX_WIDTH / width);
              width = MAX_WIDTH;
          }
      } else {
          if (height > MAX_HEIGHT) {
              width = width * (MAX_HEIGHT / height);
              height = MAX_HEIGHT;
          }
      }
  
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);
  
      
     //r json_data = JSON.parse(data);
  
      if(json_data.CustomLabels == undefined || json_data.CustomLabels.length == 0)
          div.innerHTML = "No results";
      else
      {        
          div.innerHTML = "Results:<br>";
  
          json_data.CustomLabels.forEach(Element => 
          {
  
  
              
              div.innerHTML += Element.Name + "(" +Element.Confidence +  ")<br>";
  
              var x = Element.Geometry.BoundingBox.Left*width;
              var y = Element.Geometry.BoundingBox.Top*height;
              var w = Element.Geometry.BoundingBox["Width"]*width;
              var h = Element.Geometry.BoundingBox.Height*height;
  
              // Actual resizing
  
              ctx.beginPath();
              ctx.lineWidth = "2";
              ctx.strokeStyle = "green";
              ctx.rect(x, y, w, h);
              ctx.stroke();
              // Show resized image in preview element
           
  
          });
        }
        var dataurl = canvas.toDataURL(image.type);
        document.querySelector('#canvas').src = dataurl;
    }

    image.src = imageb64;

    

    
    
    
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


function imageFromFile(filename)
{
    if (filename !== null) 
    {
        var MIMEType = filename.type;

        // decode base64 string, remove space for IE compatibility
        var reader = new FileReader();

        reader.onload = function(readerEvt) 
        {

                // This is done just for the proof of concept
            var binaryString = readerEvt.target.result;
            var base64 = btoa(binaryString);
            var blobfile = atob(btoa(binaryString));


            blobFromBlobFile = base64toBlob(base64, MIMEType, 512);
            blobURL = URL.createObjectURL(blobFromBlobFile);

            postImage("data:image/jpeg;base64,"+base64,binaryString)
        }

        reader.readAsBinaryString(filename);
      }

}

function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
  else
      byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type:mimeString});
}