let number = 1;
const image = document.getElementById("photobooth")

function tomorrow() {
  if (number === 33) {
    number = 0
  }
  number ++
  image.src = `images/${number}.jpg`
}

function yesterday() {
  if (number === 1) {
    number = 34
  }
  number--
  image.src = `images/${number}.jpg`
}