window.onload = function () {
  const gallery = document.getElementById("gallery");
  imageList.forEach(
    image => {
      const img = document.createElement("img");
      img.className = "lazy-image";
      img.alt = image.alt
      img.setAttribute("data-src", `images/${image.src}`);
      gallery.appendChild(img);
    }
  );
  const images = document.querySelectorAll(".lazy-image");
  createObserver();

  function createObserver() {
    let observer;
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.4
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(handleIntersect, options);
      images.forEach(image => {
        observer.observe(image);
      });
    } else {
      images.forEach(image => {
        image.src = image.dataset.src;
      });
    }
  }

  function handleIntersect(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let img = entry.target;
        img.src = img.dataset.src;
        img.classList.add("fade-in");
        observer.unobserve(img);
      }
    });
  }
}
