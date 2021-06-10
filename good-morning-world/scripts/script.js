function dayOfYear(date) {
  return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}

const image = document.getElementById("photobooth")

const index = dayOfYear(new Date()) % 34;
image.src = `images/${index}.jpg`

const end = document.getElementById("end")
if (index === 0) {
  end.style.fontFamily = 'Parisienne, cursive';
  end.innerHTML = "~ The End ~"
}
